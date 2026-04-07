import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const REGIMES = {
  goldilocks: { label: "Goldilocks", color: "#4ade80", desc: "Growth above trend · Inflation contained" },
  reflation: { label: "Reflation", color: "#facc15", desc: "Recovery accelerating · Inflation rising" },
  stagflation: { label: "Stagflation", color: "#f97316", desc: "Growth slowing · Inflation elevated" },
  contraction: { label: "Contraction", color: "#60a5fa", desc: "Growth falling · Deflation risk" },
};

const timelineData = [
  { date: "2000", regime: "reflation", prob: 0.82 },
  { date: "2001", regime: "contraction", prob: 0.91 },
  { date: "2002", regime: "contraction", prob: 0.87 },
  { date: "2003", regime: "reflation", prob: 0.76 },
  { date: "2004", regime: "goldilocks", prob: 0.88 },
  { date: "2005", regime: "goldilocks", prob: 0.91 },
  { date: "2006", regime: "goldilocks", prob: 0.85 },
  { date: "2007", regime: "stagflation", prob: 0.72 },
  { date: "2008", regime: "contraction", prob: 0.95 },
  { date: "2009", regime: "contraction", prob: 0.93 },
  { date: "2010", regime: "reflation", prob: 0.81 },
  { date: "2011", regime: "stagflation", prob: 0.68 },
  { date: "2012", regime: "reflation", prob: 0.74 },
  { date: "2013", regime: "goldilocks", prob: 0.83 },
  { date: "2014", regime: "goldilocks", prob: 0.89 },
  { date: "2015", regime: "goldilocks", prob: 0.78 },
  { date: "2016", regime: "reflation", prob: 0.71 },
  { date: "2017", regime: "goldilocks", prob: 0.92 },
  { date: "2018", regime: "goldilocks", prob: 0.87 },
  { date: "2019", regime: "goldilocks", prob: 0.79 },
  { date: "2020", regime: "contraction", prob: 0.97 },
  { date: "2021", regime: "reflation", prob: 0.88 },
  { date: "2022", regime: "stagflation", prob: 0.94 },
  { date: "2023", regime: "stagflation", prob: 0.71 },
  { date: "2024", regime: "goldilocks", prob: 0.76 },
  { date: "2025", regime: "goldilocks", prob: 0.81 },
];

const indicatorData = {
  yield_curve: [
    { date: "2020", value: 0.54 }, { date: "2021", value: 1.58 }, { date: "2022", value: -0.82 },
    { date: "2023", value: -1.06 }, { date: "2024", value: 0.12 }, { date: "2025", value: 0.38 },
  ],
  cpi: [
    { date: "2020", value: 1.2 }, { date: "2021", value: 4.7 }, { date: "2022", value: 8.0 },
    { date: "2023", value: 4.1 }, { date: "2024", value: 2.9 }, { date: "2025", value: 2.4 },
  ],
  epop: [
    { date: "2020", value: 51.3 }, { date: "2021", value: 58.4 }, { date: "2022", value: 59.9 },
    { date: "2023", value: 60.4 }, { date: "2024", value: 60.7 }, { date: "2025", value: 60.9 },
  ],
};

const indicatorMeta = {
  yield_curve: { label: "Yield Curve Spread (10Y–2Y)", unit: "%", color: "#a78bfa" },
  cpi: { label: "CPI YoY", unit: "%", color: "#f97316" },
  epop: { label: "Employment-Population Ratio", unit: "%", color: "#34d399" },
};

const INDICATORS = ["yield_curve", "cpi", "epop"];
const INDICATOR_LABELS = { yield_curve: "Yield Curve", cpi: "CPI YoY", epop: "EPOP" };

export default function MacroMetrics() {
  const [activeIndicator, setActiveIndicator] = useState("yield_curve");
  const [hoveredYear, setHoveredYear] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const currentProb = 81;

  return (
    <div style={{ background: "#080c0a", minHeight: "100vh", fontFamily: "Georgia, serif", color: "#e8e4dc", overflowX: "hidden" }}>

      {/* Nav */}
      <div style={{ borderBottom: "1px solid #1a2a1a", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
        <span style={{ fontSize: 16, letterSpacing: "0.08em", color: "#e8e4dc", fontWeight: 700 }}>MAGNASTATS</span>
        <div style={{ display: "flex", gap: 24, fontSize: 11, letterSpacing: "0.12em" }}>
          {["INDICATORS", "DATA", "RESEARCH"].map(n => (
            <span key={n} style={{ cursor: "pointer", color: n === "INDICATORS" ? "#4ade80" : "#4a5a4a" }}>{n}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)", transition: "all 0.6s ease", marginBottom: 48 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#4ade80", marginBottom: 14, fontFamily: "monospace" }}>
            MACRO REGIMES · UPDATED MARCH 2026
          </div>
          <h1 style={{ fontSize: 34, lineHeight: 1.2, fontWeight: 700, marginBottom: 16, color: "#f0ece4", margin: "0 0 16px" }}>
            What State Is the Economy In Right Now?
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "#7a8a6a", maxWidth: 600, margin: 0 }}>
            A Hidden Markov Model trained on FRED macroeconomic indicators classifies the current environment into one of four regimes. Here's what it sees.
          </p>
        </div>

        {/* Current regime callout */}
        <div style={{ opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.2s", background: "#0d1f0f", border: "1px solid #1e3a20", borderLeft: "4px solid #4ade80", borderRadius: 4, padding: "24px 28px", marginBottom: 48, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#4ade80", marginBottom: 10, fontFamily: "monospace" }}>
              CURRENT REGIME · {currentProb}% CONFIDENCE
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#4ade80", marginBottom: 4 }}>Goldilocks</div>
            <div style={{ fontSize: 13, color: "#5a8a5a" }}>Growth above trend · Inflation contained</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Goldilocks", color: "#4ade80", val: "81%", active: true },
              { label: "Reflation", color: "#facc15", val: "6%", active: false },
              { label: "Stagflation", color: "#f97316", val: "11%", active: false },
              { label: "Contraction", color: "#60a5fa", val: "2%", active: false },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: r.color, opacity: r.active ? 1 : 0.35 }} />
                <span style={{ fontSize: 12, color: r.active ? "#e8e4dc" : "#3a4a3a", minWidth: 80, fontFamily: "monospace" }}>{r.label}</span>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: r.active ? "#4ade80" : "#2a3a2a" }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prose 1 */}
        <div style={{ marginBottom: 48, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.3s" }}>
          <p style={{ fontSize: 15, lineHeight: 1.85, color: "#9aaa8a", marginBottom: 14 }}>
            The U.S. economy has spent much of 2024–2025 in a <strong style={{ color: "#e8e4dc" }}>Goldilocks regime</strong> — growth holding above trend while inflation cools toward target. After a pronounced stagflationary episode in 2022 and a slow disinflationary grind through 2023, the transition probability matrix now shows a 72% likelihood of remaining in the current state through the next quarter.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.85, color: "#9aaa8a", margin: 0 }}>
            The model identifies regimes from five monthly FRED series: the 10Y–2Y yield spread, CPI YoY, the employment-population ratio, ISM Manufacturing PMI, and real GDP growth.
          </p>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: 56, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.4s" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#4a5a4a", marginBottom: 16, fontFamily: "monospace" }}>
            REGIME HISTORY 2000–2025
          </div>
          <div style={{ display: "flex", gap: 2, height: 48, marginBottom: 10 }}>
            {timelineData.map((d, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredYear(d)}
                onMouseLeave={() => setHoveredYear(null)}
                style={{ flex: 1, background: REGIMES[d.regime].color, opacity: hoveredYear?.date === d.date ? 1 : 0.55, borderRadius: 2, cursor: "pointer", transition: "opacity 0.15s" }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#3a4a3a", fontFamily: "monospace", marginBottom: 12 }}>
            {["2000", "2005", "2010", "2015", "2020", "2025"].map(y => <span key={y}>{y}</span>)}
          </div>
          {hoveredYear ? (
            <div style={{ background: "#0d1a0e", border: "1px solid #1e3a20", borderRadius: 4, padding: "10px 14px", fontSize: 12, display: "flex", gap: 20, flexWrap: "wrap" }}>
              <span style={{ color: "#5a9e5a", fontFamily: "monospace" }}>{hoveredYear.date}</span>
              <span style={{ color: REGIMES[hoveredYear.regime].color, fontWeight: 600 }}>{REGIMES[hoveredYear.regime].label}</span>
              <span style={{ color: "#4a5a4a" }}>{Math.round(hoveredYear.prob * 100)}% confidence</span>
              <span style={{ color: "#4a5a4a" }}>{REGIMES[hoveredYear.regime].desc}</span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "#2a3a2a", fontFamily: "monospace" }}>Hover a bar to inspect</div>
          )}
          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            {Object.entries(REGIMES).map(([key, r]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
            {INDICATORS.map(ind => (
              <button key={ind} onClick={() => setActiveIndicator(ind)} style={{ background: activeIndicator === ind ? "#0d2a0f" : "transparent", border: activeIndicator === ind ? "1px solid #2a4a2a" : "1px solid #1a2a1a", color: activeIndicator === ind ? "#4ade80" : "#3a4a3a", padding: "6px 14px", borderRadius: 3, fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.2s", fontFamily: "monospace" }}>
                {INDICATOR_LABELS[ind]}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#5a8a5a", marginBottom: 12, fontFamily: "monospace" }}>{indicatorMeta[activeIndicator].label}</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={indicatorData[activeIndicator]} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="indGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={indicatorMeta[activeIndicator].color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={indicatorMeta[activeIndicator].color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#3a4a3a", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#3a4a3a", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0d1a0e", border: "1px solid #1e3a20", borderRadius: 4, fontSize: 11, fontFamily: "monospace" }} labelStyle={{ color: "#5a9e5a" }} itemStyle={{ color: indicatorMeta[activeIndicator].color }} formatter={(v) => [`${v}${indicatorMeta[activeIndicator].unit}`, ""]} />
              <Area type="monotone" dataKey="value" stroke={indicatorMeta[activeIndicator].color} strokeWidth={2} fill="url(#indGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Transition probabilities */}
        <div style={{ marginBottom: 56, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.55s" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#4a5a4a", marginBottom: 6, fontFamily: "monospace" }}>TRANSITION PROBABILITIES FROM CURRENT STATE</div>
          <p style={{ fontSize: 12, color: "#3a4a3a", marginBottom: 20, fontFamily: "monospace" }}>Estimated probability of moving to each regime next quarter</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "→ Goldilocks", prob: 0.72, color: "#4ade80" },
              { label: "→ Reflation", prob: 0.14, color: "#facc15" },
              { label: "→ Stagflation", prob: 0.08, color: "#f97316" },
              { label: "→ Contraction", prob: 0.06, color: "#60a5fa" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#5a6a5a", minWidth: 110 }}>{item.label}</span>
                <div style={{ flex: 1, height: 7, background: "#0d1a0e", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${item.prob * 100}%`, height: "100%", background: item.color, opacity: 0.7, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: item.color, minWidth: 32, textAlign: "right" }}>{Math.round(item.prob * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prose 2 */}
        <div style={{ marginBottom: 56, opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.6s" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f0ece4", marginBottom: 14 }}>What to Watch</h2>
          <p style={{ fontSize: 15, lineHeight: 1.85, color: "#9aaa8a", marginBottom: 14 }}>
            The primary risk to the current Goldilocks classification is a re-acceleration of services inflation — particularly if shelter costs remain sticky while goods deflation fades. The yield curve has recently re-steepened to positive territory, which historically precedes either a sustained expansion or a late-cycle false dawn.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.85, color: "#9aaa8a", margin: 0 }}>
            The model assigns an 8% probability to a Stagflation transition. A sustained ISM reading below 48 combined with CPI re-acceleration above 3.5% would be the clearest signal of regime deterioration.
          </p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #1a2a1a", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: mounted ? 1 : 0, transition: "all 0.6s ease 0.65s", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 11, color: "#3a4a3a", fontFamily: "monospace" }}>
            HMM (N=4) · FRED data · Updated monthly via GitHub Actions
          </div>
          <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace", cursor: "pointer", letterSpacing: "0.1em" }}>
            REPLICATION CODE →
          </span>
        </div>

      </div>
    </div>
  );
}
