import { useState, useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

function downloadCSV(ind) {
  const header = "date,value\n";
  const rows = ind.history
    .filter((d) => d.value != null)
    .map((d) => `${d.date},${d.value}`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ind.series_id}_${ind.label.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

      {/* Changes + Download */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>MoM</div>
          <ChangeTag value={ind.mom_change} goodDirection={ind.good_direction} />
          <div style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>YoY</div>
          <ChangeTag value={ind.yoy_change} goodDirection={ind.good_direction} />
        </div>
        <button
          onClick={() => downloadCSV(ind)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 11, fontFamily: "monospace", color: catColor,
            opacity: 0.6, padding: "2px 4px",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
          title="Download CSV"
        >
          ↓ CSV
        </button>
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
    "Monetary Policy", "Credit & Financial Conditions",
    "Leading Indicators", "High-Frequency", "Fiscal",
  ];

  const TABS = [
    { key: "indicators", label: "Macro Indicators", icon: "◈", desc: "FRED series dashboard" },
    { key: "regimes", label: "Regime Classification", icon: "◉", desc: "6-state HMM" },
  ];

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", color: "#1a1a2e", display: "flex" }}>

      {/* Left sidebar nav */}
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
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 20px", cursor: "pointer",
              background: active ? "rgba(255,255,255,0.08)" : "transparent",
              borderLeft: active ? "3px solid #C5A044" : "3px solid transparent",
              border: "none", borderLeft: active ? "3px solid #C5A044" : "3px solid transparent",
              color: active ? "#fff" : "rgba(255,255,255,0.8)",
              textAlign: "left", width: "100%",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 18, opacity: active ? 1 : 0.6 }}>{tab.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: active ? 700 : 500, fontFamily: "monospace" }}>{tab.label}</div>
                <div style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.45)", fontFamily: "monospace", marginTop: 2 }}>{tab.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Regime Classification */}
        {activeTab === "regimes" && <MacroMetrics />}

        {/* Indicators */}
        {activeTab === "indicators" && (
          <div style={{ maxWidth: 1200, padding: "32px 28px" }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px" }}>
              Macro Indicators
            </h1>
            <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 32px", lineHeight: 1.5 }}>
              {data.indicators.length} indicators across {categoryOrder.length} categories, sourced from FRED.
            </p>
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
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", padding: "20px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
              Data sourced from FRED · Updated monthly
            </span>
            <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
              Generated {data.generated}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
