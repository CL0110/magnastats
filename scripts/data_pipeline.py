import pandas as pd
import numpy as np
from fredapi import Fred
from hmmlearn import hmm
import json
from datetime import datetime

# FRED API key - replace with your key
FRED_API_KEY = 'your_fred_api_key_here'

# Initialize FRED API
fred = Fred(api_key=FRED_API_KEY)

# FRED series IDs
series = {
    '10y2y_spread': 'T10Y2Y',  # 10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity
    'cpi_yoy': 'CPIAUCSL',     # Consumer Price Index for All Urban Consumers: All Items in U.S. City Average
    'epop': 'EMRATIO',         # Employment-Population Ratio
    'ism_pmi': 'NAPM',         # ISM Manufacturing: PMI Composite Index
    'real_gdp_growth': 'GDPC1' # Real Gross Domestic Product
}

# Pull FRED data
fred_data = {}
for name, series_id in series.items():
    try:
        data = fred.get_series(series_id)
        fred_data[name] = data
    except Exception as e:
        print(f"Error fetching {name}: {e}")

# Convert to DataFrame
fred_df = pd.DataFrame(fred_data)
fred_df.index.name = 'date'
fred_df.reset_index(inplace=True)

# Load CPS data
cps_df = pd.read_parquet(r'C:\Users\clair\Dropbox\Research\Econometrics Research\CPS Data Transformation\Final Output\cps_analysis.parquet')

# Assuming cps_df has 'date' column in datetime format
# Merge on date
merged_df = pd.merge(fred_df, cps_df[['date', 'spread_epop']], on='date', how='inner')

# Drop rows with NaN
merged_df.dropna(inplace=True)

# Features for HMM: 5 FRED series + spread_epop
features = ['10y2y_spread', 'cpi_yoy', 'epop', 'ism_pmi', 'real_gdp_growth', 'spread_epop']
X = merged_df[features].values

# Train HMM with 6 states
model = hmm.GaussianHMM(n_components=6, covariance_type='full', n_iter=1000)
model.fit(X)

# Predict regimes
regimes = model.predict(X)

# Get probabilities
probabilities = model.predict_proba(X)

# Transition matrix
transition_matrix = model.transmat_

# Add to dataframe
merged_df['regime'] = regimes
merged_df['probabilities'] = probabilities.tolist()

# Regime names (you can customize these)
regime_names = [
    "Recession",
    "Recovery",
    "Expansion",
    "Overheating",
    "Slowdown",
    "Stagnation"
]

# Prepare JSON output
output = {
    'regimes': merged_df[['date', 'regime', 'probabilities']].to_dict('records'),
    'transition_matrix': transition_matrix.tolist(),
    'regime_names': regime_names,
    'features': features,
    'last_updated': datetime.now().isoformat()
}

# Save to JSON
with open('regime_data.json', 'w') as f:
    json.dump(output, f, indent=2)

print("Data pipeline completed. Regime data saved to regime_data.json")