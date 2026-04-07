import { Link } from "react-router-dom";

const PAPERS = [
  {
    slug: "ai-labor-market",
    title: "Who's Winning the AI Economy? A CPS Deep Dive",
    date: "April 2026",
    tag: "Labor Markets",
    summary: "Displacement and disruption are the wrong frame. The AI boom is producing a skewed distribution of gains — concentrated in college-educated men in knowledge-economy states, widening fastest in finance.",
    dataNote: "12.7M records · CPS Basic Monthly 2018–2026",
  },
];

const COMING = [
  "Geographic EPOP divergence: AI capex hub states vs. the rest",
  "Female LFPR stagnation: why the childcare cost narrative doesn't hold geographically",
  "SLOOS as a leading indicator: what credit supply says before prices move",
  "State pension funding ratios and the coming fiscal reckoning",
];

export default function Research() {
  return (
    <div style={{ minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "var(--ink)", padding: "40px 28px 36px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: "0.2em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 12 }}>
            Working Papers & Data Essays
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "var(--white)", marginBottom: 12, letterSpacing: "-0.02em" }}>
            Research
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 520 }}>
            Original analytical pieces built on public microdata. Each has a question, a finding, and an argument.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 28px" }}>

        {/* Published */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: "0.16em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 20 }}>Published</div>
          {PAPERS.map((p) => (
            <Link key={p.slug} to={`/research/${p.slug}`} style={{ display: "block", background: "var(--white)", borderRadius: 8, padding: "26px 28px", marginBottom: 14, borderLeft: "4px solid var(--accent)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "box-shadow 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: "0.14em", color: "var(--accent)", textTransform: "uppercase", fontWeight: 600 }}>{p.tag}</span>
                <span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "'DM Mono', monospace" }}>· {p.date}</span>
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 10, lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.75, color: "var(--muted)", marginBottom: 14 }}>{p.summary}</div>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "var(--steel)", opacity: 0.7 }}>{p.dataNote}</div>
            </Link>
          ))}
        </div>

        {/* In progress */}
        <div>
          <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: "0.16em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 20 }}>In Progress</div>
          <div style={{ background: "var(--white)", borderRadius: 8, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {COMING.map((title, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 0", borderBottom: i < COMING.length - 1 ? "1px solid var(--fog)" : "none" }}>
                <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: "var(--fog)", background: "var(--mist)", padding: "2px 7px", borderRadius: 3, marginTop: 2, flexShrink: 0 }}>SOON</span>
                <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{title}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
