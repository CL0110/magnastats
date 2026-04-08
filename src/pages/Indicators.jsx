import { useState, useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MacroMetrics from "./MacroMetrics.jsx";

const CAT_COLORS = {
  "Labor Market": "#2563eb",
  "Growth & Output": "#16a34a",
  "Inflation": "#ea580c",
  "Credit & Financial Conditions": "#7c3aed",
  "Leading Indicators": "#ca8a04",
  "Fiscal": "#6b7280",
};

function ChangeTag({ value, goodDirection }) {
  if (value == null) return null;
  const isGood =
    goodDirection === "up" ? value > 0 :
    goodDirection === "down" ? value < 0 : false;
  const isBad =
    goodDirection === "up" ? value < 0 :
    goodDirection === "down" ? value > 0 : false;
  const color = isGood ? "#16a34a" : isBad ? "#dc2626" : "#9ca3af";
  const sign = value > 0 ? "+" : "";
  return (
    <span style={{
      fontSize: 12, fontFamily: "monospace", fontWeight: 600,
      color, padding: "2px 6px", borderRadius: 3,
      background: `${color}10`,
    }}>
      {sign}{value}
    </span>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, fontSize: 11, fontFamily: "monospace", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}
          labelStyle={{ color: "#6b7280" }}
          formatter={(v) => [v, ""]}
        />
        <XAxis dataKey="date" hide />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace("#","")})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function IndicatorCard({ ind, catColor }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 8, padding: "20px 22px",
      borderTop: `3px solid ${catColor}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>{ind.label}</div>
          <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>{ind.source}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: catColor, fontFamily: "'Playfair Display', serif" }}>
            {ind.unit === "$" ? "$" : ""}{ind.latest_value}{ind.unit === "%" ? "%" : ind.unit === "M" ? "M" : ind.unit === "B" ? "B" : ind.unit === "T" ? "T" : ind.unit === "K" ? "K" : ""}
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>{ind.latest_date}</div>
        </div>
      </div>

      {/* Sparkline */}
      <Sparkline data={ind.history} color={catColor} />

      {/* Changes */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 2 }}>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>MoM</div>
        <ChangeTag value={ind.mom_change} goodDirection={ind.good_direction} />
        <div style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>YoY</div>
        <ChangeTag value={ind.yoy_change} goodDirection={ind.good_direction} />
      </div>

      {/* Description */}
      <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5, marginTop: 2 }}>{ind.description}</div>
    </div>
  );
}

export default function Indicators() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("indicators");

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/fred_indicators.json")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Failed to load indicators:", err));
  }, []);

  if (!data) {
    return (
      <div style={{ background: "#f0f2f5", minHeight: "100vh", color: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 15 }}>
        Loading indicators…
      </div>
    );
  }

  const categoryOrder = [
    "Labor Market", "Growth & Output", "Inflation",
    "Credit & Financial Conditions", "Leading Indicators", "Fiscal",
  ];

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", color: "#1a1a2e" }}>

      {/* Header with tabs */}
      <div style={{ background: "#1a1a2e", padding: "28px 28px 8px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontFamily: "monospace", letterSpacing: "0.12em", color: "#E8A838", textTransform: "uppercase", marginBottom: 8 }}>
            Macro Dashboard · Updated {data.generated}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
            {activeTab === "indicators" ? "Macro Indicators" : "Regime Classification"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 16px", lineHeight: 1.5 }}>
            {activeTab === "indicators"
              ? `${data.indicators.length} indicators across ${categoryOrder.length} categories, sourced from FRED.`
              : "6-state HMM trained on FRED + CPS education-based distributional spreads."
            }
          </p>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0 }}>
            {[
              { key: "indicators", label: "Indicators" },
              { key: "regimes", label: "Regime Classification" },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: "10px 20px", cursor: "pointer",
                background: activeTab === tab.key ? "#f0f2f5" : "transparent",
                color: activeTab === tab.key ? "#1a1a2e" : "rgba(255,255,255,0.4)",
                border: "none",
                borderRadius: "6px 6px 0 0",
                fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 400,
                fontFamily: "monospace", letterSpacing: "0.04em",
                transition: "all 0.15s",
              }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Regime Classification tab */}
      {activeTab === "regimes" && <MacroMetrics />}

      {/* Indicators tab */}
      {activeTab === "indicators" && <>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 28px" }}>
        {categoryOrder.map((cat) => {
          const indicators = data.categories[cat];
          if (!indicators || indicators.length === 0) return null;
          const catColor = CAT_COLORS[cat] || "#6b7280";
          return (
            <div key={cat} style={{ marginBottom: 40 }}>
              <div style={{
                fontSize: 13, fontFamily: "monospace", letterSpacing: "0.12em",
                color: catColor, textTransform: "uppercase", fontWeight: 700,
                marginBottom: 16, paddingBottom: 8,
                borderBottom: `2px solid ${catColor}22`,
              }}>
                {cat}
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}>
                {indicators.map((ind) => (
                  <IndicatorCard key={ind.series_id} ind={ind} catColor={catColor} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      </>}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "20px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
            Data sourced from FRED (Federal Reserve Economic Data) · Updated monthly
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
            Generated {data.generated}
          </span>
        </div>
      </div>
    </div>
  );
}
