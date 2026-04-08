"""
Build public/data/fred_indicators.json from the FRED parquet + YAML config.

For each series, computes:
- latest_value, latest_date
- mom_change (month-over-month), yoy_change (year-over-year)
- history: last 60 monthly data points for sparkline/chart
- All metadata from fred_indicators.yaml (label, category, unit, etc.)

Usage:
    python scripts/build_fred_indicators.py
"""

import json
from pathlib import Path

import pandas as pd
import yaml

ROOT = Path(__file__).resolve().parent.parent
PARQUET_PATH = ROOT / "data" / "fred_indicators.parquet"
CONFIG_PATH = ROOT / "fred_indicators.yaml"
OUTPUT_PATH = ROOT / "public" / "data" / "fred_indicators.json"


def main():
    print("[1/3] Loading data …")
    df = pd.read_parquet(PARQUET_PATH)
    df["date"] = pd.to_datetime(df["date"])
    print(f"       {len(df):,} rows, {df['series_id'].nunique()} series")

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)["series"]
    config_map = {s["series_id"]: s for s in config}

    print("[2/3] Computing indicators …")
    indicators = []

    for entry in config:
        sid = entry["series_id"]
        subset = df[df["series_id"] == sid].sort_values("date").copy()

        if subset.empty:
            print(f"  SKIP {sid} — no data")
            continue

        # For index series (CPI, PCE, PPI), compute YoY % change
        is_index = entry.get("unit", "").startswith("Index")

        if is_index:
            # Resample to month-end, compute YoY pct change
            subset = subset.set_index("date").resample("MS").last().reset_index()
            subset["yoy_pct"] = subset["value"].pct_change(12) * 100
            display_series = subset[["date", "yoy_pct"]].dropna().copy()
            display_series = display_series.rename(columns={"yoy_pct": "display_value"})
            # Also keep raw value for reference
            subset = subset.merge(
                display_series[["date", "display_value"]], on="date", how="left"
            )
        else:
            # Resample to month start
            subset = subset.set_index("date").resample("MS").last().reset_index()
            subset["display_value"] = subset["value"] / entry.get("display_divisor", 1)

        subset = subset.dropna(subset=["value"])

        if len(subset) < 2:
            print(f"  SKIP {sid} — insufficient data")
            continue

        latest = subset.iloc[-1]
        latest_date = latest["date"].strftime("%Y-%m")

        if is_index:
            latest_display = round(float(latest.get("display_value", 0)), 1)
        else:
            latest_display = round(float(latest["display_value"]), 2)

        # Month-over-month change
        if len(subset) >= 2:
            prev = subset.iloc[-2]
            if is_index:
                mom = round(float(latest.get("display_value", 0)) - float(prev.get("display_value", 0)), 2)
            else:
                mom = round(float(latest["display_value"]) - float(prev["display_value"]), 2)
        else:
            mom = None

        # Year-over-year change
        if is_index:
            yoy = round(float(latest.get("display_value", 0)), 1) if pd.notna(latest.get("display_value")) else None
        else:
            twelve_ago = subset[subset["date"] <= latest["date"] - pd.DateOffset(months=11)]
            if len(twelve_ago) > 0:
                yoy_prev = twelve_ago.iloc[-1]
                yoy = round(float(latest["display_value"]) - float(yoy_prev["display_value"]), 2)
            else:
                yoy = None

        # History — last 60 data points
        hist_subset = subset.tail(60)
        if is_index:
            history = [
                {
                    "date": row["date"].strftime("%Y-%m"),
                    "value": round(float(row["display_value"]), 2) if pd.notna(row.get("display_value")) else None,
                }
                for _, row in hist_subset.iterrows()
            ]
        else:
            history = [
                {
                    "date": row["date"].strftime("%Y-%m"),
                    "value": round(float(row["display_value"]), 2),
                }
                for _, row in hist_subset.iterrows()
            ]

        # Build indicator object
        indicator = {
            "series_id": sid,
            "label": entry["label"],
            "category": entry["category"],
            "description": entry.get("description", ""),
            "source": entry.get("source", ""),
            "unit": entry.get("display_unit", ""),
            "good_direction": entry.get("good_direction", "up"),
            "latest_value": latest_display,
            "latest_date": latest_date,
            "mom_change": mom,
            "yoy_change": yoy,
            "is_yoy_computed": is_index,
            "history": history,
        }
        indicators.append(indicator)
        print(f"  {sid:25s} → {latest_display}{entry.get('display_unit', '')}  (MoM: {mom}, YoY: {yoy})")

    # Group by category
    categories = {}
    for ind in indicators:
        cat = ind["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(ind)

    print("[3/3] Exporting JSON …")
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    output = {
        "generated": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "categories": categories,
        "indicators": indicators,
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"       Written to {OUTPUT_PATH} ({size_kb:.0f} KB)")
    print(f"       {len(indicators)} indicators across {len(categories)} categories")
    print("\nDone.")


if __name__ == "__main__":
    main()
