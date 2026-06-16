import { useState, useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import MacroMetrics from "./MacroMetrics.jsx";

const CAT_COLORS = {
  "Labor Market": "#2563eb",
  "Growth & Output": "#16a34a",
  "Inflation": "#ea580c",
  "Credit & Financial Conditions": "#7c3aed",
  "Monetary Policy": "#0891b2",
  "Leading Indicators": "#ca8a04",
  "High-Frequency": "#be185d",
  "Fiscal": "#6b7280",
};

const LAY_DESCRIPTIONS = {
  JTSJOL:          "How many jobs employers are actively trying to fill — a real-time gauge of labor demand.",
  PAYEMS:          "Total number of paid workers in the U.S. economy, excluding farm workers.",
  UNRATE:          "Share of people who are actively looking for work but haven't found a job yet.",
  U6RATE:          "A broader jobless measure — counts people who gave up searching plus part-timers who want full-time work.",
  EMRATIO:         "Share of all working-age adults who actually have a job — strips out people who've stopped looking.",
  CIVPART:         "Share of adults who are either working or actively job-hunting. A drop often signals discouraged workers.",
  CES0500000003:   "Average hourly pay for private-sector workers — a key gauge of living standards and wage inflation.",
  JTSQUR:          "How often workers voluntarily quit. High quits signal confidence: people only leave if they expect to find better.",
  A191RL1Q225SBEA: "How fast the total value of goods and services is growing after stripping out inflation.",
  INDPRO:          "How much factories, mines, and utilities are producing relative to a 2017 baseline.",
  RSAFS:           "Total spending at retail stores and restaurants — the most direct read on consumer demand.",
  HOUST:           "Number of new homes that broke ground — a leading indicator for housing supply and construction jobs.",
  PERMIT:          "Government approvals for new construction — a forward-looking signal for housing starts.",
  CPIAUCSL:        "How much prices have risen over the past year across everyday goods and services. The headline inflation number.",
  CPILFESL:        "Inflation excluding volatile food and energy prices — the Fed's preferred short-run price gauge.",
  PCEPI:           "The Fed's broader inflation yardstick, covering more spending categories than CPI.",
  PCEPILFE:        "Core inflation by the Fed's preferred measure — the most important number for rate decisions.",
  PPIACO:          "What producers pay for raw materials. Often a leading signal: today's input costs become tomorrow's consumer prices.",
  DGS10:           "The interest rate on 10-year U.S. government debt — a benchmark for mortgages and corporate borrowing.",
  DGS2:            "The interest rate on 2-year U.S. government debt — closely tracks Fed policy expectations.",
  T10Y2Y:          "The gap between 10- and 2-year Treasury yields. When negative (inverted), it has historically predicted recessions.",
  DRTSCILM:        "How many banks are tightening credit to businesses. Tight standards slow investment and hiring.",
  DRTSSP:          "How many banks are tightening credit to consumers — signals risk appetite and future spending capacity.",
  BAMLH0A0HYM2:    "Extra yield investors demand for holding riskier corporate bonds. Wide spreads signal financial stress.",
  UMCSENT:         "How confident households feel about their finances and the economy's direction — a bellwether for spending.",
  NAPM:            "A monthly survey of manufacturing purchasing managers. Above 50 signals expansion; below 50 signals contraction.",
  NAPMNOI:         "New orders placed with manufacturers — a forward-looking signal for factory activity.",
  USSLIND:         "A composite of 10 forward-looking indicators designed to signal economic turning points 3–6 months ahead.",
  FEDFUNDS:        "The overnight rate set by the Federal Reserve — the anchor for all other borrowing costs in the economy.",
  T10YIE:          "What bond markets expect average inflation to be over the next 10 years — a key Fed credibility gauge.",
  MORTGAGE30US:    "The average rate on a 30-year home loan. Directly determines monthly payment size and housing affordability.",
  ICSA:            "New unemployment insurance filings each week — the most real-time signal of layoffs in the economy.",
  CCSA:            "Total people currently collecting unemployment benefits — reflects how long joblessness lasts after a layoff.",
  DCOILWTICO:      "The price of a barrel of U.S. benchmark crude oil — a key input cost that ripples through transportation and goods prices.",
  VIXCLS:          "The market's expectation of stock volatility over the next 30 days. Spikes during crises; low values signal calm.",
  MTSDS133FMS:     "Monthly federal budget position. A deficit means the government spent more than it collected in taxes.",
  GFDEBTN:         "The total amount the U.S. federal government owes — the cumulative sum of all past deficits.",
};

function fmtTick(d) {
  if (!d) return "";
  const parts = d.split("-");
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(parts[1], 10) - 1];
  return mo ? `${mo} '${parts[0].slice(2)}` : d;
}

function ChangeTag({ value, goodDirection }) {
  if (value == null) return null;
  const isGood = goodDirection === "up" ? value > 0 : goodDirection === "down" ? value < 0 : false;
  const isBad  = goodDirection === "up" ? value < 0 : goodDirection === "down" ? value > 0 : false;
  const color  = isGood ? "#16a34a" : isBad ? "#dc2626" : "#9ca3af";
  const sign   = value > 0 ? "+" : "";
  return (
    <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color, padding: "2px 6px", borderRadius: 3, background: `${color}10` }}>
      {sign}{value}
    </span>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const vals = data.filter(d => d.value != null).map(d => d.value);
  const avg  = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  const n    = data.length;
  const t0   = data[0]?.date;
  const tMid = data[Math.floor(n / 2)]?.date;
  const tEnd = data[n - 1]?.date;
  const id   = `spark-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={84}>
      <AreaChart data={data} margin={{ top: 4, right: 48, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          ticks={[t0, tMid, tEnd]}
          tickFormatter={fmtTick}
          tick={{ fontSize: 9, fontFamily: "monospace", fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          height={18}
          interval="preserveStartEnd"
        />
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, fontSize: 11, fontFamily: "monospace", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}
          labelStyle={{ color: "#6b7280" }}
          formatter={(v) => [v, ""]}
        />
        <ReferenceLine
          y={avg}
          stroke={color}
          strokeDasharray="3 3"
          strokeOpacity={0.45}
          label={{ value: `avg ${avg}`, position: "right", fontSize: 9, fill: color, opacity: 0.7, fontFamily: "monospace" }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function downloadCSV(ind) {
  const header = "date,value\n";
  const rows = ind.history
    .filter(d => d.value != null)
    .map(d => `${d.date},${d.value}`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `${ind.series_id}_${ind.label.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function IndicatorCard({ ind, catColor }) {
  const lay = LAY_DESCRIPTIONS[ind.series_id];
  const unitSuffix = ind.unit === "%" ? "%" : ind.unit === "M" ? "M" : ind.unit === "B" ? "B" : ind.unit === "T" ? "T" : ind.unit === "K" ? "K" : "";
  return (
    <div style={{
      background: "#fff", borderRadius: 8, padding: "18px 20px",
      borderTop: `3px solid ${catColor}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>{ind.label}</div>
          <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>{ind.source}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: catColor, fontFamily: "'Playfair Display', serif" }}>
            {ind.unit === "$" ? "$" : ""}{ind.latest_value}{unitSuffix}
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>{ind.latest_date}</div>
        </div>
      </div>

      {/* Lay description */}
      {lay && (
        <div style={{
          fontSize: 12, color: "#374151", lineHeight: 1.6,
          padding: "7px 10px",
          background: catColor + "0d",
          borderLeft: `2px solid ${catColor}60`,
          borderRadius: "0 4px 4px 0",
        }}>
          {lay}
        </div>
      )}

      {/* Sparkline */}
      <Sparkline data={ind.history} color={catColor} />

      {/* Changes + Download */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>MoM</span>
          <ChangeTag value={ind.mom_change} goodDirection={ind.good_direction} />
          <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>YoY</span>
          <ChangeTag value={ind.yoy_change} goodDirection={ind.good_direction} />
        </div>
        <button
          onClick={() => downloadCSV(ind)}
          style={{
            background: catColor + "15",
            border: `1px solid ${catColor}40`,
            cursor: "pointer",
            fontSize: 11, fontFamily: "monospace",
            color: catColor, fontWeight: 700,
            padding: "4px 10px", borderRadius: 4,
            letterSpacing: "0.04em",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = catColor + "28"; }}
          onMouseLeave={e => { e.currentTarget.style.background = catColor + "15"; }}
          title="Download CSV"
        >
          ↓ CSV
        </button>
      </div>

      {/* Technical description */}
      <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5, marginTop: 0 }}>{ind.description}</div>
    </div>
  );
}

function CategoryBlock({ cat, indicators, catColor, minCard = 260 }) {
  if (!indicators?.length) return null;
  return (
    <div>
      <div style={{
        fontSize: 12, fontFamily: "monospace", letterSpacing: "0.12em",
        color: catColor, textTransform: "uppercase", fontWeight: 700,
        marginBottom: 14, paddingBottom: 8,
        borderBottom: `2px solid ${catColor}22`,
      }}>
        {cat}
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCard}px, 1fr))`,
        gap: 14,
      }}>
        {indicators.map(ind => (
          <IndicatorCard key={ind.series_id} ind={ind} catColor={catColor} />
        ))}
      </div>
    </div>
  );
}

export default function Indicators() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("indicators");

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/fred_indicators.json")
      .then(r => r.json())
      .then(setData)
      .catch(err => console.error("Failed to load indicators:", err));
  }, []);

  if (!data) {
    return (
      <div style={{ background: "#f0f2f5", minHeight: "100vh", color: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 15 }}>
        Loading indicators…
      </div>
    );
  }

  const remainingCats = [
    "Growth & Output", "Monetary Policy", "Credit & Financial Conditions",
    "Leading Indicators", "High-Frequency", "Fiscal",
  ];

  const TABS = [
    { key: "indicators", label: "Macro Indicators",      icon: "◈", desc: "FRED series dashboard" },
    { key: "regimes",    label: "Regime Classification", icon: "◉", desc: "6-state HMM" },
  ];

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", color: "#1a1a2e", display: "flex" }}>

      {/* Left sidebar */}
      <div style={{
        width: 220, flexShrink: 0, background: "#1a1a2e",
        padding: "24px 0", display: "flex", flexDirection: "column",
        position: "sticky", top: 52, height: "calc(100vh - 52px)", overflowY: "auto",
      }}>
        <div style={{ padding: "0 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontFamily: "monospace", letterSpacing: "0.12em", color: "#C5A044", textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>
            Indicators
          </div>
          <div style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>
            Updated {data.generated}
          </div>
        </div>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 20px", cursor: "pointer",
              background: active ? "rgba(255,255,255,0.08)" : "transparent",
              borderLeft: active ? "3px solid #C5A044" : "3px solid transparent",
              border: "none", color: active ? "#fff" : "rgba(255,255,255,0.8)",
              textAlign: "left", width: "100%", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 18, opacity: active ? 1 : 0.6 }}>{tab.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: active ? 700 : 500, fontFamily: "monospace" }}>{tab.label}</div>
                <div style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.45)", fontFamily: "monospace", marginTop: 2 }}>{tab.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {activeTab === "regimes" && <MacroMetrics />}

        {activeTab === "indicators" && (
          <div style={{ padding: "32px 28px" }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#1a1a2e", margin: "0 0 6px" }}>
              Macro Indicators
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 32px", lineHeight: 1.5 }}>
              {data.indicators.length} indicators across 8 categories, sourced from FRED.
            </p>

            {/* TOP ROW: Labor Market (left) + Inflation (right) */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 28,
              marginBottom: 40,
            }}>
              <CategoryBlock
                cat="Labor Market"
                indicators={data.categories["Labor Market"]}
                catColor={CAT_COLORS["Labor Market"]}
                minCard={220}
              />
              <CategoryBlock
                cat="Inflation"
                indicators={data.categories["Inflation"]}
                catColor={CAT_COLORS["Inflation"]}
                minCard={220}
              />
            </div>

            {/* Remaining categories */}
            {remainingCats.map(cat => (
              <div key={cat} style={{ marginBottom: 40 }}>
                <CategoryBlock
                  cat={cat}
                  indicators={data.categories[cat]}
                  catColor={CAT_COLORS[cat] || "#6b7280"}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", padding: "20px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>Data sourced from FRED · Updated monthly</span>
            <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>Generated {data.generated}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
