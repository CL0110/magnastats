"""
Polymarket Economics/Macro Market Fetcher
==========================================

Pulls active prediction markets related to economics, macro, and policy
from Polymarket's public API. No API key needed.

Outputs a summary of active markets with current odds, volume, and
suggested Magnastats data angles.

Usage:
    python scripts/polymarket_fetch.py
"""

import json
from datetime import datetime
from pathlib import Path

import requests

GAMMA_API = "https://gamma-api.polymarket.com"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "polymarket_markets.json"

# Keywords to search for economics/macro markets
KEYWORDS = [
    "unemployment",
    "inflation",
    "recession",
    "federal reserve",
    "fed rate",
    "interest rate",
    "GDP",
    "jobs",
    "tariff",
    "stock market",
    "S&P 500",
    "CPI",
    "housing",
    "debt ceiling",
    "government shutdown",
    "oil price",
    "wage",
    "labor",
    "economy",
    "treasury",
    "deficit",
    "trade war",
]

# Map keywords to Magnastats data sources for editorial suggestions
DATA_ANGLES = {
    "unemployment": "CPS unemployment by education/race/age → who's driving the number",
    "inflation": "FRED CPI/PCE + breakeven inflation → market vs actual",
    "recession": "Regime classification model → current HMM state + transition probabilities",
    "federal reserve": "FRED fed funds rate + 10Y-2Y spread → what the curve says",
    "fed rate": "FRED FEDFUNDS + DGS2 + DGS10 → rate path implied by bonds",
    "interest rate": "FRED FEDFUNDS + mortgage rates → real economy transmission",
    "gdp": "FRED real GDP + industrial production → growth decomposition",
    "jobs": "CPS EPOP by demographic + JOLTS openings/hires → labor market depth",
    "tariff": "CPS wages by industry + FRED PPI → who pays the cost",
    "stock market": "FRED VIX + HY spread → risk sentiment indicators",
    "s&p 500": "FRED VIX + consumer sentiment → fear vs fundamentals",
    "cpi": "FRED CPI/Core CPI + PCE → headline vs core divergence",
    "housing": "FRED housing starts + permits + mortgage rate → supply pipeline",
    "oil price": "FRED WTI crude + PPI → inflation input signal",
    "wage": "CPS wages by gender/education/industry → distributional breakdown",
    "labor": "CPS LFPR + EPOP + JOLTS quits rate → labor market tightness",
    "economy": "Regime classification → current macro state",
    "treasury": "FRED 10Y + 2Y + spread → yield curve signal",
    "deficit": "FRED federal surplus/deficit → fiscal trajectory",
    "trade war": "CPS manufacturing employment + FRED PPI → trade impact channels",
    "debt ceiling": "FRED federal debt → context on trajectory",
    "government shutdown": "FRED federal employment + CPS govt workers → who's affected",
}


def fetch_markets_by_tag(tag, limit=50):
    """Fetch active markets for a specific Polymarket tag/category."""
    try:
        resp = requests.get(
            f"{GAMMA_API}/events",
            params={
                "tag": tag,
                "active": "true",
                "closed": "false",
                "limit": limit,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  Warning: Failed to fetch tag '{tag}': {e}")
        return []


def search_markets(keyword):
    """Search Polymarket for active markets matching a keyword."""
    try:
        resp = requests.get(
            f"{GAMMA_API}/markets",
            params={
                "search": keyword,
                "active": "true",
                "closed": "false",
                "limit": 20,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"  Warning: Failed to search '{keyword}': {e}")
        return []


def get_data_angle(market_title):
    """Suggest a Magnastats data angle based on market keywords."""
    title_lower = market_title.lower()
    angles = []
    for keyword, angle in DATA_ANGLES.items():
        if keyword in title_lower:
            angles.append(angle)
    return angles if angles else ["General macro context — check regime model + leading indicators"]


def parse_event(event):
    """Parse a Polymarket event into a list of market dicts."""
    markets_out = []
    title = event.get("title", "")
    slug = event.get("slug", "")
    event_volume = 0

    sub_markets = event.get("markets", [])
    if not sub_markets:
        return markets_out

    for m in sub_markets:
        question = m.get("question", "") or title

        outcomes = m.get("outcomes", [])
        outcome_prices = m.get("outcomePrices", [])

        prices = {}
        if outcomes and outcome_prices:
            try:
                if isinstance(outcome_prices, str):
                    outcome_prices = json.loads(outcome_prices)
                for i, outcome in enumerate(outcomes):
                    if i < len(outcome_prices):
                        prices[outcome] = round(float(outcome_prices[i]) * 100, 1)
            except (ValueError, TypeError):
                pass

        volume = 0
        try:
            volume = float(m.get("volume", 0))
        except (ValueError, TypeError):
            pass

        liquidity = 0
        try:
            liquidity = float(m.get("liquidity", 0))
        except (ValueError, TypeError):
            pass

        end_date = m.get("endDate", "")

        markets_out.append({
            "question": question,
            "event_title": title,
            "prices": prices,
            "volume": round(volume),
            "liquidity": round(liquidity),
            "end_date": end_date[:10] if end_date else "",
            "url": f"https://polymarket.com/event/{slug}" if slug else "",
            "data_angles": get_data_angle(question + " " + title),
        })

    return markets_out


def parse_market(m):
    """Parse a single market result from keyword search."""
    question = m.get("question", "")
    outcomes = m.get("outcomes", [])
    outcome_prices = m.get("outcomePrices", [])

    prices = {}
    if outcomes and outcome_prices:
        try:
            if isinstance(outcome_prices, str):
                outcome_prices = json.loads(outcome_prices)
            for i, outcome in enumerate(outcomes):
                if i < len(outcome_prices):
                    prices[outcome] = round(float(outcome_prices[i]) * 100, 1)
        except (ValueError, TypeError):
            pass

    volume = 0
    try:
        volume = float(m.get("volume", 0))
    except (ValueError, TypeError):
        pass

    liquidity = 0
    try:
        liquidity = float(m.get("liquidity", 0))
    except (ValueError, TypeError):
        pass

    end_date = m.get("endDate", "")
    slug = m.get("slug", "")

    return {
        "question": question,
        "event_title": "",
        "prices": prices,
        "volume": round(volume),
        "liquidity": round(liquidity),
        "end_date": end_date[:10] if end_date else "",
        "url": f"https://polymarket.com/event/{slug}" if slug else "",
        "data_angles": get_data_angle(question),
    }


def main():
    print(f"Polymarket Fetcher — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 70)

    seen_questions = set()
    all_markets = []

    # Phase 1: Pull by Polymarket category tags
    TAGS = ["economy", "finance", "fed", "economic-policy", "fed-rates",
            "commodities", "oil", "fomc"]

    for tag in TAGS:
        print(f"  Tag: {tag}")
        events = fetch_markets_by_tag(tag)
        for event in events:
            for market in parse_event(event):
                if market["question"] not in seen_questions and market["volume"] > 0:
                    seen_questions.add(market["question"])
                    all_markets.append(market)

    # Phase 2: Supplement with keyword searches (economics-specific only)
    ECON_KEYWORDS = ["unemployment rate", "inflation CPI", "recession 2026",
                     "fed rate cut", "GDP growth", "tariff", "S&P 500",
                     "treasury yield", "jobs report", "housing market"]

    for keyword in ECON_KEYWORDS:
        print(f"  Search: {keyword}")
        markets = search_markets(keyword)
        for m in markets:
            parsed = parse_market(m)
            if parsed["question"] not in seen_questions and parsed["volume"] > 0:
                seen_questions.add(parsed["question"])
                all_markets.append(parsed)

    # Sort by volume (most traded first)
    all_markets.sort(key=lambda x: x["volume"], reverse=True)

    # Print summary
    print(f"\n{'=' * 70}")
    print(f"Found {len(all_markets)} unique markets")
    print(f"{'=' * 70}\n")

    for i, m in enumerate(all_markets[:30]):
        yes_pct = m["prices"].get("Yes", "?")
        print(f"{i+1:2d}. {m['question'][:80]}")
        print(f"    Yes: {yes_pct}%  |  Volume: ${m['volume']:,.0f}  |  Ends: {m['end_date']}")
        print(f"    Angles: {'; '.join(m['data_angles'][:2])}")
        if m["url"]:
            print(f"    {m['url']}")
        print()

    # Save to JSON
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    output = {
        "fetched": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "market_count": len(all_markets),
        "markets": all_markets,
    }
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Saved {len(all_markets)} markets to {OUTPUT_PATH}")
    print("\nDone.")


if __name__ == "__main__":
    main()
