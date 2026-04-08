import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import JoltsExplorer from "./JoltsExplorer.jsx";

const OUTCOMES = {
  lfpr:  { label: "LFPR", calc: (d) => ((d.employed + d.unemployed) / d.pop) * 100 },
  urate: { label: "Unemployment Rate", calc: (d) => (d.unemployed / (d.employed + d.unemployed)) * 100 },
  epop:  { label: "EPOP", calc: (d) => (d.employed / d.pop) * 100 },
};

const DIM_ORDER = ["sex", "age_group", "race_eth", "educ"];

const COLORS = { a: "#2563eb", b: "#16a34a", nat: "#9ca3af" };

function Chip({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 11px", borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
      border: active ? `1.5px solid ${color}` : "1.5px solid #e5e7eb",
      background: active ? color : "#fff",
      color: active ? "#fff" : "#6b7280",
      fontSize: 11, fontFamily: "'DM Sans', sans-serif",
      fontWeight: active ? 600 : 400, transition: "all 0.12s",
    }}>{label}</button>
  );
}

function CutPanel({ cut, onChange, color, label, dims, labelMap }) {
  return (
    <div style={{ border: `2px solid ${color}30`, borderRadius: 7, padding: 14, marginBottom: 10, background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
        <span style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em", color, textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      </div>
      {DIM_ORDER.map((k) => (
        <div key={k} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase", marginBottom: 5 }}>
            {k === "race_eth" ? "Race / Ethnicity" : k === "age_group" ? "Age Band" : k === "educ" ? "Education" : "Sex"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <Chip label="All" active={cut[k] === "All"} color={color} onClick={() => onChange(k, "All")} />
            {dims[k].map((v) => (
              <Chip key={v} label={labelMap[k][v]} active={cut[k] === v} color={color} onClick={() => onChange(k, v)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function filterAndAggregate(data, cut) {
  let filtered = data;
  for (const k of DIM_ORDER) {
    if (cut[k] !== "All") {
      filtered = filtered.filter((d) => d[k] === cut[k]);
    }
  }
  // Sum by date
  const byDate = {};
  for (const row of filtered) {
    if (!byDate[row.date]) {
      byDate[row.date] = { date: row.date, employed: 0, unemployed: 0, nilf: 0, pop: 0 };
    }
    byDate[row.date].employed += row.employed;
    byDate[row.date].unemployed += row.unemployed;
    byDate[row.date].nilf += row.nilf;
    byDate[row.date].pop += row.pop;
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

function computeSeries(agg, outcome) {
  return agg.map((d) => ({
    date: d.date,
    value: d.pop > 0 ? parseFloat(OUTCOMES[outcome].calc(d).toFixed(1)) : null,
  }));
}

function cutLabel(cut, labelMap) {
  const parts = [];
  for (const k of DIM_ORDER) {
    if (cut[k] !== "All") {
      parts.push(labelMap[k][cut[k]]);
    }
  }
  return parts.length > 0 ? parts.join(", ") : "All";
}

function computeTopLines(series, outcome) {
  if (!series.length) return [];
  const valid = series.filter((d) => d.value != null);
  if (valid.length < 2) return [];

  const latest = valid[valid.length - 1];
  const first = valid[0];
  const min = valid.reduce((a, b) => (a.value < b.value ? a : b));
  const max = valid.reduce((a, b) => (a.value > b.value ? a : b));
  const change = (latest.value - first.value).toFixed(1);
  const sign = change >= 0 ? "+" : "";

  return [
    { val: `${sign}${change} pts`, text: `${OUTCOMES[outcome].label} changed ${sign}${change} pts over the period.` },
    { val: `${latest.value}%`, text: `Latest value as of ${latest.date}.` },
    { val: `${min.value}%`, text: `Low point reached ${min.date}.` },
    { val: `${max.value}%`, text: `High point reached ${max.date}.` },
  ];
}

// WORKER_URL — set to your deployed Cloudflare Worker URL
const WORKER_URL = "https://magnastats-query.claire-lee-bolam.workers.dev";

export default function DataExplorer() {
  const [rawData, setRawData] = useState(null);
  const [national, setNational] = useState(null);
  const [dims, setDims] = useState(null);
  const [labelMap, setLabelMap] = useState(null);

  const [activeTab, setActiveTab] = useState("cps");

  const [cutA, setCutA] = useState({ sex: "All", age_group: "All", race_eth: "All", educ: "All" });
  const [cutB, setCutB] = useState({ sex: "All", age_group: "All", race_eth: "All", educ: "All" });
  const [showB, setShowB] = useState(false);
  const [outcome, setOutcome] = useState("lfpr");
  const [collapsed, setCollapsed] = useState(false);
  const [ran, setRan] = useState(false);

  // AI query state
  const [nlQuery, setNlQuery] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [nlDescription, setNlDescription] = useState("");
  const [nlError, setNlError] = useState("");

  // Query results
  const [seriesA, setSeriesA] = useState([]);
  const [seriesB, setSeriesB] = useState([]);
  const [seriesNat, setSeriesNat] = useState([]);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/cps_explorer.json")
      .then((r) => r.json())
      .then((d) => {
        setRawData(d.data);
        setNational(d.national);
        setDims(d.dimensions);
        setLabelMap(d.label_map);
      })
      .catch((err) => console.error("Failed to load CPS data:", err));
  }, []);

  // AI natural language query
  const handleNlQuery = async () => {
    if (!nlQuery.trim() || !rawData) return;
    setNlLoading(true);
    setNlError("");
    setNlDescription("");
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nlQuery.trim() }),
      });
      const parsed = await res.json();
      if (parsed.error) {
        setNlError(parsed.error);
        setNlLoading(false);
        return;
      }

      // Build the cuts from parsed response
      const newOutcome = (parsed.outcome && OUTCOMES[parsed.outcome]) ? parsed.outcome : "lfpr";
      const newCutA = {
        sex: parsed.cutA?.sex || "All",
        age_group: parsed.cutA?.age_group || "All",
        race_eth: parsed.cutA?.race_eth || "All",
        educ: parsed.cutA?.educ || "All",
      };
      const hasCutB = !!parsed.cutB;
      const newCutB = hasCutB ? {
        sex: parsed.cutB.sex || "All",
        age_group: parsed.cutB.age_group || "All",
        race_eth: parsed.cutB.race_eth || "All",
        educ: parsed.cutB.educ || "All",
      } : { sex: "All", age_group: "All", race_eth: "All", educ: "All" };

      // Update UI state
      setOutcome(newOutcome);
      setCutA(newCutA);
      setCutB(newCutB);
      setShowB(hasCutB);
      if (parsed.description) setNlDescription(parsed.description);

      // Run query directly with the parsed values (don't wait for state)
      const aggA = filterAndAggregate(rawData, newCutA);
      setSeriesA(computeSeries(aggA, newOutcome));

      if (hasCutB) {
        const aggB = filterAndAggregate(rawData, newCutB);
        setSeriesB(computeSeries(aggB, newOutcome));
      } else {
        setSeriesB([]);
      }

      const natSeries = national.map((d) => ({
        date: d.date,
        value: d.pop > 0 ? parseFloat(OUTCOMES[newOutcome].calc(d).toFixed(1)) : null,
      }));
      setSeriesNat(natSeries);
      setRan(true);

    } catch (err) {
      setNlError("Failed to reach the query service. Try again.");
    }
    setNlLoading(false);
  };

  const run = () => {
    if (!rawData) return;
    const aggA = filterAndAggregate(rawData, cutA);
    setSeriesA(computeSeries(aggA, outcome));

    if (showB) {
      const aggB = filterAndAggregate(rawData, cutB);
      setSeriesB(computeSeries(aggB, outcome));
    } else {
      setSeriesB([]);
    }

    const natSeries = national.map((d) => ({
      date: d.date,
      value: d.pop > 0 ? parseFloat(OUTCOMES[outcome].calc(d).toFixed(1)) : null,
    }));
    setSeriesNat(natSeries);
    setRan(true);
  };

  // Merge series for chart
  const chartData = useMemo(() => {
    if (!seriesA.length) return [];
    const map = {};
    seriesA.forEach((d) => { map[d.date] = { date: d.date, a: d.value }; });
    seriesB.forEach((d) => { if (map[d.date]) map[d.date].b = d.value; });
    seriesNat.forEach((d) => { if (map[d.date]) map[d.date].nat = d.value; });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [seriesA, seriesB, seriesNat]);

  const topA = useMemo(() => computeTopLines(seriesA, outcome), [seriesA, outcome]);
  const topB = useMemo(() => computeTopLines(seriesB, outcome), [seriesB, outcome]);

  if (!rawData) {
    return (
      <div style={{ background: "#f0f2f5", minHeight: "100vh", color: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
        Loading CPS data…
      </div>
    );
  }

  const labelA = cutLabel(cutA, labelMap);
  const labelB = cutLabel(cutB, labelMap);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f0f2f5", minHeight: "100vh", color: "#1a1a2e" }}>

      {/* Page header */}
      <div style={{ background: "#1a1a2e", padding: "22px 28px 8px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", color: "#E8A838", textTransform: "uppercase", marginBottom: 5 }}>Data Explorer</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
                {activeTab === "cps" ? "CPS Labor Market Data" : "JOLTS — Job Openings & Turnover"}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "4px 0 0", lineHeight: 1.5 }}>
                {activeTab === "cps"
                  ? "Build custom demographic cuts from CPS microdata, 2018–present."
                  : "Explore job openings, hires, quits, and separations by industry, 2000–present."
                }
              </p>
            </div>
            {activeTab === "cps" && ran && (
              <button onClick={() => setCollapsed((p) => !p)} style={{ padding: "7px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 5, color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer" }}>
                {collapsed ? "◀ Show controls" : "▶ Hide controls"}
              </button>
            )}
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0 }}>
            {[
              { key: "cps", label: "CPS Microdata" },
              { key: "jolts", label: "JOLTS" },
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

      {activeTab === "jolts" && <JoltsExplorer />}

      {activeTab === "cps" && <>
      {/* AI Query Bar */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "16px 28px 0" }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 18, opacity: 0.3, flexShrink: 0 }}>&#9889;</div>
          <input
            type="text"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNlQuery()}
            placeholder="Ask in plain English — e.g. &quot;EPOP for Black women vs Hispanic women, ages 25-34&quot;"
            style={{
              flex: 1, border: "none", outline: "none", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", color: "#1a1a2e",
              background: "transparent", padding: "4px 0",
            }}
            disabled={nlLoading}
          />
          <button
            onClick={handleNlQuery}
            disabled={nlLoading || !nlQuery.trim()}
            style={{
              padding: "7px 16px", background: nlLoading ? "#9ca3af" : "#1a1a2e",
              color: "#fff", border: "none", borderRadius: 5,
              fontSize: 11, fontWeight: 600, cursor: nlLoading ? "wait" : "pointer",
              fontFamily: "monospace", letterSpacing: "0.04em", flexShrink: 0,
            }}
          >
            {nlLoading ? "Thinking…" : "Ask"}
          </button>
        </div>
        {nlDescription && (
          <div style={{ fontSize: 12, color: "#4b5563", marginTop: 8, fontStyle: "italic", paddingLeft: 2 }}>
            {nlDescription}
          </div>
        )}
        {nlError && (
          <div style={{ fontSize: 12, color: "#dc2626", marginTop: 8, paddingLeft: 2 }}>
            {nlError}
          </div>
        )}
      </div>

      {/* Main grid */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 28px", display: "grid", gridTemplateColumns: collapsed ? "0px 1fr" : "278px 1fr", gap: collapsed ? 0 : 22 }}>

        {/* Controls */}
        <div style={{ overflow: "hidden", opacity: collapsed ? 0 : 1, transition: "opacity 0.2s" }}>

          {/* Outcome */}
          <div style={{ background: "#fff", borderRadius: 7, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em", color: "#E8A838", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Outcome Variable</div>
            {Object.entries(OUTCOMES).map(([k, v]) => (
              <div key={k} onClick={() => setOutcome(k)} style={{
                padding: "7px 9px", borderRadius: 4, marginBottom: 3, cursor: "pointer",
                background: outcome === k ? "#1a1a2e" : "transparent",
                color: outcome === k ? "#fff" : "#1a1a2e",
                fontSize: 12, fontWeight: outcome === k ? 600 : 400,
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: outcome === k ? "#E8A838" : "#e5e7eb", flexShrink: 0 }} />
                {v.label}
              </div>
            ))}
          </div>

          {/* Cut A */}
          <CutPanel cut={cutA} onChange={(k, v) => setCutA((p) => ({ ...p, [k]: v }))} color={COLORS.a} label="Cut A" dims={dims} labelMap={labelMap} />

          {/* Cut B toggle */}
          <button onClick={() => setShowB((p) => !p)} style={{
            width: "100%", padding: "8px 13px",
            background: showB ? `${COLORS.b}12` : "#fff",
            border: `1.5px dashed ${showB ? COLORS.b : "#e5e7eb"}`,
            borderRadius: 6, color: showB ? COLORS.b : "#9ca3af",
            fontSize: 11, fontWeight: 600, cursor: "pointer", marginBottom: 10,
          }}>
            {showB ? "✕ Remove Cut B" : "+ Add comparison (Cut B)"}
          </button>
          {showB && <CutPanel cut={cutB} onChange={(k, v) => setCutB((p) => ({ ...p, [k]: v }))} color={COLORS.b} label="Cut B" dims={dims} labelMap={labelMap} />}

          {/* Run */}
          <button onClick={run} style={{
            width: "100%", padding: 11, background: "#1a1a2e", color: "#fff",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
            cursor: "pointer", letterSpacing: "0.04em",
          }}>
            Run Query →
          </button>
          <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 5 }}>
            Source: CPS microdata, U.S. Census Bureau · Weighted estimates
          </div>
        </div>

        {/* Output */}
        {ran && (
          <div>
            {/* Active query bar */}
            <div style={{ background: "#1a1a2e", borderRadius: "7px 7px 0 0", padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "#E8A838", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>Active Query</div>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.a }} />{labelA}
                  </span>
                  {showB && seriesB.length > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.b }} />{labelB}
                    </span>
                  )}
                  <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>· {OUTCOMES[outcome].label} · 2018–present</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div style={{ background: "#fff", padding: "18px 16px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12, fontStyle: "italic" }}>
                {OUTCOMES[outcome].label} (%) · Monthly · 2018–present
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 4, right: 14, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#9ca3af", fontFamily: "monospace" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                    interval={11}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af", fontFamily: "monospace" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 11, fontFamily: "monospace", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                    formatter={(v, name) => [`${v}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Line type="monotone" dataKey="a" name={labelA} stroke={COLORS.a} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  {showB && seriesB.length > 0 && (
                    <Line type="monotone" dataKey="b" name={labelB} stroke={COLORS.b} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  )}
                  <Line type="monotone" dataKey="nat" name="National avg." stroke={COLORS.nat} strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top lines */}
            <div style={{ background: "#fff", borderTop: "1px solid #f3f4f6", borderRadius: "0 0 7px 7px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em", color: "#E8A838", textTransform: "uppercase", fontWeight: 600 }}>Summary Statistics</div>
                <div style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }}>Computed from query · weighted estimates</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <TopBlock lines={topA} color={COLORS.a} label={`Cut A: ${labelA}`} />
                {showB && seriesB.length > 0 && (
                  <>
                    <div style={{ width: 1, background: "#f3f4f6" }} />
                    <TopBlock lines={topB} color={COLORS.b} label={`Cut B: ${labelB}`} />
                  </>
                )}
              </div>
              <div style={{ padding: "7px 16px", fontSize: 10, color: "#9ca3af", fontStyle: "italic", borderTop: "1px solid #f3f4f6" }}>
                Derived from Current Population Survey (CPS) microdata. Tabulation by Magnastats.
              </div>
            </div>
          </div>
        )}
      </div>
      </>}
    </div>
  );
}

function TopBlock({ lines, color, label }) {
  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 15px", borderBottom: "1px solid #f3f4f6", background: `${color}08` }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
        <span style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em", color, textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "10px 15px", background: i % 2 === 0 ? "#fafafa" : "#fff", borderLeft: i === 0 ? `3px solid ${color}` : "3px solid transparent" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#1a1a2e", minWidth: 70, lineHeight: 1, paddingTop: 2 }}>{l.val}</div>
          <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6 }}>{l.text}</div>
        </div>
      ))}
    </div>
  );
}
