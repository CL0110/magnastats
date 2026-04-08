"""
BLS JOLTS Flat File Pipeline for Magnastats
============================================

Downloads, processes, and stacks BLS JOLTS flat files into a single
Parquet file with all metadata labels joined in.

BLS flat file structure:
- Tab-separated values with trailing whitespace
- Missing values coded as '-'
- Series IDs encode metadata: JT + seasonal + industry + sizeclass + dataelement + level
- jt.series maps each series_id to its components
- Lookup tables (jt.industry, jt.dataelement, etc.) provide human-readable labels

Quirks:
- BLS pads values with spaces — strip everything
- Some data rows have footnote codes (P = preliminary, R = revised)
- The files use \r\n line endings and tab separators
- Column headers have trailing spaces

Source: https://download.bls.gov/pub/time.series/jt/

Phase 1 filters:
- Seasonally adjusted only (seasonal = 'S')
- National level only (state_code = '00')
- Data elements: JO (job openings), HI (hires), QU (quits), TS (total separations)
- All industry breakdowns and size classes

Usage:
    python scripts/jolts_pipeline.py
"""

import logging
import time
from pathlib import Path

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BLS_BASE = "https://download.bls.gov/pub/time.series/jt/"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "jolts_stacked.parquet"

# Phase 1 filters
SEASONAL_FILTER = "S"
STATE_FILTER = "00"
DATAELEMENT_FILTER = {"JO", "HI", "QU", "TS"}

# BLS files to download
FILES = {
    "series": "jt.series",
    "data": "jt.data.1.AllItems",
    "industry": "jt.industry",
    "dataelement": "jt.dataelement",
    "sizeclass": "jt.sizeclass",
}

HEADERS = {
    "User-Agent": "Magnastats/1.0 (claire.bolam@magnastats.com)",
}


# ---------------------------------------------------------------------------
# Download helpers
# ---------------------------------------------------------------------------

def fetch_bls_file(filename: str) -> str:
    """Download a BLS flat file and return its text content."""
    url = BLS_BASE + filename
    log.info(f"Downloading {url}")
    resp = requests.get(url, headers=HEADERS, timeout=120)
    resp.raise_for_status()
    time.sleep(0.5)  # Be polite to BLS servers
    return resp.text


def parse_tsv(text: str) -> pd.DataFrame:
    """Parse a BLS tab-separated flat file into a DataFrame."""
    import io
    df = pd.read_csv(io.StringIO(text), sep="\t")
    # Strip whitespace from column names and all string values
    df.columns = [c.strip() for c in df.columns]
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()
    return df


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def download_all() -> dict:
    """Download all required BLS files and parse into DataFrames."""
    frames = {}
    for key, filename in FILES.items():
        text = fetch_bls_file(filename)
        frames[key] = parse_tsv(text)
        log.info(f"  {key}: {len(frames[key]):,} rows, cols={list(frames[key].columns)}")
    return frames


def build_series_catalog(frames: dict) -> pd.DataFrame:
    """Build the filtered series catalog with metadata labels joined."""
    series = frames["series"].copy()

    # Standardize column names (BLS sometimes varies casing)
    series.columns = [c.lower().replace(" ", "_") for c in series.columns]

    log.info(f"Series catalog: {len(series):,} total series")

    # Apply Phase 1 filters
    series = series[series["seasonal"] == SEASONAL_FILTER].copy()
    log.info(f"  After seasonal filter (S): {len(series):,}")

    if "state_code" in series.columns:
        series["state_code"] = series["state_code"].astype(str).str.zfill(2)
        series = series[series["state_code"] == STATE_FILTER].copy()
        log.info(f"  After state filter (00): {len(series):,}")

    if "dataelement_code" in series.columns:
        series = series[series["dataelement_code"].isin(DATAELEMENT_FILTER)].copy()
        log.info(f"  After dataelement filter: {len(series):,}")

    # Join industry labels
    industry = frames["industry"].copy()
    industry.columns = [c.lower().replace(" ", "_") for c in industry.columns]
    if "industry_code" in industry.columns and "industry_text" in industry.columns:
        industry = industry[["industry_code", "industry_text"]].rename(
            columns={"industry_text": "industry_label"}
        )
        series = series.merge(industry, on="industry_code", how="left")

    # Join dataelement labels
    dataelement = frames["dataelement"].copy()
    dataelement.columns = [c.lower().replace(" ", "_") for c in dataelement.columns]
    if "dataelement_code" in dataelement.columns and "dataelement_text" in dataelement.columns:
        dataelement = dataelement[["dataelement_code", "dataelement_text"]].rename(
            columns={"dataelement_text": "dataelement_label"}
        )
        series = series.merge(dataelement, on="dataelement_code", how="left")

    # Join sizeclass labels
    sizeclass = frames["sizeclass"].copy()
    sizeclass.columns = [c.lower().replace(" ", "_") for c in sizeclass.columns]
    if "sizeclass_code" in sizeclass.columns and "sizeclass_text" in sizeclass.columns:
        sizeclass = sizeclass[["sizeclass_code", "sizeclass_text"]].rename(
            columns={"sizeclass_text": "sizeclass_label"}
        )
        series = series.merge(sizeclass, on="sizeclass_code", how="left")

    log.info(f"  Final catalog: {len(series):,} series with labels")
    return series


def build_data(frames: dict, catalog: pd.DataFrame) -> pd.DataFrame:
    """Join data observations with the series catalog."""
    data = frames["data"].copy()
    data.columns = [c.lower().replace(" ", "_") for c in data.columns]

    log.info(f"Raw data: {len(data):,} observations")

    # Filter to series in our catalog
    valid_ids = set(catalog["series_id"].unique())
    data = data[data["series_id"].isin(valid_ids)].copy()
    log.info(f"  After series filter: {len(data):,}")

    # Clean value column — BLS uses '-' for missing
    data["value"] = pd.to_numeric(data["value"], errors="coerce")

    # Ensure year and period are clean
    data["year"] = data["year"].astype(int)
    # Period is like 'M01', 'M02', ... 'M12'; also 'M13' for annual avg — drop those
    data = data[data["period"].str.startswith("M")].copy()
    data["month"] = data["period"].str.replace("M", "").astype(int)
    data = data[data["month"] <= 12].copy()

    # Handle footnote codes
    if "footnote_codes" in data.columns:
        data["footnote_codes"] = data["footnote_codes"].fillna("")
    else:
        data["footnote_codes"] = ""

    # Join catalog metadata
    catalog_cols = [
        "series_id", "industry_code", "industry_label",
        "dataelement_code", "dataelement_label",
        "sizeclass_code", "sizeclass_label", "seasonal",
    ]
    available_cols = [c for c in catalog_cols if c in catalog.columns]
    merged = data.merge(catalog[available_cols], on="series_id", how="left")

    # Select final columns
    final_cols = [
        "year", "month", "series_id",
        "industry_code", "industry_label",
        "dataelement_code", "dataelement_label",
        "sizeclass_code", "sizeclass_label",
        "seasonal", "value", "footnote_codes",
    ]
    final_cols = [c for c in final_cols if c in merged.columns]
    merged = merged[final_cols].sort_values(["year", "month", "series_id"]).reset_index(drop=True)

    log.info(f"  Final dataset: {len(merged):,} rows")
    return merged


def append_or_write(new_data: pd.DataFrame, output_path: Path):
    """Write new data, appending to existing parquet if present."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_path.exists():
        log.info(f"Existing parquet found at {output_path}")
        existing = pd.read_parquet(output_path)
        log.info(f"  Existing: {len(existing):,} rows")

        # Find new rows by (year, month, series_id) not in existing
        existing_keys = set(
            zip(existing["year"], existing["month"], existing["series_id"])
        )
        new_mask = ~new_data.apply(
            lambda r: (r["year"], r["month"], r["series_id"]) in existing_keys, axis=1
        )
        to_append = new_data[new_mask]

        if len(to_append) == 0:
            log.info("  No new observations to append.")
            return existing

        log.info(f"  Appending {len(to_append):,} new rows")
        combined = pd.concat([existing, to_append], ignore_index=True)
        combined = combined.sort_values(["year", "month", "series_id"]).reset_index(drop=True)
    else:
        log.info(f"No existing parquet — writing fresh")
        combined = new_data

    combined.to_parquet(output_path, engine="pyarrow", index=False)
    log.info(f"  Written {len(combined):,} total rows to {output_path}")
    return combined


def spot_check(df: pd.DataFrame):
    """Print validation summaries."""
    log.info("=" * 60)
    log.info("SPOT CHECK")
    log.info("=" * 60)

    log.info(f"\nTotal rows: {len(df):,}")
    log.info(f"Year range: {df['year'].min()} – {df['year'].max()}")
    log.info(f"Month range: {df['month'].min()} – {df['month'].max()}")
    log.info(f"Unique series: {df['series_id'].nunique()}")
    log.info(f"Null values: {df['value'].isna().sum():,}")

    log.info("\nRow counts by data element:")
    if "dataelement_label" in df.columns:
        for label, count in df.groupby("dataelement_label").size().items():
            log.info(f"  {label}: {count:,}")

    log.info("\nRow counts by year:")
    for year, count in df.groupby("year").size().items():
        log.info(f"  {year}: {count:,}")

    log.info("\nSample rows:")
    log.info(df.head(5).to_string(index=False))
    log.info("=" * 60)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    log.info("JOLTS Pipeline — starting")

    # 1. Download
    frames = download_all()

    # 2. Build filtered series catalog with labels
    catalog = build_series_catalog(frames)

    # 3. Join data with catalog
    data = build_data(frames, catalog)

    # 4. Append or write
    final = append_or_write(data, OUTPUT_PATH)

    # 5. Spot check
    spot_check(final)

    log.info("\nDone.")


if __name__ == "__main__":
    main()
