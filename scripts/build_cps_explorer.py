"""
Pre-aggregate CPS microdata for the Data Explorer frontend.

Produces public/data/cps_explorer.json — weighted counts at the finest
demographic grain (sex × age × race_ethnicity × education × month).
The frontend sums across "All" selections on the fly.

Usage:
    python scripts/build_cps_explorer.py
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd

CPS_PATH = Path(
    r"C:\Users\clair\Dropbox\Research\Econometrics Research"
    r"\CPS Data Transformation\Final Output\cps_analysis.parquet"
)
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"


def build_race_ethnicity(df):
    """Create a clean race/ethnicity column with Hispanic as primary identifier."""
    conditions = [
        df["hispanic"] == 1,
        (df["hispanic"] == 0) & (df["race_group"] == "white"),
        (df["hispanic"] == 0) & (df["race_group"] == "black"),
        (df["hispanic"] == 0) & (df["race_group"] == "asian"),
    ]
    choices = ["hispanic", "white_nh", "black_nh", "asian_nh"]
    df["race_eth"] = np.select(conditions, choices, default="other")
    return df


def main():
    print("[1/3] Loading CPS microdata …")
    cols = [
        "year", "month", "age", "age_group", "male",
        "race_group", "hispanic", "educ_group",
        "employed", "unemployed", "not_in_lf",
        "person_weight",
    ]
    df = pd.read_parquet(CPS_PATH, columns=cols)
    print(f"       {len(df):,} rows loaded")

    # Drop children and missing weights
    df = df[df["age_group"] != "0-15"].copy()
    df = df[df["person_weight"].notna() & (df["person_weight"] > 0)].copy()
    print(f"       {len(df):,} rows after filtering (16+, valid weights)")

    # Derive race/ethnicity
    df = build_race_ethnicity(df)

    # Map sex
    df["sex"] = df["male"].map({1: "male", 0: "female"})

    # Map education to shorter labels matching the UI
    educ_map = {
        "less_than_hs": "less_hs",
        "hs_diploma": "hs",
        "some_college": "some_college",
        "bachelors": "bachelors",
        "graduate": "graduate",
    }
    df["educ"] = df["educ_group"].map(educ_map)

    # Compute weighted values per person
    df["w_employed"] = df["employed"] * df["person_weight"]
    df["w_unemployed"] = df["unemployed"] * df["person_weight"]
    df["w_nilf"] = df["not_in_lf"] * df["person_weight"]
    df["w_pop"] = df["person_weight"]  # total population weight

    print("[2/3] Aggregating …")
    group_cols = ["year", "month", "sex", "age_group", "race_eth", "educ"]
    agg = (
        df.groupby(group_cols, observed=True)
        .agg(
            employed=("w_employed", "sum"),
            unemployed=("w_unemployed", "sum"),
            nilf=("w_nilf", "sum"),
            pop=("w_pop", "sum"),
        )
        .reset_index()
    )

    # Round to reduce JSON size
    for col in ["employed", "unemployed", "nilf", "pop"]:
        agg[col] = agg[col].round(0).astype(int)

    # Create date string
    agg["date"] = agg["year"].astype(str) + "-" + agg["month"].astype(str).str.zfill(2)

    print(f"       {len(agg):,} aggregated rows")
    print(f"       Date range: {agg['date'].min()} to {agg['date'].max()}")

    # Also compute national totals per month for the reference line
    national = (
        df.groupby(["year", "month"], observed=True)
        .agg(
            employed=("w_employed", "sum"),
            unemployed=("w_unemployed", "sum"),
            nilf=("w_nilf", "sum"),
            pop=("w_pop", "sum"),
        )
        .reset_index()
    )
    for col in ["employed", "unemployed", "nilf", "pop"]:
        national[col] = national[col].round(0).astype(int)
    national["date"] = national["year"].astype(str) + "-" + national["month"].astype(str).str.zfill(2)

    print("[3/3] Exporting JSON …")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Convert to records format
    # Drop year/month columns (redundant with date)
    agg_out = agg.drop(columns=["year", "month"])
    nat_out = national.drop(columns=["year", "month"])

    output = {
        "generated": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "dimensions": {
            "sex": ["male", "female"],
            "age_group": ["16-24", "25-34", "35-44", "45-54", "55-64", "65+"],
            "race_eth": ["white_nh", "black_nh", "hispanic", "asian_nh", "other"],
            "educ": ["less_hs", "hs", "some_college", "bachelors", "graduate"],
        },
        "label_map": {
            "sex": {"male": "Male", "female": "Female"},
            "age_group": {
                "16-24": "16–24", "25-34": "25–34", "35-44": "35–44",
                "45-54": "45–54", "55-64": "55–64", "65+": "65+",
            },
            "race_eth": {
                "white_nh": "White non-Hisp.",
                "black_nh": "Black non-Hisp.",
                "hispanic": "Hispanic",
                "asian_nh": "Asian",
                "other": "Other",
            },
            "educ": {
                "less_hs": "< HS",
                "hs": "HS diploma",
                "some_college": "Some college",
                "bachelors": "Bachelor's",
                "graduate": "Advanced",
            },
        },
        "data": agg_out.to_dict(orient="records"),
        "national": nat_out.to_dict(orient="records"),
    }

    out_path = OUTPUT_DIR / "cps_explorer.json"
    with open(out_path, "w") as f:
        json.dump(output, f)

    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"       Written to {out_path} ({size_mb:.1f} MB)")
    print(f"       {len(output['data']):,} data rows, {len(output['national']):,} national rows")
    print("\nDone.")


if __name__ == "__main__":
    main()
