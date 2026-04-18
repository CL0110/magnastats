export default function Contact() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "64px 28px" }}>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: 13,
          letterSpacing: "0.2em", color: "var(--accent)",
          textTransform: "uppercase", marginBottom: 14,
        }}>
          Get in Touch
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(28px, 4vw, 42px)",
          fontWeight: 700, color: "var(--white)",
          lineHeight: 1.15, marginBottom: 20,
          letterSpacing: "-0.02em",
        }}>
          Contact
        </h1>
        <p style={{
          fontSize: 16, lineHeight: 1.8,
          color: "rgba(255,255,255,0.65)",
          marginBottom: 32,
        }}>
          For inquiries, collaborations, or questions about the data, reach out via email.
        </p>
        <a
          href="mailto:claire.bolam@magnastats.com"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "var(--accent)",
            color: "var(--navy)",
            borderRadius: 5,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.04em",
          }}
        >
          claire.bolam@magnastats.com
        </a>
      </div>
    </div>
  );
}
