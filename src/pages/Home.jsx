import { Link } from "react-router-dom";

const SNAPSHOT = [
  { label: "Macro Regime",      value: "Goldilocks",  delta: "81% confidence",  color: "#4ade80", up: null },
  { label: "EPOP (Prime Age)",  value: "80.7%",       delta: "+0.2 pts MoM",    color: "#4A90C4", up: true },
  { label: "Unemployment Rate", value: "4.1%",        delta: "Unchanged",       color: "#E8A838", up: null },
  { label: "LFPR",              value: "62.5%",       delta: "−0.1 pts MoM",    color: "#2AA89A", up: false },
  { label: "CPI YoY",           value: "2.4%",        delta: "−0.3 pts MoM",    color: "#a78bfa", up: false },
  { label: "10Y−2Y Spread",     value: "+0.38%",      delta: "Re-steepened",    color: "#f97316", up: true },
];

const SECTIONS = [
  {
    to: "/indicators",
    label: "Macro Metrics",
    tag: "EDITORIAL",
    desc: "Curated indicator pages with trend analysis and interpretation. Updated monthly or when something notable shifts.",
    accent: "#4A90C4",
  },
  {
    to: "/data",
    label: "Data Explorer",
    tag: "TOOL",
    desc: "Build custom demographic cuts of U.S. labor market outcomes from CPS microdata. Nothing like it exists anywhere.",
    accent: "#2AA89A",
  },
  {
    to: "/research",
    label: "Research",
    tag: "ANALYSIS",
    desc: "Original data essays with a thesis, a finding, and an argument — not just a chart.",
    accent: "#E8A838",
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{ background: "var(--ink)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "56px 28px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            letterSpacing: "0.2em", color: "var(--accent)",
            textTransform: "uppercase", marginBottom: 14,
          }}>
            Public Data · Rigorous Analysis · April 2026
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(28px, 4vw, 46px)",
            fontWeight: 700, color: "var(--white)",
            lineHeight: 1.15, marginBottom: 16,
            maxWidth: 680, letterSpacing: "-0.02em",
          }}>
            Macro research grounded<br />in data.
          </h1>
          <p style={{
            fontSize: 15, lineHeight: 1.8,
            color: "rgba(255,255,255,0.4)",
            maxWidth: 520, marginBottom: 32,
          }}>
            CPS microdata tabulation, macro regime classification, and original data essays — built on public data, with an editorial voice.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/data" style={{
              padding: "10px 22px", background: "var(--accent)",
              color: "var(--navy)", borderRadius: 5,
              fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
            }}>
              EXPLORE THE DATA →
            </Link>
            <Link to="/research" style={{
              padding: "10px 22px", background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.6)", borderRadius: 5,
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 12, fontWeight: 500, letterSpacing: "0.04em",
            }}>
              READ THE RESEARCH
            </Link>
          </div>
        </div>
      </div>

      {/* Snapshot strip */}
      <div style={{ background: "var(--navy)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", overflowX: "auto", gap: 0 }}>
          {SNAPSHOT.map((s, i) => (
            <div key={i} style={{
              flex: "0 0 auto", padding: "14px 20px",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              minWidth: 140,
            }}>
              <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: s.color, marginBottom: 3 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: s.up === true ? "#4ade80" : s.up === false ? "#f87171" : "var(--muted)", fontFamily: "'DM Mono', monospace" }}>{s.delta}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section cards */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 28px" }}>
        <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: "0.18em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 24 }}>
          What's Here
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {SECTIONS.map((s) => (
            <Link key={s.to} to={s.to} style={{
              display: "block",
              background: "var(--white)",
              borderRadius: 8,
              padding: "24px 26px",
              borderTop: `3px solid ${s.accent}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
            >
              <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: "0.15em", color: s.accent, textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>{s.tag}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--muted)" }}>{s.desc}</div>
              <div style={{ marginTop: 18, fontSize: 11, fontWeight: 600, color: s.accent, letterSpacing: "0.06em" }}>EXPLORE →</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--fog)", padding: "20px 28px", marginTop: 8 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'DM Mono', monospace" }}>
            Magnastats · Data sourced from CPS, FRED · Updated monthly
          </span>
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'DM Mono', monospace" }}>
            © 2026
          </span>
        </div>
      </div>

    </div>
  );
}
