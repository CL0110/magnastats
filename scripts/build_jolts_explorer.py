"""
Pre-aggregate JOLTS parquet for the Data Explorer frontend.

Produces public/data/jolts_explorer.json — rates by industry, data element,
and size class per month. Frontend filters and charts client-side.

Usage:
    python scripts/build_jolts_explorer.py
"""

import json
from pathlib import Path
import pandas as pd

PARQUET_PATH = Path(__file__).resolve().parent.parent / "data" / "jolts_stacked.parquet"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"


def main():
    print("[1/3] Loading JOLTS parquet …")
    df = pd.read_parquet(PARQUET_PATH)
    print(f"       {len(df):,} rows loaded")

    # Extract rate vs level from the last character of series_id
    df["rate_level"] = df["series_id"].str[-1]

    # Keep both rates (R) and levels (L)
    # Frontend will let user toggle between them
    print("[2/3] Processing …")

    # Build the output records
    records = []
    for _, row in df.iterrows():
        records.append({
            "date": f"{row['year']}-{str(row['month']).zfill(2)}",
            "ind": row["industry_code"],
            "de": row["dataelement_code"],
            "sc": row["sizeclass_code"],
            "rl": row["rate_level"],
            "v": round(float(row["value"]), 1) if pd.notna(row["value"]) else None,
        })

    # Build label maps
    ind_labels = (
        df[["industry_code", "industry_label"]]
        .drop_duplicates()
        .set_index("industry_code")["industry_label"]
        .to_dict()
    )

    de_labels = (
        df[["dataelement_code", "dataelement_label"]]
        .drop_duplicates()
        .set_index("dataelement_code")["dataelement_label"]
        .to_dict()
    )

    sc_labels = (
        df[["sizeclass_code", "sizeclass_label"]]
        .drop_duplicates()
        .set_index("sizeclass_code")["sizeclass_label"]
        .to_dict()
    )

    # Dimension values (sorted for UI)
    industries = sorted(ind_labels.keys(), key=lambda k: ind_labels[k])
    dataelements = sorted(de_labels.keys())
    sizeclasses = sorted(sc_labels.keys(), key=lambda k: sc_labels[k])

    # National totals (Total nonfarm, All size classes, Rate)
    national = df[
        (df["industry_label"] == "Total nonfarm") &
        (df["sizeclass_label"] == "All size classes") &
        (df["rate_level"] == "R")
    ][["year", "month", "dataelement_code", "value"]].copy()

    nat_records = []
    for _, row in national.iterrows():
        nat_records.append({
            "date": f"{row['year']}-{str(row['month']).zfill(2)}",
            "de": row["dataelement_code"],
            "v": round(float(row["value"]), 1) if pd.notna(row["value"]) else None,
        })

    print("[3/3] Exporting JSON …")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    output = {
        "generated": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "dimensions": {
            "industry": [str(k) for k in industries],
            "dataelement": dataelements,
            "sizeclass": [str(k) for k in sizeclasses],
        },
        "label_map": {
            "industry": {str(k): v for k, v in ind_labels.items()},
            "dataelement": de_labels,
            "sizeclass": {str(k): v for k, v in sc_labels.items()},
        },
        "data": records,
        "national": nat_records,
    }

    out_path = OUTPUT_DIR / "jolts_explorer.json"
    with open(out_path, "w") as f:
        json.dump(output, f)

    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"       Written to {out_path} ({size_mb:.1f} MB)")
    print(f"       {len(records):,} data rows, {len(nat_records):,} national rows")
    print("\nDone.")


if __name__ == "__main__":
    main()
