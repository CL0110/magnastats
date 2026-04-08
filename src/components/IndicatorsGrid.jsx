import React, { useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

/*
 * IndicatorsGrid — presentational card grid for ~30 FRED macro indicators.
 *
 * Props:
 *   indicators: array of objects, one per series:
 *     { series_id, label, unit, display_unit, display_divisor, category,
 *       description, source, good_direction,
 *       latest_value, latest_date, prev_value,
 *       history: [{date, value}, ...],   // last 24 months
 *       mom_change, yoy_change }
 */

const C = {
  navy: "#0D1B2A",
  ink: "#1A2B3C",
  teal: "#2AA89A",
  mist: "#F0F4F8",
  muted: "#6B7F96",
  white: "#FFFFFF",
  green: "#2AA89A",
  red: "#E05252",
};

// ── Helpers ─────────────────────────────────────────────────────

function formatValue(value, displayUnit, displayDivisor) {
  if (value == null) return "—";
  const scaled = value / (displayDivisor || 1);

  const prefix = displayUnit === "$" ? "$" : "";
  const suffix =
    displayUnit === "$" ? ""
    : displayUnit === "%" ? "%"
    : displayUnit ? ` ${displayUnit}`
    : "";

  let formatted;
  if (Math.abs(scaled) >= 100) {
    formatted = scaled.toLocaleString("en-US", { maximumFractionDigits: 0 });
  } else if (Math.abs(scaled) >= 10) {
    formatted = scaled.toLocaleString("en-US", { maximumFractionDigits: 1 });
  } else {
    formatted = scaled.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  return `${prefix}${formatted}${suffix}`;
}

function formatDelta(change) {
  if (change == null) return null;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}`;
}

function deltaColor(change, goodDirection) {
  if (change == null || change === 0) return C.muted;
  const isGood =
    (goodDirection === "up" && change > 0) ||
    (goodDirection === "down" && change < 0);
  return isGood ? C.green : C.red;
}

function sparklineColor(history, goodDirection) {
  if (!history || history.length < 2) return C.teal;
  const recent = history[history.length - 1]?.value;
  const prev = history[history.length - 2]?.value;
  if (recent == null || prev == null) return C.teal;
  const diff = recent - prev;
  const movingWrong =
    (goodDirection === "up" && diff < 0) ||
    (goodDirection === "down" && diff > 0);
  return movingWrong ? C.red : C.teal;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ── Category ordering ───────────────────────────────────────────

const CATEGORY_ORDER = [
  "Labor Market",
  "Growth & Output",
  "Inflation",
  "Credit & Financial Conditions",
  "Leading Indicators",
  "Fiscal",
];

function groupByCategory(indicators) {
  const groups = {};
  for (const ind of indicators) {
    const cat = ind.category || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(ind);
  }
  return CATEGORY_ORDER.filter((c) => groups[c]).map((c) => ({
    category: c,
    items: groups[c],
  }));
}

// ── Inject responsive stylesheet once ───────────────────────────

const STYLE_ID = "indicators-grid-styles";
const GRID_CSS = `
.ind-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
@media (max-width: 1024px) {
  .ind-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .ind-grid { grid-template-columns: repeat(2, 1fr); }
}
.ind-card {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.ind-card:hover {
  box-shadow: 0 6px 20px rgba(13, 27, 42, 0.10);
  transform: translateY(-2px);
}
`;

function useInjectStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = GRID_CSS;
    document.head.appendChild(el);
  }, []);
}

// ── Sparkline ───────────────────────────────────────────────────

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const gradId = `spark-${color.replace("#", "")}`;
  return (
    <div style={{ width: "100%", height: 48, marginTop: "auto" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

export default function IndicatorsGrid({ indicators = [] }) {
  useInjectStyles();

  if (!indicators.length) return null;
  const groups = groupByCategory(indicators);

  return (
    <div style={S.container}>
      {groups.map(({ category, items }) => (
        <React.Fragment key={category}>
          <h3 style={S.categoryHeader}>{category}</h3>
          <div className="ind-grid">
            {items.map((ind) => {
              const sColor = sparklineColor(ind.history, ind.good_direction);
              const delta = formatDelta(ind.mom_change);
              const dColor = deltaColor(ind.mom_change, ind.good_direction);

              return (
                <div key={ind.series_id} className="ind-card" style={S.card}>
                  <span style={S.catLabel}>{ind.category}</span>
                  <span style={S.label}>{ind.label}</span>
                  <span style={S.headline}>
                    {formatValue(ind.latest_value, ind.display_unit, ind.display_divisor)}
                  </span>
                  {delta && (
                    <span style={{ ...S.delta, color: dColor }}>
                      {delta} MoM
                    </span>
                  )}
                  <Sparkline data={ind.history} color={sColor} />
                  <span style={S.dateStamp}>{formatDate(ind.latest_date)}</span>
                </div>
              );
            })}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const S = {
  container: {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 16px",
  },
  categoryHeader: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: C.muted,
    margin: "40px 0 16px",
    paddingBottom: 8,
    borderBottom: `1px solid ${C.mist}`,
  },
  card: {
    background: C.white,
    borderRadius: 8,
    padding: "16px 16px 12px",
    display: "flex",
    flexDirection: "column",
    aspectRatio: "1 / 1",
    border: `1px solid ${C.mist}`,
    cursor: "default",
    position: "relative",
  },
  catLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    fontWeight: 400,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: C.muted,
    lineHeight: 1.2,
  },
  label: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: C.ink,
    marginTop: 4,
    lineHeight: 1.3,
  },
  headline: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 26,
    fontWeight: 700,
    color: C.navy,
    marginTop: 8,
    lineHeight: 1.1,
  },
  delta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    fontWeight: 500,
    marginTop: 4,
  },
  dateStamp: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: C.muted,
    position: "absolute",
    bottom: 10,
    right: 12,
  },
};
