import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Override regime colors: green/blue = healthy, red/orange = contractionary
const REGIME_COLORS = {
  narrow_goldilocks:  "#16a34a",  // green
  broad_goldilocks:   "#2563eb",  // blue
  broad_reflation:    "#7c3aed",  // purple
  stagflation:        "#ea580c",  // orange
  acute_contraction:  "#dc2626",  // red
  uneven_recovery:    "#ca8a04",  // amber
};

const INDICATOR_META = {
  yield_spread:  { label: "Yield Curve Spread (10Y–2Y)", unit: "%",  color: "#7c3aed" },
  cpi_yoy:       { label: "CPI Year-over-Year",          unit: "%",  color: "#ea580c" },
  epop_overall:  { label: "Prime-Age EPOP",               unit: "",   color: "#16a34a" },
  epop_spread:   { label: "EPOP Spread (College − Non)",  unit: "",   color: "#2563eb" },
  urate_spread:  { label: "Unemp Spread (Non − College)", unit: "",   color: "#ca8a04" },
};

const INDICATOR_KEYS = Object.keys(INDICATOR_META);

function getColor(key) {
  return REGIME_COLORS[key] || "#555";
}

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
      <div style={{ background: "#f0f2f5", minHeight: "100vh", color: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 15 }}>
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

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", fontFamily: "Georgia, serif", color: "#1a1a2e", overflowX: "hidden" }}>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "44px 28px" }}>

        {/* Header */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)", transition: "all 0.6s ease", marginBottom: 36 }}>
          <div style={{ fontSize: 13, letterSpacing: "0.16em", color: getColor(current.key), marginBottom: 14, fontFamily: "monospace", fontWeight: 600 }}>
            MACRO REGIMES · UPDATED {data.generated}
          </div>
          <h1 style={{ fontSize: 38, lineHeight: 1.15, fontWeight: 700, marginBottom: 16, color: "#1a1a2e", margin: "0 0 16px" }}>
            What State Is the Economy In Right Now?
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "#6b7280", maxWidth: 680, margin: 0 }}>
            A 6-state Hidden Markov Model trained on FRED macroeconomic indicators and CPS education-based distributional spreads. The spread variable is what separates Narrow Goldilocks from Broad, and Uneven Recovery from standard recovery — states invisible to a traditional 4-regime model.
          </p>
        </div>

        {/* Current regime callout */}
        <div style={{
          opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.2s",
          background: `${getColor(current.key)}08`, border: `1px solid ${getColor(current.key)}25`,
          borderLeft: `5px solid ${getColor(current.key)}`, borderRadius: 8,
          padding: "28px 32px", marginBottom: 36,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 24,
          boxShadow: `0 2px 12px ${getColor(current.key)}12`,
        }}>
          <div>
            <div style={{ fontSize: 13, letterSpacing: "0.14em", color: getColor(current.key), marginBottom: 10, fontFamily: "monospace", fontWeight: 600 }}>
              CURRENT REGIME · {currentProbs[current.key]}% CONFIDENCE
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: getColor(current.key), marginBottom: 6 }}>{current.label}</div>
            <div style={{ fontSize: 15, color: "#6b7280" }}>{current.desc}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {regimeList.map((r) => {
              const isActive = r.key === current.key;
              return (
                <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: getColor(r.key), opacity: isActive ? 1 : 0.35 }} />
                  <span style={{ fontSize: 14, color: isActive ? "#1a1a2e" : "#9ca3af", minWidth: 140, fontFamily: "monospace", fontWeight: isActive ? 600 : 400 }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontFamily: "monospace", color: isActive ? getColor(r.key) : "#c0c7cf", fontWeight: 600 }}>{currentProbs[r.key]}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prose */}
        <div style={{ marginBottom: 36, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.3s" }}>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "#4b5563", marginBottom: 14 }}>
            The model identifies regimes from six monthly series: the 10Y–2Y yield spread, CPI YoY, prime-age employment-population ratio, manufacturing employment, and two distributional inputs — the college vs. non-college EPOP spread and unemployment rate spread, computed from CPS microdata.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "#4b5563", margin: 0 }}>
            The key methodological contribution is using education-based spreads as the distributional factor. This cleanly separates <strong style={{ color: getColor("narrow_goldilocks") }}>Narrow Goldilocks</strong> (aggregate looks healthy but gains are top-heavy) from <strong style={{ color: getColor("broad_goldilocks") }}>Broad Goldilocks</strong> (gains shared widely) — a distinction invisible in standard macro regime models.
          </p>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: 44, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.4s" }}>
          <div style={{ fontSize: 13, letterSpacing: "0.14em", color: "#9ca3af", marginBottom: 20, fontFamily: "monospace", fontWeight: 600 }}>
            REGIME HISTORY
          </div>

          {/* Group consecutive same-regime years into spans */}
          {(() => {
            const spans = [];
            let i = 0;
            while (i < yearlyTimeline.length) {
              const start = i;
              const regime = yearlyTimeline[i].regime;
              while (i < yearlyTimeline.length && yearlyTimeline[i].regime === regime) i++;
              spans.push({ regime, startIdx: start, endIdx: i - 1, count: i - start });
            }
            return (
              <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                {spans.map((span, si) => {
                  const def = regimeDefs[span.regime];
                  const color = getColor(span.regime);
                  const startYear = yearlyTimeline[span.startIdx].date.slice(0, 4);
                  const endYear = yearlyTimeline[span.endIdx].date.slice(0, 4);
                  const yearRange = startYear === endYear ? startYear : `${startYear}–${endYear.slice(2)}`;
                  const isHovered = hoveredBar && yearlyTimeline.slice(span.startIdx, span.endIdx + 1).some(d => d.date === hoveredBar.date);
                  return (
                    <div
                      key={si}
                      onMouseEnter={() => setHoveredBar(yearlyTimeline[span.endIdx])}
                      onMouseLeave={() => setHoveredBar(null)}
                      style={{
                        flex: span.count,
                        display: "flex", flexDirection: "column", alignItems: "center",
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      {/* Label above bar */}
                      <div style={{
                        fontSize: span.count >= 3 ? 12 : 10,
                        fontWeight: 700,
                        color: isHovered ? color : `${color}bb`,
                        fontFamily: "monospace",
                        letterSpacing: "0.04em",
                        marginBottom: 6,
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                      }}>
                        {span.count >= 2 ? def?.label?.toUpperCase() : ""}
                      </div>
                      {/* Bar */}
                      <div style={{
                        width: "100%",
                        height: 60,
                        background: color,
                        opacity: isHovered ? 1 : 0.8,
                        borderRadius: 4,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "opacity 0.2s, transform 0.2s",
                        transform: isHovered ? "scaleY(1.08)" : "scaleY(1)",
                        boxShadow: isHovered ? `0 4px 12px ${color}44` : "none",
                      }}>
                        {span.count >= 3 && (
                          <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.9)",
                            fontFamily: "monospace",
                            letterSpacing: "0.06em",
                          }}>
                            {yearRange}
                          </span>
                        )}
                      </div>
                      {/* Year below bar */}
                      <div style={{
                        fontSize: 11, color: "#9ca3af", fontFamily: "monospace",
                        marginTop: 6, textAlign: "center",
                      }}>
                        {span.count < 3 ? yearRange : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Hover detail */}
          {hoveredBar ? (
            <div style={{ background: "#ffffff", border: `1px solid ${getColor(hoveredBar.regime)}33`, borderRadius: 6, padding: "14px 18px", fontSize: 14, display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <span style={{ color: getColor(hoveredBar.regime), fontWeight: 700, fontFamily: "monospace" }}>{hoveredBar.date}</span>
              <span style={{ color: getColor(hoveredBar.regime), fontWeight: 600 }}>{regimeDefs[hoveredBar.regime]?.label}</span>
              <span style={{ color: "#6b7280" }}>{hoveredBar.prob}% confidence</span>
              <span style={{ color: "#9ca3af" }}>{regimeDefs[hoveredBar.regime]?.desc}</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#c0c7cf", fontFamily: "monospace", marginBottom: 16 }}>Hover a regime span to inspect</div>
          )}

          {/* Legend */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {regimeList.map((r) => (
              <div key={r.key} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 6,
                background: "#ffffff",
                border: `1px solid ${getColor(r.key)}22`,
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}>
                <div style={{ width: 16, height: 16, borderRadius: 3, background: getColor(r.key), flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: getColor(r.key), fontFamily: "monospace" }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", marginTop: 2 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicator panel */}
        <div style={{ marginBottom: 44, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.5s" }}>
          <div style={{ fontSize: 13, letterSpacing: "0.14em", color: "#9ca3af", marginBottom: 16, fontFamily: "monospace", fontWeight: 600 }}>INDICATOR DETAIL</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {INDICATOR_KEYS.map((key) => (
              <button key={key} onClick={() => setActiveIndicator(key)} style={{
                background: activeIndicator === key ? "#ffffff" : "transparent",
                border: activeIndicator === key ? `1px solid ${INDICATOR_META[key].color}44` : "1px solid #e5e7eb",
                color: activeIndicator === key ? INDICATOR_META[key].color : "#9ca3af",
                padding: "8px 16px", borderRadius: 5, fontSize: 13,
                letterSpacing: "0.06em", cursor: "pointer", transition: "all 0.2s", fontFamily: "monospace",
                fontWeight: activeIndicator === key ? 600 : 400,
                boxShadow: activeIndicator === key ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}>
                {INDICATOR_META[key].label.split("(")[0].trim()}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 12, fontFamily: "monospace" }}>
            {INDICATOR_META[activeIndicator].label}
            {data.indicators[activeIndicator] != null && (
              <span style={{ color: INDICATOR_META[activeIndicator].color, marginLeft: 12, fontWeight: 600 }}>
                Latest: {data.indicators[activeIndicator]}{INDICATOR_META[activeIndicator].unit}
              </span>
            )}
          </div>
          {indicatorSeries[activeIndicator] && (
            <div style={{ background: "#ffffff", borderRadius: 6, padding: "18px 14px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={indicatorSeries[activeIndicator]} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="indGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={INDICATOR_META[activeIndicator].color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={INDICATOR_META[activeIndicator].color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, fontFamily: "monospace", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                    labelStyle={{ color: "#4b5563" }}
                    itemStyle={{ color: INDICATOR_META[activeIndicator].color }}
                    formatter={(v) => [`${v}${INDICATOR_META[activeIndicator].unit}`, ""]}
                  />
                  <Area type="monotone" dataKey="value" stroke={INDICATOR_META[activeIndicator].color} strokeWidth={2} fill="url(#indGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Transition probabilities */}
        <div style={{ marginBottom: 44, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.55s" }}>
          <div style={{ fontSize: 13, letterSpacing: "0.14em", color: "#9ca3af", marginBottom: 8, fontFamily: "monospace", fontWeight: 600 }}>
            TRANSITION PROBABILITIES FROM {current.label.toUpperCase()}
          </div>
          <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 18, fontFamily: "monospace" }}>Estimated probability of moving to each regime next period</p>
          <div style={{ background: "#ffffff", borderRadius: 6, padding: "22px 26px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {regimeList.map((r) => (
                <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 13, fontFamily: "monospace", color: "#6b7280", minWidth: 160 }}>→ {r.label}</span>
                  <div style={{ flex: 1, height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${transitions[r.key]}%`, height: "100%", background: getColor(r.key), opacity: 0.8, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 13, fontFamily: "monospace", color: getColor(r.key), minWidth: 40, textAlign: "right", fontWeight: 600 }}>{transitions[r.key]}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What to Watch */}
        <div style={{ marginBottom: 44, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.6s" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e", marginBottom: 14 }}>What to Watch</h2>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "#4b5563", marginBottom: 14 }}>
            The distinction between Narrow and Broad Goldilocks hinges on the education-based EPOP spread. When aggregate employment looks healthy but the college–non-college gap is widening, the economy is in a K-shaped state that standard macro indicators miss entirely.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: "#4b5563", margin: 0 }}>
            Similarly, Uneven Recovery looks like a standard recovery on headline numbers, but distributional damage — measured by the unemployment rate spread — remains sticky. Both regimes are empirically the novel contribution of this 6-state model.
          </p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.65s", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
            HMM (N=6) · FRED + CPS microdata · Generated {data.generated}
          </div>
          <span style={{ fontSize: 13, color: getColor(current.key), fontFamily: "monospace", cursor: "pointer", letterSpacing: "0.08em", fontWeight: 600 }}>
            METHODOLOGY →
          </span>
        </div>

      </div>
    </div>
  );
}
