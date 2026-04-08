"""
Build 6-regime macro classification from CPS microdata + FRED series.

Usage:
    python scripts/build_regimes.py --fred-key YOUR_KEY

Output:
    public/data/regimes.json  — consumed by the Magnastats frontend
"""

import argparse
import json
import os
import warnings
from pathlib import Path

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
CPS_PATH = Path(
    r"C:\Users\clair\Dropbox\Research\Econometrics Research"
    r"\CPS Data Transformation\Final Output\cps_analysis.parquet"
)
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"

# ---------------------------------------------------------------------------
# 1.  CPS: monthly education-based spreads
# ---------------------------------------------------------------------------

def build_cps_spreads(cps_path: Path) -> pd.DataFrame:
    """Compute monthly college-vs-noncollege EPOP and unemployment spreads."""
    print("[1/4] Loading CPS microdata …")
    cols = [
        "year", "month", "college_plus", "age",
        "employed", "unemployed", "not_in_lf", "person_weight",
    ]
    df = pd.read_parquet(cps_path, columns=cols)
    print(f"       {len(df):,} rows loaded")

    # Prime-age only (25-54) for cleaner signal
    df = df[(df["age"] >= 25) & (df["age"] <= 54)].copy()

    # Weighted aggregation by month × education
    df["in_labor_force"] = df["employed"] + df["unemployed"]

    grouped = (
        df.groupby(["year", "month", "college_plus"])
        .apply(
            lambda g: pd.Series({
                "epop": np.average(g["employed"], weights=g["person_weight"]),
                "urate": (
                    np.average(g["unemployed"], weights=g["person_weight"])
                    / max(np.average(g["in_labor_force"], weights=g["person_weight"]), 1e-9)
                ),
            })
        )
        .reset_index()
    )

    # Pivot: one row per month, columns for college / non-college
    college = grouped[grouped["college_plus"] == 1].rename(
        columns={"epop": "epop_college", "urate": "urate_college"}
    )[["year", "month", "epop_college", "urate_college"]]

    noncollege = grouped[grouped["college_plus"] == 0].rename(
        columns={"epop": "epop_noncollege", "urate": "urate_noncollege"}
    )[["year", "month", "epop_noncollege", "urate_noncollege"]]

    merged = college.merge(noncollege, on=["year", "month"])

    # Spreads
    merged["epop_spread"] = merged["epop_college"] - merged["epop_noncollege"]
    merged["urate_spread"] = merged["urate_noncollege"] - merged["urate_college"]

    # Overall EPOP (prime-age)
    overall = (
        df.groupby(["year", "month"])
        .apply(lambda g: np.average(g["employed"], weights=g["person_weight"]))
        .reset_index(name="epop_overall")
    )
    merged = merged.merge(overall, on=["year", "month"])

    # Date column
    merged["date"] = pd.to_datetime(
        merged["year"].astype(str) + "-" + merged["month"].astype(str).str.zfill(2) + "-01"
    )
    merged = merged.sort_values("date").reset_index(drop=True)

    print(f"       {len(merged)} monthly observations ({merged.date.min():%Y-%m} to {merged.date.max():%Y-%m})")
    return merged


# ---------------------------------------------------------------------------
# 2.  FRED series
# ---------------------------------------------------------------------------

FRED_SERIES = {
    "T10Y2Y":  "yield_spread",    # 10Y-2Y Treasury spread
    "CPIAUCSL": "cpi_raw",        # CPI (will compute YoY)
    "MANEMP":  "ism_proxy",       # Manufacturing employment as ISM proxy
}


def fetch_fred(api_key: str, start: str = "2000-01-01") -> pd.DataFrame:
    """Pull monthly FRED series and align to month start."""
    print("[2/4] Fetching FRED data …")
    from fredapi import Fred

    fred = Fred(api_key=api_key)
    frames = {}
    for series_id, name in FRED_SERIES.items():
        s = fred.get_series(series_id, observation_start=start)
        s = s.resample("MS").last().rename(name)
        frames[name] = s
        print(f"       {series_id} → {name}: {len(s)} obs")

    out = pd.DataFrame(frames)
    out.index.name = "date"
    out = out.reset_index()

    # CPI → YoY %
    out["cpi_yoy"] = out["cpi_raw"].pct_change(12) * 100
    out.drop(columns=["cpi_raw"], inplace=True)

    return out


# ---------------------------------------------------------------------------
# 3.  HMM estimation
# ---------------------------------------------------------------------------

REGIME_LABELS = {
    0: {"key": "narrow_goldilocks",  "label": "Narrow Goldilocks",  "color": "#4ade80", "desc": "Aggregate healthy · Spreads wide/widening"},
    1: {"key": "broad_goldilocks",   "label": "Broad Goldilocks",   "color": "#34d399", "desc": "Aggregate healthy · Spreads compressing"},
    2: {"key": "broad_reflation",    "label": "Broad Reflation",    "color": "#facc15", "desc": "Recovery · Inflation rising · Spreads narrowing"},
    3: {"key": "stagflation",        "label": "Stagflation",        "color": "#f97316", "desc": "Growth slowing · Inflation elevated · Spreads widening"},
    4: {"key": "acute_contraction",  "label": "Acute Contraction",  "color": "#ef4444", "desc": "Sharp decline · Spreads spiking"},
    5: {"key": "uneven_recovery",    "label": "Uneven Recovery",    "color": "#60a5fa", "desc": "Aggregate recovering · Distributional damage sticky"},
}


def fit_hmm(data: pd.DataFrame) -> dict:
    """Fit a 6-state Gaussian HMM and return regime assignments + metadata."""
    print("[3/4] Fitting 6-state HMM …")
    from hmmlearn.hmm import GaussianHMM

    feature_cols = [
        "yield_spread", "cpi_yoy", "epop_overall",
        "ism_proxy", "epop_spread", "urate_spread",
    ]

    X = data[feature_cols].copy()

    # Standardize
    means = X.mean()
    stds = X.std()
    X_scaled = ((X - means) / stds).values

    model = GaussianHMM(
        n_components=6,
        covariance_type="full",
        n_iter=500,
        random_state=42,
        tol=0.01,
    )
    model.fit(X_scaled)

    states = model.predict(X_scaled)
    probs = model.predict_proba(X_scaled)

    print(f"       Converged: {model.monitor_.converged}")
    print(f"       Log-likelihood: {model.score(X_scaled):.1f}")

    # --- Label assignment heuristic ---
    # Sort states by mean epop_overall (descending) and mean epop_spread (descending)
    # to map HMM state indices to our semantic labels.
    epop_idx = feature_cols.index("epop_overall")
    spread_idx = feature_cols.index("epop_spread")
    cpi_idx = feature_cols.index("cpi_yoy")

    state_stats = []
    for s in range(6):
        mask = states == s
        state_stats.append({
            "state": s,
            "count": mask.sum(),
            "epop_mean": model.means_[s, epop_idx],
            "spread_mean": model.means_[s, spread_idx],
            "cpi_mean": model.means_[s, cpi_idx],
        })
    state_stats = sorted(state_stats, key=lambda x: x["epop_mean"], reverse=True)

    # Heuristic mapping:
    # Highest EPOP + wide spread → Narrow Goldilocks (0)
    # Highest EPOP + narrow spread → Broad Goldilocks (1)
    # Mid EPOP + rising CPI + narrow spread → Broad Reflation (2)
    # Mid EPOP + high CPI + wide spread → Stagflation (3)
    # Lowest EPOP → Acute Contraction (4)
    # Low EPOP + wide spread → Uneven Recovery (5)

    # Split the two highest-EPOP states by spread
    top2 = state_stats[:2]
    if top2[0]["spread_mean"] > top2[1]["spread_mean"]:
        narrow_gold, broad_gold = top2[0]["state"], top2[1]["state"]
    else:
        narrow_gold, broad_gold = top2[1]["state"], top2[0]["state"]

    # Lowest EPOP = Acute Contraction
    acute = state_stats[-1]["state"]

    # Second lowest = Uneven Recovery
    uneven = state_stats[-2]["state"]

    # Remaining 2: higher CPI = Stagflation, lower = Broad Reflation
    remaining = [s for s in state_stats if s["state"] not in {narrow_gold, broad_gold, acute, uneven}]
    if remaining[0]["cpi_mean"] > remaining[1]["cpi_mean"]:
        stagflation, reflation = remaining[0]["state"], remaining[1]["state"]
    else:
        stagflation, reflation = remaining[1]["state"], remaining[0]["state"]

    label_map = {
        narrow_gold: 0,
        broad_gold: 1,
        reflation: 2,
        stagflation: 3,
        acute: 4,
        uneven: 5,
    }

    mapped_states = np.array([label_map[s] for s in states])

    # Reorder probabilities to match our label ordering
    mapped_probs = np.zeros_like(probs)
    for old_idx, new_idx in label_map.items():
        mapped_probs[:, new_idx] = probs[:, old_idx]

    # Transition matrix (remapped)
    transmat = np.zeros((6, 6))
    for old_from, new_from in label_map.items():
        for old_to, new_to in label_map.items():
            transmat[new_from, new_to] = model.transmat_[old_from, old_to]

    return {
        "states": mapped_states,
        "probs": mapped_probs,
        "transmat": transmat,
        "feature_cols": feature_cols,
    }


# ---------------------------------------------------------------------------
# 4.  Export JSON
# ---------------------------------------------------------------------------

def export_json(data: pd.DataFrame, hmm_result: dict, output_dir: Path):
    """Write regimes.json for the frontend."""
    print("[4/4] Exporting JSON …")
    output_dir.mkdir(parents=True, exist_ok=True)

    states = hmm_result["states"]
    probs = hmm_result["probs"]
    transmat = hmm_result["transmat"]

    # Current regime
    current_state = int(states[-1])
    current_probs = {REGIME_LABELS[i]["key"]: round(float(probs[-1, i]) * 100, 1) for i in range(6)}

    # Timeline
    timeline = []
    for i, row in data.iterrows():
        regime_idx = int(states[i])
        timeline.append({
            "date": row["date"].strftime("%Y-%m"),
            "regime": REGIME_LABELS[regime_idx]["key"],
            "prob": round(float(probs[i, regime_idx]) * 100, 1),
        })

    # Transition probabilities from current state
    transitions = {}
    for j in range(6):
        transitions[REGIME_LABELS[j]["key"]] = round(float(transmat[current_state, j]) * 100, 1)

    # Indicator snapshots (latest values)
    latest = data.iloc[-1]
    indicators = {
        "yield_spread": round(float(latest["yield_spread"]), 2),
        "cpi_yoy": round(float(latest["cpi_yoy"]), 1),
        "epop_overall": round(float(latest["epop_overall"]) * 100, 1),
        "epop_spread": round(float(latest["epop_spread"]) * 100, 1),
        "urate_spread": round(float(latest["urate_spread"]) * 100, 1),
    }

    # Indicator time series (for charts)
    indicator_series = {}
    for col in ["yield_spread", "cpi_yoy", "epop_overall", "epop_spread", "urate_spread"]:
        indicator_series[col] = [
            {"date": row["date"].strftime("%Y-%m"), "value": round(float(row[col]), 3)}
            for _, row in data.iterrows()
            if pd.notna(row[col])
        ]

    output = {
        "generated": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "regime_definitions": {v["key"]: v for v in REGIME_LABELS.values()},
        "current_regime": REGIME_LABELS[current_state],
        "current_probabilities": current_probs,
        "transition_probabilities": transitions,
        "indicators": indicators,
        "timeline": timeline,
        "indicator_series": indicator_series,
    }

    out_path = output_dir / "regimes.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"       Written to {out_path}")
    print(f"       Current regime: {REGIME_LABELS[current_state]['label']} ({current_probs[REGIME_LABELS[current_state]['key']]}%)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Build 6-regime macro classification")
    parser.add_argument("--fred-key", required=True, help="FRED API key")
    parser.add_argument("--cps-path", default=str(CPS_PATH), help="Path to CPS parquet")
    args = parser.parse_args()

    # 1. CPS spreads
    cps = build_cps_spreads(Path(args.cps_path))

    # 2. FRED data
    fred = fetch_fred(args.fred_key, start=cps["date"].min().strftime("%Y-%m-%d"))

    # 3. Merge
    merged = cps.merge(fred, on="date", how="inner").dropna().reset_index(drop=True)
    print(f"       Merged dataset: {len(merged)} months")

    # 4. Fit HMM
    hmm_result = fit_hmm(merged)

    # 5. Export
    export_json(merged, hmm_result, OUTPUT_DIR)

    print("\nDone.")


if __name__ == "__main__":
    main()
