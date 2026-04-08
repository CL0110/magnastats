import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DATA_ELEMENTS = {
  JO: { label: "Job Openings", color: "#2563eb" },
  HI: { label: "Hires", color: "#16a34a" },
  QU: { label: "Quits", color: "#ca8a04" },
  TS: { label: "Total Separations", color: "#dc2626" },
};

const RATE_LEVEL = {
  R: { label: "Rate (%)", suffix: "%" },
  L: { label: "Level (thousands)", suffix: "K" },
};

const COLORS_POOL = ["#2563eb", "#16a34a", "#ca8a04", "#dc2626", "#7c3aed", "#ea580c", "#0891b2", "#be185d"];

function Chip({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
      border: active ? `1.5px solid ${color}` : "1.5px solid #e5e7eb",
      background: active ? color : "#fff",
      color: active ? "#fff" : "#6b7280",
      fontSize: 12, fontWeight: active ? 600 : 400, transition: "all 0.12s",
    }}>{label}</button>
  );
}

function filterData(data, filters) {
  return data.filter((d) => {
    if (filters.dataelement !== "All" && d.de !== filters.dataelement) return false;
    if (filters.industry !== "All" && String(d.ind) !== filters.industry) return false;
    if (filters.sizeclass !== "All" && String(d.sc) !== filters.sizeclass) return false;
    if (d.rl !== filters.rateLevel) return false;
    return true;
  });
}

function computeTopLines(series, suffix) {
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
    { val: `${sign}${change}`, text: `Change over period (${first.date} to ${latest.date}).` },
    { val: `${latest.value}${suffix}`, text: `Latest value as of ${latest.date}.` },
    { val: `${min.value}${suffix}`, text: `Low point reached ${min.date}.` },
    { val: `${max.value}${suffix}`, text: `High point reached ${max.date}.` },
  ];
}

export default function JoltsExplorer() {
  const [rawData, setRawData] = useState(null);
  const [national, setNational] = useState(null);
  const [dims, setDims] = useState(null);
  const [labelMap, setLabelMap] = useState(null);

  const [dataelement, setDataelement] = useState("JO");
  const [industry, setIndustry] = useState("All");
  const [sizeclass, setSizeclass] = useState("All");
  const [rateLevel, setRateLevel] = useState("R");
  const [compareMode, setCompareMode] = useState("none"); // none, industry, dataelement
  const [compareValues, setCompareValues] = useState([]);
  const [ran, setRan] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Results
  const [series, setSeries] = useState([]);
  const [seriesNat, setSeriesNat] = useState([]);
  const [compSeries, setCompSeries] = useState({});

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/jolts_explorer.json")
      .then((r) => r.json())
      .then((d) => {
        setRawData(d.data);
        setNational(d.national);
        setDims(d.dimensions);
        setLabelMap(d.label_map);
      })
      .catch((err) => console.error("Failed to load JOLTS data:", err));
  }, []);

  const run = () => {
    if (!rawData) return;
    const suffix = RATE_LEVEL[rateLevel].suffix;

    if (compareMode === "industry" && compareValues.length > 0) {
      // Compare multiple industries for one data element
      const result = {};
      compareValues.forEach((ind) => {
        const filtered = filterData(rawData, { dataelement, industry: ind, sizeclass, rateLevel });
        const byDate = {};
        filtered.forEach((d) => { byDate[d.date] = d.v; });
        result[ind] = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, value: v }));
      });
      setCompSeries(result);
      setSeries([]);
    } else if (compareMode === "dataelement" && compareValues.length > 0) {
      // Compare multiple data elements for one industry
      const result = {};
      compareValues.forEach((de) => {
        const filtered = filterData(rawData, { dataelement: de, industry, sizeclass, rateLevel });
        const byDate = {};
        filtered.forEach((d) => { byDate[d.date] = d.v; });
        result[de] = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, value: v }));
      });
      setCompSeries(result);
      setSeries([]);
    } else {
      // Single series
      const filtered = filterData(rawData, { dataelement, industry, sizeclass, rateLevel });
      const byDate = {};
      filtered.forEach((d) => {
        if (!byDate[d.date]) byDate[d.date] = 0;
        byDate[d.date] = d.v;
      });
      const s = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, value: v }));
      setSeries(s);
      setCompSeries({});
    }

    // National reference (total nonfarm, rate)
    if (rateLevel === "R") {
      const natFiltered = national.filter((d) => d.de === dataelement);
      const natByDate = {};
      natFiltered.forEach((d) => { natByDate[d.date] = d.v; });
      setSeriesNat(Object.entries(natByDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, value: v })));
    } else {
      setSeriesNat([]);
    }
    setRan(true);
  };

  // Build chart data
  const chartData = useMemo(() => {
    const keys = Object.keys(compSeries);
    if (keys.length > 0) {
      // Multi-line comparison
      const dateMap = {};
      keys.forEach((key) => {
        compSeries[key].forEach((d) => {
          if (!dateMap[d.date]) dateMap[d.date] = { date: d.date };
          dateMap[d.date][key] = d.value;
        });
      });
      seriesNat.forEach((d) => {
        if (dateMap[d.date]) dateMap[d.date].nat = d.value;
      });
      return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    }
    // Single series
    const map = {};
    series.forEach((d) => { map[d.date] = { date: d.date, main: d.value }; });
    seriesNat.forEach((d) => { if (map[d.date]) map[d.date].nat = d.value; });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [series, compSeries, seriesNat]);

  const topLines = useMemo(() => {
    const suffix = RATE_LEVEL[rateLevel].suffix;
    if (series.length > 0) return computeTopLines(series, suffix);
    return [];
  }, [series, rateLevel]);

  if (!rawData) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontFamily: "monospace", fontSize: 14 }}>
        Loading JOLTS data…
      </div>
    );
  }

  const suffix = RATE_LEVEL[rateLevel].suffix;
  const compKeys = Object.keys(compSeries);
  const getLabel = (mode, key) => {
    if (mode === "industry") return labelMap.industry[key] || key;
    if (mode === "dataelement") return DATA_ELEMENTS[key]?.label || labelMap.dataelement[key] || key;
    return key;
  };

  return (
    <div>
      {/* Main grid */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 28px", display: "grid", gridTemplateColumns: collapsed ? "0px 1fr" : "278px 1fr", gap: collapsed ? 0 : 22 }}>

        {/* Controls */}
        <div style={{ overflow: "hidden", opacity: collapsed ? 0 : 1, transition: "opacity 0.2s" }}>

          {/* Data Element */}
          <div style={{ background: "#fff", borderRadius: 7, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", color: "#E8A838", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Data Element</div>
            {Object.entries(DATA_ELEMENTS).map(([k, v]) => (
              <div key={k} onClick={() => setDataelement(k)} style={{
                padding: "7px 9px", borderRadius: 4, marginBottom: 3, cursor: "pointer",
                background: dataelement === k ? "#1a1a2e" : "transparent",
                color: dataelement === k ? "#fff" : "#1a1a2e",
                fontSize: 13, fontWeight: dataelement === k ? 600 : 400,
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: dataelement === k ? v.color : "#e5e7eb", flexShrink: 0 }} />
                {v.label}
              </div>
            ))}
          </div>

          {/* Rate vs Level */}
          <div style={{ background: "#fff", borderRadius: 7, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", color: "#E8A838", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Measure</div>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.entries(RATE_LEVEL).map(([k, v]) => (
                <Chip key={k} label={v.label} active={rateLevel === k} color="#2563eb" onClick={() => setRateLevel(k)} />
              ))}
            </div>
          </div>

          {/* Industry */}
          <div style={{ background: "#fff", borderRadius: 7, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", color: "#E8A838", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Industry</div>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              style={{ width: "100%", padding: "7px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #e5e7eb", background: "#fff" }}
            >
              <option value="All">All — Total Nonfarm</option>
              {dims.industry.map((k) => (
                <option key={k} value={k}>{labelMap.industry[k]}</option>
              ))}
            </select>
          </div>

          {/* Size Class */}
          <div style={{ background: "#fff", borderRadius: 7, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", color: "#E8A838", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Establishment Size</div>
            <select
              value={sizeclass}
              onChange={(e) => setSizeclass(e.target.value)}
              style={{ width: "100%", padding: "7px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #e5e7eb", background: "#fff" }}
            >
              <option value="All">All size classes</option>
              {dims.sizeclass.filter((k) => labelMap.sizeclass[k] !== "All size classes").map((k) => (
                <option key={k} value={k}>{labelMap.sizeclass[k]}</option>
              ))}
            </select>
          </div>

          {/* Compare mode */}
          <div style={{ background: "#fff", borderRadius: 7, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", color: "#E8A838", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Compare</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
              <Chip label="None" active={compareMode === "none"} color="#6b7280" onClick={() => { setCompareMode("none"); setCompareValues([]); }} />
              <Chip label="By Industry" active={compareMode === "industry"} color="#2563eb" onClick={() => { setCompareMode("industry"); setCompareValues([]); }} />
              <Chip label="By Element" active={compareMode === "dataelement"} color="#16a34a" onClick={() => { setCompareMode("dataelement"); setCompareValues([]); }} />
            </div>
            {compareMode === "industry" && (
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {dims.industry.map((k) => {
                  const selected = compareValues.includes(k);
                  return (
                    <div key={k} onClick={() => {
                      setCompareValues((prev) => selected ? prev.filter((v) => v !== k) : [...prev, k].slice(0, 5));
                    }} style={{
                      padding: "5px 8px", fontSize: 12, cursor: "pointer", borderRadius: 3,
                      background: selected ? "#2563eb12" : "transparent",
                      color: selected ? "#2563eb" : "#6b7280",
                      fontWeight: selected ? 600 : 400,
                    }}>
                      {selected ? "✓ " : ""}{labelMap.industry[k]}
                    </div>
                  );
                })}
              </div>
            )}
            {compareMode === "dataelement" && (
              <div>
                {Object.entries(DATA_ELEMENTS).map(([k, v]) => {
                  const selected = compareValues.includes(k);
                  return (
                    <div key={k} onClick={() => {
                      setCompareValues((prev) => selected ? prev.filter((x) => x !== k) : [...prev, k]);
                    }} style={{
                      padding: "5px 8px", fontSize: 12, cursor: "pointer", borderRadius: 3,
                      background: selected ? `${v.color}12` : "transparent",
                      color: selected ? v.color : "#6b7280",
                      fontWeight: selected ? 600 : 400,
                    }}>
                      {selected ? "✓ " : ""}{v.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Run */}
          <button onClick={run} style={{
            width: "100%", padding: 11, background: "#1a1a2e", color: "#fff",
            border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
            cursor: "pointer", letterSpacing: "0.04em",
          }}>
            Run Query →
          </button>
          <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 5 }}>
            Source: BLS JOLTS · Seasonally adjusted
          </div>
        </div>

        {/* Output */}
        {ran && (
          <div>
            {/* Active query bar */}
            <div style={{ background: "#1a1a2e", borderRadius: "7px 7px 0 0", padding: "11px 16px" }}>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "#E8A838", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>Active Query</div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
                {compKeys.length > 0
                  ? compKeys.map((k) => getLabel(compareMode, k)).join(" vs ")
                  : `${DATA_ELEMENTS[dataelement]?.label || dataelement} — ${industry === "All" ? "Total Nonfarm" : labelMap.industry[industry]}`
                }
                <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400, marginLeft: 10 }}>
                  · {RATE_LEVEL[rateLevel].label} · 2000–present
                </span>
              </div>
            </div>

            {/* Chart */}
            <div style={{ background: "#fff", padding: "18px 16px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 4, right: 14, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af", fontFamily: "monospace" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} interval={23} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af", fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}${suffix}`} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontFamily: "monospace", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                    formatter={(v, name) => [`${v}${suffix}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />

                  {compKeys.length > 0 ? (
                    compKeys.map((key, i) => (
                      <Line key={key} type="monotone" dataKey={key} name={getLabel(compareMode, key)}
                        stroke={compareMode === "dataelement" ? (DATA_ELEMENTS[key]?.color || COLORS_POOL[i]) : COLORS_POOL[i % COLORS_POOL.length]}
                        strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    ))
                  ) : (
                    <Line type="monotone" dataKey="main" name={DATA_ELEMENTS[dataelement]?.label || dataelement}
                      stroke={DATA_ELEMENTS[dataelement]?.color || "#2563eb"} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  )}

                  {seriesNat.length > 0 && compKeys.length === 0 && (
                    <Line type="monotone" dataKey="nat" name="National avg." stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Summary */}
            {topLines.length > 0 && (
              <div style={{ background: "#fff", borderTop: "1px solid #f3f4f6", borderRadius: "0 0 7px 7px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.12em", color: "#E8A838", textTransform: "uppercase", fontWeight: 600 }}>Summary</div>
                </div>
                {topLines.map((l, i) => (
                  <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "10px 16px", background: i % 2 === 0 ? "#fafafa" : "#fff", borderLeft: i === 0 ? "3px solid #2563eb" : "3px solid transparent" }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#1a1a2e", minWidth: 80 }}>{l.val}</div>
                    <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6 }}>{l.text}</div>
                  </div>
                ))}
                <div style={{ padding: "7px 16px", fontSize: 11, color: "#9ca3af", fontStyle: "italic", borderTop: "1px solid #f3f4f6" }}>
                  BLS Job Openings and Labor Turnover Survey (JOLTS). Seasonally adjusted.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
