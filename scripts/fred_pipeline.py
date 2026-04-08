"""
FRED Indicators Pipeline for Magnastats
Fetches ~30 macro series from FRED and writes to data/fred_indicators.parquet.
On subsequent runs, appends only new observations.
"""

import os
import sys
import time
from pathlib import Path

import pandas as pd
import yaml
from fredapi import Fred

# ── Paths ────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "fred_indicators.yaml"
OUTPUT_PATH = ROOT / "data" / "fred_indicators.parquet"


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)["series"]


def fetch_series(fred, series_id):
    """Fetch full observation history for a single FRED series."""
    obs = fred.get_series(series_id)
    df = obs.reset_index()
    df.columns = ["date", "value"]
    df["series_id"] = series_id
    df["date"] = pd.to_datetime(df["date"]).dt.date
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df = df.dropna(subset=["value"])
    return df[["series_id", "date", "value"]]


def load_existing():
    """Load existing parquet if it exists, else return empty DataFrame."""
    if OUTPUT_PATH.exists():
        return pd.read_parquet(OUTPUT_PATH)
    return pd.DataFrame(columns=["series_id", "date", "value", "vintage_date"])


def main():
    api_key = os.environ.get("FRED_API_KEY")
    if not api_key:
        print("ERROR: FRED_API_KEY environment variable not set.")
        sys.exit(1)

    fred = Fred(api_key=api_key)
    config = load_config()
    existing = load_existing()
    vintage_date = pd.Timestamp.now().date()

    new_frames = []

    for i, entry in enumerate(config):
        sid = entry["series_id"]
        label = entry["label"]
        print(f"[{i+1}/{len(config)}] Fetching {sid} ({label})...")

        try:
            df = fetch_series(fred, sid)
        except Exception as e:
            print(f"  WARNING: Failed to fetch {sid}: {e}")
            continue

        # Filter to only new observations not already in the parquet
        if not existing.empty and sid in existing["series_id"].values:
            existing_dates = set(
                existing.loc[existing["series_id"] == sid, "date"].values
            )
            df = df[~df["date"].apply(lambda d: d in existing_dates)]

        if df.empty:
            print(f"  No new observations for {sid}.")
        else:
            df["vintage_date"] = vintage_date
            new_frames.append(df)
            print(f"  Appending {len(df)} new observations.")

        # Rate-limit: 0.5s between calls
        if i < len(config) - 1:
            time.sleep(0.5)

    # Combine existing + new
    if new_frames:
        new_data = pd.concat(new_frames, ignore_index=True)
        combined = pd.concat([existing, new_data], ignore_index=True)
    else:
        combined = existing
        print("\nNo new data to append.")

    # Ensure types
    combined["date"] = pd.to_datetime(combined["date"]).dt.date
    combined["vintage_date"] = pd.to_datetime(combined["vintage_date"]).dt.date

    # Write
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    combined.to_parquet(OUTPUT_PATH, engine="pyarrow", index=False)
    print(f"\nWrote {len(combined)} total rows to {OUTPUT_PATH}")

    # ── Spot-check: print most recent value per series ───────────
    print("\n── Spot-check: latest value per series ──")
    for entry in config:
        sid = entry["series_id"]
        subset = combined[combined["series_id"] == sid]
        if subset.empty:
            print(f"  {sid:25s}  NO DATA")
            continue
        latest = subset.loc[subset["date"].idxmax()]
        print(f"  {sid:25s}  {latest['date']}  {latest['value']:>12.2f}")

    print("\nDone.")


if __name__ == "__main__":
    main()
