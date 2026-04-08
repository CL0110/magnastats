import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const INDICATOR_META = {
  yield_spread:  { label: "Yield Curve Spread (10Y–2Y)", unit: "%",  color: "#a78bfa" },
  cpi_yoy:       { label: "CPI Year-over-Year",          unit: "%",  color: "#f97316" },
  epop_overall:  { label: "Prime-Age EPOP",               unit: "",   color: "#34d399" },
  epop_spread:   { label: "EPOP Spread (College − Non)",  unit: "",   color: "#4A90C4" },
  urate_spread:  { label: "Unemp Spread (Non − College)", unit: "",   color: "#E8A838" },
};

const INDICATOR_KEYS = Object.keys(INDICATOR_META);

export default function MacroMetrics() {
  const [data, setData] = useState(null);
  const [activeIndicator, setActiveIndicator] = useState("yield_spread");
  const [hoveredBar, setHoveredBar] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/regimes.json")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Failed to load regime data:", err));
    setTimeout(() => setMounted(true), 100);
  }, []);

  if (!data) {
    return (
      <div style={{ background: "#080c0a", minHeight: "100vh", color: "#e8e4dc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
        Loading regime data…
      </div>
    );
  }

  const regimeDefs = data.regime_definitions;
  const regimeList = Object.values(regimeDefs);
  const current = data.current_regime;
  const currentProbs = data.current_probabilities;
  const transitions = data.transition_probabilities;
  const timeline = data.timeline;
  const indicatorSeries = data.indicator_series;

  // Aggregate timeline to yearly (last month of each year)
  const yearlyMap = {};
  timeline.forEach((t) => {
    const year = t.date.slice(0, 4);
    yearlyMap[year] = t;
  });
  const yearlyTimeline = Object.values(yearlyMap);

  const stayProb = transitions[current.key];

  return (
    <div style={{ background: "#080c0a", minHeight: "100vh", fontFamily: "Georgia, serif", color: "#e8e4dc", overflowX: "hidden" }}>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)", transition: "all 0.6s ease", marginBottom: 48 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#4ade80", marginBottom: 14, fontFamily: "monospace" }}>
            MACRO REGIMES · UPDATED {data.generated}
          </div>
          <h1 style={{ fontSize: 34, lineHeight: 1.2, fontWeight: 700, marginBottom: 16, color: "#f0ece4", margin: "0 0 16px" }}>
            What State Is the Economy In Right Now?
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "#7a8a6a", maxWidth: 600, margin: 0 }}>
            A 6-state Hidden Markov Model trained on FRED macroeconomic indicators and CPS education-based distributional spreads. The spread variable is what separates Narrow Goldilocks from Broad, and Uneven Recovery from standard recovery — states invisible to a traditional 4-regime model.
          </p>
        </div>

        {/* Current regime callout */}
        <div style={{ opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.2s", background: "#0d1f0f", border: "1px solid #1e3a20", borderLeft: `4px solid ${current.color}`, borderRadius: 4, padding: "24px 28px", marginBottom: 48, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.18em", color: current.color, marginBottom: 10, fontFamily: "monospace" }}>
              CURRENT REGIME · {currentProbs[current.key]}% CONFIDENCE
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: current.color, marginBottom: 4 }}>{current.label}</div>
            <div style={{ fontSize: 13, color: "#5a8a5a" }}>{current.desc}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {regimeList.map((r) => {
              const isActive = r.key === current.key;
              return (
                <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: r.color, opacity: isActive ? 1 : 0.35 }} />
                  <span style={{ fontSize: 12, color: isActive ? "#e8e4dc" : "#3a4a3a", minWidth: 120, fontFamily: "monospace" }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontFamily: "monospace", color: isActive ? r.color : "#2a3a2a" }}>{currentProbs[r.key]}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prose */}
        <div style={{ marginBottom: 48, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.3s" }}>
          <p style={{ fontSize: 15, lineHeight: 1.85, color: "#9aaa8a", marginBottom: 14 }}>
            The model identifies regimes from six monthly series: the 10Y–2Y yield spread, CPI YoY, prime-age employment-population ratio, manufacturing employment, and two distributional inputs — the college vs. non-college EPOP spread and unemployment rate spread, computed from CPS microdata.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.85, color: "#9aaa8a", margin: 0 }}>
            The key methodological contribution is using education-based spreads as the distributional factor. This cleanly separates <strong style={{ color: current.color }}>Narrow Goldilocks</strong> (aggregate looks healthy but gains are top-heavy) from <strong style={{ color: regimeDefs.broad_goldilocks.color }}>Broad Goldilocks</strong> (gains shared widely) — a distinction invisible in standard macro regime models.
          </p>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: 56, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.4s" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#4a5a4a", marginBottom: 16, fontFamily: "monospace" }}>
            REGIME HISTORY
          </div>
          <div style={{ display: "flex", gap: 2, height: 48, marginBottom: 10 }}>
            {yearlyTimeline.map((d, i) => {
              const def = regimeDefs[d.regime];
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredBar(d)}
                  onMouseLeave={() => setHoveredBar(null)}
                  style={{
                    flex: 1, background: def?.color || "#333",
                    opacity: hoveredBar?.date === d.date ? 1 : 0.55,
                    borderRadius: 2, cursor: "pointer", transition: "opacity 0.15s",
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#3a4a3a", fontFamily: "monospace", marginBottom: 12 }}>
            {yearlyTimeline.filter((_, i) => i % 5 === 0 || i === yearlyTimeline.length - 1).map((d) => (
              <span key={d.date}>{d.date.slice(0, 4)}</span>
            ))}
          </div>
          {hoveredBar ? (
            <div style={{ background: "#0d1a0e", border: "1px solid #1e3a20", borderRadius: 4, padding: "10px 14px", fontSize: 12, display: "flex", gap: 20, flexWrap: "wrap" }}>
              <span style={{ color: "#5a9e5a", fontFamily: "monospace" }}>{hoveredBar.date}</span>
              <span style={{ color: regimeDefs[hoveredBar.regime]?.color, fontWeight: 600 }}>{regimeDefs[hoveredBar.regime]?.label}</span>
              <span style={{ color: "#4a5a4a" }}>{hoveredBar.prob}% confidence</span>
              <span style={{ color: "#4a5a4a" }}>{regimeDefs[hoveredBar.regime]?.desc}</span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "#2a3a2a", fontFamily: "monospace" }}>Hover a bar to inspect</div>
          )}
          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            {regimeList.map((r) => (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 9, height: 9, borderRadius: 2, background: r.color, opacity: 0.65 }} />
                <span style={{ fontSize: 10, color: "#4a5a4a", letterSpacing: "0.08em", fontFamily: "monospace" }}>{r.label.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Indicator panel */}
        <div style={{ marginBottom: 56, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.5s" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#4a5a4a", marginBottom: 16, fontFamily: "monospace" }}>INDICATOR DETAIL</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
            {INDICATOR_KEYS.map((key) => (
              <button key={key} onClick={() => setActiveIndicator(key)} style={{
                background: activeIndicator === key ? "#0d2a0f" : "transparent",
                border: activeIndicator === key ? "1px solid #2a4a2a" : "1px solid #1a2a1a",
                color: activeIndicator === key ? "#4ade80" : "#3a4a3a",
                padding: "6px 14px", borderRadius: 3, fontSize: 11,
                letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.2s", fontFamily: "monospace",
              }}>
                {INDICATOR_META[key].label.split("(")[0].trim()}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#5a8a5a", marginBottom: 12, fontFamily: "monospace" }}>
            {INDICATOR_META[activeIndicator].label}
            {data.indicators[activeIndicator] != null && (
              <span style={{ color: INDICATOR_META[activeIndicator].color, marginLeft: 12 }}>
                Latest: {data.indicators[activeIndicator]}{INDICATOR_META[activeIndicator].unit}
              </span>
            )}
          </div>
          {indicatorSeries[activeIndicator] && (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={indicatorSeries[activeIndicator]} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="indGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={INDICATOR_META[activeIndicator].color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={INDICATOR_META[activeIndicator].color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#3a4a3a", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#3a4a3a", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0d1a0e", border: "1px solid #1e3a20", borderRadius: 4, fontSize: 11, fontFamily: "monospace" }}
                  labelStyle={{ color: "#5a9e5a" }}
                  itemStyle={{ color: INDICATOR_META[activeIndicator].color }}
                  formatter={(v) => [`${v}${INDICATOR_META[activeIndicator].unit}`, ""]}
                />
                <Area type="monotone" dataKey="value" stroke={INDICATOR_META[activeIndicator].color} strokeWidth={2} fill="url(#indGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Transition probabilities */}
        <div style={{ marginBottom: 56, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.55s" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#4a5a4a", marginBottom: 6, fontFamily: "monospace" }}>
            TRANSITION PROBABILITIES FROM {current.label.toUpperCase()}
          </div>
          <p style={{ fontSize: 12, color: "#3a4a3a", marginBottom: 20, fontFamily: "monospace" }}>Estimated probability of moving to each regime next period</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {regimeList.map((r) => (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#5a6a5a", minWidth: 140 }}>→ {r.label}</span>
                <div style={{ flex: 1, height: 7, background: "#0d1a0e", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${transitions[r.key]}%`, height: "100%", background: r.color, opacity: 0.7, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: r.color, minWidth: 36, textAlign: "right" }}>{transitions[r.key]}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* What to Watch */}
        <div style={{ marginBottom: 56, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.6s" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f0ece4", marginBottom: 14 }}>What to Watch</h2>
          <p style={{ fontSize: 15, lineHeight: 1.85, color: "#9aaa8a", marginBottom: 14 }}>
            The distinction between Narrow and Broad Goldilocks hinges on the education-based EPOP spread. When aggregate employment looks healthy but the college–non-college gap is widening, the economy is in a K-shaped state that standard macro indicators miss entirely.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.85, color: "#9aaa8a", margin: 0 }}>
            Similarly, Uneven Recovery looks like a standard recovery on headline numbers, but distributional damage — measured by the unemployment rate spread — remains sticky. Both regimes are empirically the novel contribution of this 6-state model.
          </p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #1a2a1a", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.65s", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 11, color: "#3a4a3a", fontFamily: "monospace" }}>
            HMM (N=6) · FRED + CPS microdata · Generated {data.generated}
          </div>
          <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace", cursor: "pointer", letterSpacing: "0.1em" }}>
            METHODOLOGY →
          </span>
        </div>

      </div>
    </div>
  );
}
