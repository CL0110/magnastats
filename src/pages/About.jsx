export default function About() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "64px 28px" }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 13,
          letterSpacing: "0.16em", color: "var(--accent)",
          textTransform: "uppercase", marginBottom: 14,
        }}>
          About Magnastats
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(30px, 4vw, 44px)",
          fontWeight: 700, color: "var(--white)",
          lineHeight: 1.15, marginBottom: 24,
          letterSpacing: "-0.02em",
        }}>
          The data exists.<br />The access doesn't.
        </h1>
        <p style={{
          fontSize: 17, lineHeight: 1.85,
          color: "rgba(255,255,255,0.65)",
          marginBottom: 20,
        }}>
          The U.S. government publishes some of the richest microdata in the world — CPS, JOLTS, CES, FRED — all free, all public. But accessing it meaningfully requires cleaning raw flat files, weighting survey responses, and writing code that most people don't have time to learn.
        </p>
        <p style={{
          fontSize: 17, lineHeight: 1.85,
          color: "rgba(255,255,255,0.65)",
          marginBottom: 20,
        }}>
          The result is a gap: the data is technically public, but the ability to use it is not evenly distributed. Institutional research desks have the infrastructure. Independent analysts, journalists, and students often don't.
        </p>
        <p style={{
          fontSize: 17, lineHeight: 1.85,
          color: "rgba(255,255,255,0.65)",
          marginBottom: 36,
        }}>
          Magnastats exists to close that gap — making public economic data genuinely accessible through interactive tools, original analysis, and an editorial voice grounded in the numbers.
        </p>

        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: 32,
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 12,
            letterSpacing: "0.12em", color: "var(--accent)",
            textTransform: "uppercase", marginBottom: 12,
          }}>
            Get in Touch
          </div>
          <a
            href="mailto:claire.bolam@magnastats.com"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "var(--accent)",
              color: "var(--navy)",
              borderRadius: 5,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.04em",
            }}
          >
            claire.bolam@magnastats.com
          </a>
        </div>
      </div>
    </div>
  );
}
