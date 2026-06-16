import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

const POSTS = [
  {
    id: "wage-growth-by-industry",
    title: "Who's Getting Raises? Wage Growth by Industry, Gender, and Education",
    image: "wage_change_by_industry_all_groups.png",
    category: "Wages",
    date: "April 2026",
    summary: "Information sector leads with 38% wage growth for college-educated men. Non-college women in retail saw barely 15%.",
    stats: [
      { val: "38%", desc: "Top wage growth (Male, College+, Information)" },
      { val: "15%", desc: "Bottom wage growth (Female, No College, Retail)" },
    ],
  },
  {
    id: "gender-wage-gap",
    title: "The Gender Wage Gap Is Widening in Tech-Hub States",
    image: "gender_gap_trend.png",
    category: "Gender",
    date: "April 2026",
    summary: "Among college-educated workers, the gender wage gap in top-10 tech states has diverged sharply from bottom-10 states since 2022.",
    stats: [
      { val: "$425/wk", desc: "Gap in top tech states (2025)" },
      { val: "$275/wk", desc: "Gap in bottom-10 states (2025)" },
    ],
  },
  {
    id: "employment-by-collar",
    title: "White Collar vs Blue Collar: Employment Rates by Age Group",
    image: "emp_trend_by_age_collar.png",
    category: "Employment",
    date: "April 2026",
    summary: "College-educated workers recovered to pre-COVID employment rates by 2021. Non-college workers in the 22-29 cohort still haven't fully returned.",
    stats: [
      { val: "90%", desc: "White collar employment rate (30-39, 2025)" },
      { val: "70%", desc: "Blue collar employment rate (22-29, 2025)" },
    ],
  },
  { id: "lfp-by-gender",       title: "Labor Force Participation by Gender",                    image: "lfp_by_gender.png",                   category: "Labor Force", date: "April 2026", summary: "Male and female labor force participation trends since 2018.", stats: [] },
  { id: "lfp-by-gender-educ",  title: "Labor Force Participation by Gender and Education",       image: "lfp_by_gender_educ.png",              category: "Labor Force", date: "April 2026", summary: "Education is the strongest predictor of labor force participation — and the gap is wider for women.", stats: [] },
  { id: "education-gap",       title: "The College Premium in Dollars",                          image: "education_gap_dollar.png",            category: "Wages",      date: "April 2026", summary: "The dollar gap between college and non-college weekly earnings over time.", stats: [] },
  { id: "gender-gap-by-sector",title: "Where the Gender Pay Gap Is Widest",                     image: "gender_gap_by_sector.png",            category: "Gender",     date: "April 2026", summary: "Finance and information sectors show the largest gender wage gaps — and they're growing.", stats: [] },
  { id: "wages-by-gender-educ",title: "Weekly Earnings by Gender and Education",                 image: "wages_by_gender_educ.png",            category: "Wages",      date: "April 2026", summary: "Wage trajectories diverge sharply by education, with the gender gap widening at higher education levels.", stats: [] },
  { id: "emp-trend-by-group",  title: "Employment Trends by Demographic Group",                  image: "emp_trend_by_group.png",              category: "Employment", date: "April 2026", summary: "How different demographic groups have fared in the labor market since 2018.", stats: [] },
  { id: "wage-change-by-state",title: "Which States Saw the Biggest Wage Gains?",               image: "wage_change_by_state.png",            category: "Wages",      date: "April 2026", summary: "State-level wage growth shows a stark geographic pattern correlated with knowledge-economy concentration.", stats: [] },
  { id: "gender-gap-finance-info", title: "Gender Gap in Finance and Tech by Age",              image: "gender_gap_finance_info_by_age.png",  category: "Gender",     date: "April 2026", summary: "The gender wage gap in finance and information sectors broken down by age cohort.", stats: [] },
  { id: "wages-top-bottom-tech",   title: "Wages: Top vs Bottom Tech States",                   image: "wages_top_vs_bottom_tech.png",        category: "Wages",      date: "April 2026", summary: "How wages compare between the top-10 and bottom-10 tech-hub states.", stats: [] },
  { id: "education-gap-trend",     title: "The Education Wage Premium Over Time",               image: "education_gap_trend.png",             category: "Wages",      date: "April 2026", summary: "Tracking the college wage premium from 2018 to present.", stats: [] },
  { id: "gender-gap-by-educ",      title: "Gender Wage Gap by Education Level",                 image: "gender_gap_by_educ.png",              category: "Gender",     date: "April 2026", summary: "Higher education doesn't close the gender gap — it widens it.", stats: [] },
  { id: "wage-levels-by-industry", title: "Wage Levels by Industry",                            image: "wage_levels_by_industry.png",         category: "Wages",      date: "April 2026", summary: "Where the highest and lowest paying industries stand in 2025.", stats: [] },
  { id: "gender-gap-4sectors",     title: "Gender Gap in 4 Sectors: Pre vs Post-2023",          image: "gender_gap_4sectors_pre_post.png",    category: "Gender",     date: "April 2026", summary: "How the gender wage gap shifted in four key sectors before and after 2023.", stats: [] },
];

const CATEGORIES = ["All", ...new Set(POSTS.map(p => p.category))];

const CAT_COLORS = {
  Wages:        "#2563eb",
  Gender:       "#be185d",
  Employment:   "#16a34a",
  "Labor Force":"#ca8a04",
};

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

export default function Insights() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedPost = searchParams.get("post");
  const filtered = activeCategory === "All" ? POSTS : POSTS.filter(p => p.category === activeCategory);

  // ── Detail view ──────────────────────────────────────────────────
  if (selectedPost) {
    const post = POSTS.find(p => p.id === selectedPost);
    if (!post) return null;
    const catColor = CAT_COLORS[post.category] || "#6b7280";
    return (
      <div style={{ background: "#f0f2f5", minHeight: "100vh" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 28px" }}>
          <button onClick={() => navigate("/insights")} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#1a1a2e", border: "none", cursor: "pointer",
            fontSize: 13, fontFamily: "monospace", color: "#fff",
            marginBottom: 24, padding: "8px 16px", borderRadius: 5, fontWeight: 600,
          }}>
            ← Back to Insights
          </button>
          <div style={{ fontSize: 12, fontFamily: "monospace", color: catColor, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
            {post.category} · {post.date}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#1a1a2e", marginBottom: 16, lineHeight: 1.2 }}>
            {post.title}
          </h1>
          <p style={{ fontSize: 16, color: "#4b5563", lineHeight: 1.75, marginBottom: 24 }}>
            {post.summary}
          </p>
          {post.stats.length > 0 && (
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              {post.stats.map((s, i) => (
                <div key={i} style={{
                  background: "#fff", borderRadius: 8, padding: "16px 20px",
                  borderLeft: `4px solid ${catColor}`, flex: "1 1 200px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: catColor, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>{s.val}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{s.desc}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <img
              src={`${import.meta.env.BASE_URL}images/insights/${post.image}`}
              alt={post.title}
              style={{ width: "100%", borderRadius: 4 }}
            />
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", marginTop: 12 }}>
            Source: CPS microdata · Magnastats
          </div>
        </div>
      </div>
    );
  }

  // ── Newspaper grid view ──────────────────────────────────────────
  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", display: "flex" }}>

      {/* LEFT: visual chart cards */}
      <div style={{ flex: "0 0 62%", minWidth: 0 }}>

        {/* Header */}
        <div style={{ background: "#1a1a2e", padding: "28px 28px 22px" }}>
          <div style={{ fontSize: 13, fontFamily: "monospace", letterSpacing: "0.12em", color: "#C5A044", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
            Insights
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
            Data Visuals
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Chart-forward analysis from CPS microdata. One finding, one visual, one takeaway.
          </p>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Category filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: "6px 14px", borderRadius: 5, cursor: "pointer",
                background: activeCategory === cat ? "#1a1a2e" : "#fff",
                color: activeCategory === cat ? "#fff" : "#6b7280",
                border: activeCategory === cat ? "none" : "1px solid #e5e7eb",
                fontSize: 12, fontWeight: activeCategory === cat ? 600 : 400,
                fontFamily: "monospace", transition: "all 0.15s",
              }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Card grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map(post => {
              const catColor = CAT_COLORS[post.category] || "#6b7280";
              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/insights?post=${post.id}`)}
                  style={{
                    background: "#fff", borderRadius: 8, overflow: "hidden",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
                >
                  <div style={{ width: "100%", height: 180, overflow: "hidden", background: "#f8f9fa" }}>
                    <img
                      src={`${import.meta.env.BASE_URL}images/insights/${post.image}`}
                      alt={post.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
                      <span style={{
                        fontSize: 10, fontFamily: "monospace", fontWeight: 600,
                        color: catColor, letterSpacing: "0.08em", textTransform: "uppercase",
                        background: `${catColor}10`, padding: "2px 8px", borderRadius: 3,
                      }}>
                        {post.category}
                      </span>
                      <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>{post.date}</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.35, margin: "0 0 6px" }}>
                      {post.title}
                    </h3>
                    <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
                      {post.summary}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, background: "#d1d5db", flexShrink: 0 }} />

      {/* RIGHT: Analysis / Research */}
      <div style={{ flex: "0 0 38%", minWidth: 0, background: "#f8f9fa", padding: "28px 24px", overflowY: "auto" }}>
        <div style={{ fontSize: 13, fontFamily: "monospace", letterSpacing: "0.12em", color: "#C5A044", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>
          Analysis
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px" }}>
          Research
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 28 }}>
          Original analytical pieces built on public microdata. Each has a question, a finding, and an argument.
        </p>

        {/* Published */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.16em", color: "#9ca3af", textTransform: "uppercase", marginBottom: 14 }}>Published</div>
          {PAPERS.map(p => (
            <Link
              key={p.slug}
              to={`/research/${p.slug}`}
              style={{
                display: "block", background: "#fff", borderRadius: 8,
                padding: "20px 20px", marginBottom: 12,
                borderLeft: "4px solid #C5A044",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.12em", color: "#C5A044", textTransform: "uppercase", fontWeight: 600 }}>{p.tag}</span>
                <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>· {p.date}</span>
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#1a1a2e", marginBottom: 8, lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ fontSize: 12, lineHeight: 1.7, color: "#6b7280", marginBottom: 12 }}>{p.summary}</div>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "#9ca3af" }}>{p.dataNote}</div>
            </Link>
          ))}
        </div>

        {/* In Progress */}
        <div>
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.16em", color: "#9ca3af", textTransform: "uppercase", marginBottom: 14 }}>In Progress</div>
          <div style={{ background: "#fff", borderRadius: 8, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {COMING.map((title, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 0",
                borderBottom: i < COMING.length - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <span style={{ fontSize: 9, fontFamily: "monospace", color: "#9ca3af", background: "#f3f4f6", padding: "2px 6px", borderRadius: 3, marginTop: 2, flexShrink: 0 }}>SOON</span>
                <span style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>{title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
