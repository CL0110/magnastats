import { Link } from "react-router-dom";

const C = {
  navy: "#0D1B2A", ink: "#1A2B3C", steel: "#2C4A6E",
  accent: "#E8A838", muted: "#6B7F96", fog: "#E4EBF2",
  mist: "#F0F4F8", white: "#FFFFFF", text: "#1A2B3C",
};

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: "0.18em", color: C.accent, textTransform: "uppercase", marginBottom: 16, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

function Finding({ stat, text }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "14px 18px", background: C.mist, borderLeft: `3px solid ${C.accent}`, borderRadius: "0 6px 6px 0", marginBottom: 10 }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.steel, minWidth: 72, lineHeight: 1 }}>{stat}</div>
      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{text}</div>
    </div>
  );
}

function P({ children, style }) {
  return <p style={{ fontSize: 15, lineHeight: 1.85, color: "#4a5a6a", marginBottom: 18, ...style }}>{children}</p>;
}

function H2({ children }) {
  return <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 14, marginTop: 8, lineHeight: 1.3 }}>{children}</h2>;
}

export default function AILaborMarket() {
  return (
    <div style={{ minHeight: "100vh", background: C.mist }}>

      {/* Header */}
      <div style={{ background: C.ink, padding: "48px 28px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <Link to="/research" style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", display: "inline-block", marginBottom: 20 }}>← RESEARCH</Link>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: "0.14em", color: C.accent, textTransform: "uppercase", fontWeight: 600 }}>Labor Markets</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace" }}>· April 2026</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, color: C.white, lineHeight: 1.2, marginBottom: 18, letterSpacing: "-0.02em" }}>
            Who's Winning the AI Economy?<br />A CPS Deep Dive.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: "rgba(255,255,255,0.45)", maxWidth: 580, marginBottom: 24 }}>
            Displacement and disruption are the wrong frame. The AI boom is producing a skewed distribution of gains — concentrated in college-educated men in knowledge-economy states, widening fastest in finance.
          </p>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.2)" }}>
            Current Population Survey (CPS) Basic Monthly Files · Jan 2018 – Feb 2026 · 12.7M records · Weighted medians using CPS survey weights
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "48px 28px" }}>

        {/* Key findings */}
        <Section label="Key Findings">
          <Finding stat="+15 pts" text="The college wage premium in top-tier knowledge-economy states surged from ~65% to ~80% between 2018 and 2025. In bottom-tier states, the gain was marginal: 50% to 55%." />
          <Finding stat="$500/wk" text="By 2025, college-educated men outearn college-educated women by nearly $500 per week — a $100/week widening since 2022, equivalent to ~$5,200 in additional annual advantage." />
          <Finding stat="+31%" text="The gender wage gap in Finance/Insurance widened 31% post-2023 — the largest deterioration of any sector, equivalent to an extra $7,800 per year." />
          <Finding stat="−$19/wk" text="Education is the sole exception: the gender gap shrank from $192 to $173/week, insulated by public-sector pay scales and collective bargaining." />
        </Section>

        {/* Intro */}
        <Section label="The Question">
          <P>By now, the narrative is familiar: AI-driven disruption will hollow out white-collar work, displacing knowledge workers as their tasks become automatable. The question worth asking is whether this claim is borne out by the data — and specifically, whether we see a weakening labor market within the knowledge economy.</P>
          <P>To get the full picture, I looked under the hood of the Census data (Current Population Survey) spanning 2018 to early 2026, analyzing over 12 million datapoints. What I found is that displacement and disruption are not the appropriate frame. It is about the skewed distribution of gains and losses. While the benefits of the AI boom are real, they are accumulating disproportionately to specific groups: a college-educated man in a knowledge-economy state.</P>
        </Section>

        {/* Education premium */}
        <Section label="The Education Premium Is Not Gone — But Only in the Right Places">
          <H2>The education premium is not gone — but only in the right places.</H2>
          <P>Unlike the popular narrative, the college wage premium has been rising everywhere. But in top-tier knowledge-economy states it's rising dramatically faster.</P>
          <P>I classified all 50 states (plus D.C.) into two tiers based on their pre-2023 concentration of professional and knowledge-economy occupations. In 2018, college-educated workers in top-tier states earned roughly 65% more than their non-college counterparts. By 2025 that premium had surged to approximately 80%. In bottom-tier states, the premium gain was marginal — from about 50% to 55% over the same period.</P>
          <P>The gap between the two tiers is widening, and the inflection point aligns with the onset of the AI boom post-2022. A college degree has always been valuable. But its value increasingly depends on where you have it.</P>
        </Section>

        {/* Gender gap */}
        <Section label="The Gender Gap Is Reopening">
          <H2>The gender gap is reopening — but only among the educated.</H2>
          <P>A second pattern emerges when we look at gender. Among college-educated workers nationally, the gender wage gap held relatively steady from 2018 through 2022. Then, starting in 2023, the gap breaks upward. By 2025, college-educated men outearn college-educated women by nearly $500 per week — a $100/week widening, or a 25% increase in the gender gap in three years.</P>
          <P>What makes this striking is the comparison to workers without degrees. The gender gap among non-college workers has been flat at roughly $200–250 per week for the entire eight-year period. The post-2023 divergence is happening largely among the educated.</P>
          <P>Which suggests the AI-era economy isn't lifting all boats equally, even among the educated. Whatever is driving wage gains in the post-2023 knowledge economy — whether AI productivity, equity market returns, or both — college-educated men are capturing a disproportionate share.</P>
        </Section>

        {/* Sector dive */}
        <Section label="Where College-Educated Men Are Winning">
          <H2>A sector-level dive.</H2>
          <P>The aggregate picture points to college-educated men in knowledge-economy states. But which industries are driving this? I broke the data into 20 industry sectors and examined wage growth for college-educated males pre- vs. post-2023. Every single sector showed positive growth, although with significant dispersion.</P>
          <P>When I looked at the gender wage gap within sectors, the pattern was sharper than expected — and it wasn't where I expected to find it. I examined four major white-collar sectors where the data is robust enough for stable estimates: Finance/Insurance, Professional/Scientific/Tech, Health/Social, and Education.</P>

          <div style={{ background: C.white, borderRadius: 8, overflow: "hidden", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {[
              { sector: "Finance / Insurance",          change: "+31%", dollars: "+$7,800/yr", note: "Senior compensation structures, performance fees, equity upside", color: "#f97316" },
              { sector: "Health / Social",               change: "+29%", dollars: "+$4,800/yr", note: "Male physicians and administrators pulling away from female-dominated roles", color: "#f97316" },
              { sector: "Professional / Scientific / Tech", change: "+9%",  dollars: "+$2,100/yr", note: "More standardized pay structures limiting divergence", color: "#E8A838" },
              { sector: "Education",                    change: "−10%", dollars: "−$950/yr",  note: "Public-sector pay scales and collective bargaining insulate this sector", color: "#4ade80" },
            ].map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px", gap: 16, alignItems: "center", padding: "14px 20px", borderBottom: i < 3 ? `1px solid ${C.fog}` : "none", background: i % 2 === 0 ? C.white : C.mist }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 3 }}>{r.sector}</div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{r.note}</div>
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: r.color, textAlign: "right" }}>{r.change}</div>
                <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted, textAlign: "right" }}>{r.dollars}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Finance explanation */}
        <Section label="Why Finance?">
          <H2>Why finance, and not tech?</H2>
          <P>It's a counterintuitive finding. The AI boom produced one of the most concentrated equity rallies in recent memory — the S&P 500 roughly doubled between early 2023 and late 2025, driven heavily by AI-adjacent names. The people positioned to capture that are the ones already sitting on capital: portfolio managers, managing directors, partners. The returns flow through performance fees, carried interest, and variable compensation tied directly to market gains — structures that are discretionary, opaque, and historically skewed toward senior men.</P>
          <P>The people who profit most from the AI economy are the ones whose assets it emboldened. And those roles remain overwhelmingly male and senior.</P>
          <P>The Information sector tells a different story, though not necessarily a better one. Engineers, data scientists, and developers are capturing real wage gains, and the gender gap there is messier and less directional than in finance. But the labor market for these roles is intensely competitive and the compensation structures are more standardized, which compresses the kind of runaway senior premiums you see on the finance side. AI is good for tech workers. It just isn't making them rich in the same way.</P>
        </Section>

        {/* Data note */}
        <div style={{ background: C.white, borderRadius: 8, padding: "18px 22px", borderLeft: `3px solid ${C.steel}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: "0.14em", color: C.steel, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Data Note</div>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: C.muted }}>
            Current Population Survey (CPS) Basic Monthly Files, January 2018 – February 2026. 12.7 million individual records. Weighted medians using CPS survey weights. Analysis limited to employed workers ages 22–59 with positive weekly earnings. "Knowledge-economy states" defined as the top 10 states by pre-2023 share of professional occupations. "College-educated" defined as bachelor's degree or higher (PEEDUCA ≥ 43).
          </p>
        </div>

        {/* Back link */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${C.fog}` }}>
          <Link to="/research" style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted, letterSpacing: "0.1em" }}>← ALL RESEARCH</Link>
        </div>

      </div>
    </div>
  );
}
