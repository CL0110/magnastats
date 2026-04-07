import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const C = {
  navy: "#0D1B2A", ink: "#1A2B3C", steel: "#2C4A6E", sky: "#4A90C4",
  teal: "#2AA89A", accent: "#E8A838", mist: "#F0F4F8", fog: "#E4EBF2",
  text: "#1A2B3C", muted: "#6B7F96", white: "#FFFFFF",
};

function generateSeries(base, variance, shock = -4.5) {
  const data = [];
  let val = base;
  for (let y = 2000; y <= 2024; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2024 && m > 10) break;
      val += (Math.random() - 0.5) * variance;
      if (y === 2020 && m >= 4 && m <= 6) val += shock;
      if (y === 2020 && m >= 7) val += Math.abs(shock) * 0.18;
      data.push({ yearLabel: m === 1 ? `${y}` : "", value: parseFloat(Math.max(30, Math.min(95, val)).toFixed(1)) });
    }
  }
  return data;
}

const NATIONAL = generateSeries(63.2, 0.3, -3.8);
const SERIES_A = generateSeries(57.4, 0.65, -5.2);
const SERIES_B = generateSeries(61.8, 0.55, -4.0);
const CHART_DATA = NATIONAL.map((d, i) => ({ ...d, a: SERIES_A[i]?.value, b: SERIES_B[i]?.value })).filter((_, i) => i % 2 === 0);

const DIMS = {
  sex: { label: "Sex", opts: ["All", "Female", "Male"] },
  age: { label: "Age Band", opts: ["All", "16–24", "25–34", "35–44", "45–54", "55–64", "65+"] },
  race: { label: "Race / Ethnicity", opts: ["All", "White non-Hisp.", "Black non-Hisp.", "Hispanic", "Asian", "Other"] },
  education: { label: "Education", opts: ["All", "< HS", "HS diploma", "Some college", "Bachelor's", "Advanced"] },
};

const OUTCOMES = ["LFPR", "Unemployment Rate", "EPOP"];
const PRESETS = ["2000–2024", "2010–2024", "2015–2024", "Post-COVID"];
const YEARS = Array.from({ length: 25 }, (_, i) => 2000 + i);
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const TOP_A = [
  { val: "−4.2 pts", text: "LFPR has declined 4.2 points since January 2020." },
  { val: "1.8 pts", text: "Decline is 1.8 pts steeper than the national average." },
  { val: "54.1%", text: "Lowest point occurred May 2020." },
  { val: "58.8%", text: "Current LFPR as of October 2024." },
];
const TOP_B = [
  { val: "−2.9 pts", text: "LFPR has declined 2.9 points since January 2020." },
  { val: "0.5 pts", text: "Decline is 0.5 pts steeper than the national average." },
  { val: "57.2%", text: "Lowest point occurred April 2020." },
  { val: "61.4%", text: "Current LFPR as of October 2024." },
];

function Chip({ label, active, color = C.sky, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 11px", borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap",
      border: `1.5px solid ${active ? color : C.fog}`,
      background: active ? color : C.white,
      color: active ? C.white : C.muted,
      fontSize: "11px", fontFamily: "'DM Sans', sans-serif",
      fontWeight: active ? 600 : 400, transition: "all 0.12s",
    }}>{label}</button>
  );
}

function CutPanel({ cut, onChange, color, label }) {
  return (
    <div style={{ border: `2px solid ${color}30`, borderRadius: "7px", padding: "14px", marginBottom: "10px", background: C.white }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "12px" }}>
        <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: color }} />
        <span style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", color, textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      </div>
      {Object.entries(DIMS).map(([k, cfg]) => (
        <div key={k} style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: "5px" }}>{cfg.label}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {cfg.opts.map(o => <Chip key={o} label={o} active={cut[k] === o} color={color} onClick={() => onChange(k, o)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.navy, borderRadius: "6px", padding: "9px 13px", fontSize: "11px", fontFamily: "'DM Sans', sans-serif", color: C.white, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "2px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.color }} />
          <span>{p.name}: <strong>{p.value}%</strong></span>
        </div>
      ))}
    </div>
  );
};

function TopBlock({ lines, color, label }) {
  return (
    <div style={{ flex: 1, minWidth: "260px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 15px", borderBottom: `1px solid ${C.fog}`, background: `${color}12` }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color }} />
        <span style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", color, textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", gap: "11px", alignItems: "flex-start", padding: "10px 15px", background: i % 2 === 0 ? C.mist : C.white, borderLeft: i === 0 ? `3px solid ${C.accent}` : `3px solid transparent` }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", fontWeight: 700, color: C.steel, minWidth: "58px", lineHeight: 1, paddingTop: "2px" }}>{l.val}</div>
          <div style={{ fontSize: "12px", fontFamily: "'DM Sans', sans-serif", color: C.text, lineHeight: 1.6 }}>{l.text}</div>
        </div>
      ))}
    </div>
  );
}

export default function DataExplorer() {
  const [cutA, setCutA] = useState({ sex: "Female", age: "25–34", race: "Black non-Hisp.", education: "Some college" });
  const [cutB, setCutB] = useState({ sex: "Female", age: "25–34", race: "Hispanic", education: "Some college" });
  const [showB, setShowB] = useState(true);
  const [outcome, setOutcome] = useState("LFPR");
  const [preset, setPreset] = useState("2000–2024");
  const [useCustom, setUseCustom] = useState(false);
  const [customRange, setCustomRange] = useState({ startY: 2000, startM: 0, endY: 2024, endM: 9 });
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(true);

  const run = () => { setLoading(true); setTimeout(() => { setLoading(false); setRan(true); }, 700); };

  const labelA = `${cutA.race}, ${cutA.sex}, ${cutA.age}`;
  const labelB = `${cutB.race}, ${cutB.sex}, ${cutB.age}`;
  const timeLabel = useCustom ? `${MONTHS[customRange.startM]} ${customRange.startY}–${MONTHS[customRange.endM]} ${customRange.endY}` : preset;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.mist, minHeight: "100vh", color: C.text }}>

      {/* Nav */}
      <div style={{ background: C.navy, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "48px", borderBottom: `3px solid ${C.accent}` }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: 700, color: C.white }}>Magnastats</span>
        <nav style={{ display: "flex", gap: "22px" }}>
          {["Dashboard", "Indicators", "Data", "Research"].map(n => (
            <a key={n} style={{ color: n === "Data" ? C.accent : "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: n === "Data" ? 600 : 400, textDecoration: "none", borderBottom: n === "Data" ? `2px solid ${C.accent}` : "2px solid transparent", paddingBottom: "2px" }}>{n}</a>
          ))}
        </nav>
      </div>

      {/* Page header */}
      <div style={{ background: C.ink, padding: "22px 28px 20px" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.15em", color: C.accent, textTransform: "uppercase", marginBottom: "5px" }}>Custom Tabulation Tool</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 700, color: C.white, margin: "0 0 5px", letterSpacing: "-0.02em" }}>CPS Labor Market Data</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>Build custom demographic cuts from CPS microdata, 2000–present.</p>
          </div>
          {ran && (
            <button onClick={() => setCollapsed(p => !p)} style={{ padding: "7px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "5px", color: "rgba(255,255,255,0.6)", fontSize: "11px", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
              {collapsed ? "◀ Expand controls" : "▶ Collapse controls"}
            </button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "24px 28px", display: "grid", gridTemplateColumns: collapsed ? "0px 1fr" : "278px 1fr", gap: collapsed ? "0" : "22px" }}>

        {/* Controls */}
        <div style={{ overflow: "hidden", opacity: collapsed ? 0 : 1, transition: "opacity 0.2s" }}>

          {/* Outcome */}
          <div style={{ background: C.white, borderRadius: "7px", padding: "14px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", color: C.accent, textTransform: "uppercase", marginBottom: "10px", fontWeight: 600 }}>Outcome Variable</div>
            {OUTCOMES.map(o => (
              <div key={o} onClick={() => setOutcome(o)} style={{ padding: "7px 9px", borderRadius: "4px", marginBottom: "3px", cursor: "pointer", background: outcome === o ? C.navy : "transparent", color: outcome === o ? C.white : C.text, fontSize: "12px", fontWeight: outcome === o ? 600 : 400, display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: outcome === o ? C.accent : C.fog, flexShrink: 0 }} />
                {o}
              </div>
            ))}
          </div>

          {/* Time range */}
          <div style={{ background: C.white, borderRadius: "7px", padding: "14px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", color: C.accent, textTransform: "uppercase", marginBottom: "10px", fontWeight: 600 }}>Time Range</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
              {PRESETS.map(p => <Chip key={p} label={p} active={!useCustom && preset === p} color={C.steel} onClick={() => { setPreset(p); setUseCustom(false); }} />)}
            </div>
            <div style={{ borderTop: `1px solid ${C.fog}`, paddingTop: "11px" }}>
              <div style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "7px" }}>Custom range</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {[["Start", "startM", "startY"], ["End", "endM", "endY"]].map(([lbl, mk, yk]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: "9px", color: C.muted, marginBottom: "3px" }}>{lbl}</div>
                    <select value={customRange[mk]} onChange={e => { setCustomRange(r => ({ ...r, [mk]: +e.target.value })); setUseCustom(true); }} style={{ width: "100%", padding: "4px 5px", fontSize: "11px", borderRadius: "3px", border: `1px solid ${useCustom ? C.sky : C.fog}`, fontFamily: "'DM Sans', sans-serif", marginBottom: "3px", background: C.white }}>
                      {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select value={customRange[yk]} onChange={e => { setCustomRange(r => ({ ...r, [yk]: +e.target.value })); setUseCustom(true); }} style={{ width: "100%", padding: "4px 5px", fontSize: "11px", borderRadius: "3px", border: `1px solid ${useCustom ? C.sky : C.fog}`, fontFamily: "'DM Sans', sans-serif", background: C.white }}>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cut A */}
          <CutPanel cut={cutA} onChange={(k, v) => setCutA(p => ({ ...p, [k]: v }))} color={C.sky} label="Cut A" />

          {/* Cut B */}
          <button onClick={() => setShowB(p => !p)} style={{ width: "100%", padding: "8px 13px", background: showB ? `${C.teal}12` : C.white, border: `1.5px dashed ${showB ? C.teal : C.fog}`, borderRadius: "6px", color: showB ? C.teal : C.muted, fontSize: "11px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer", marginBottom: "10px" }}>
            {showB ? "✕ Remove Cut B" : "+ Add comparison (Cut B)"}
          </button>
          {showB && <CutPanel cut={cutB} onChange={(k, v) => setCutB(p => ({ ...p, [k]: v }))} color={C.teal} label="Cut B" />}

          {/* Run */}
          <button onClick={run} style={{ width: "100%", padding: "11px", background: loading ? C.steel : C.navy, color: C.white, border: "none", borderRadius: "6px", fontSize: "12px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: loading ? "wait" : "pointer", letterSpacing: "0.04em", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
            {loading ? <><span style={{ width: "10px", height: "10px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Running...</> : "Run Query →"}
          </button>
          <div style={{ fontSize: "10px", color: C.muted, textAlign: "center", marginTop: "5px" }}>Source: CPS microdata, U.S. Census Bureau</div>
        </div>

        {/* Output */}
        {ran && (
          <div>
            {/* Active query bar */}
            <div style={{ background: C.navy, borderRadius: "7px 7px 0 0", padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <div style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: C.accent, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "3px" }}>Active Query</div>
                <div style={{ color: C.white, fontSize: "12px", fontWeight: 600, display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.sky }} />{labelA}</span>
                  {showB && <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.teal }} />{labelB}</span>}
                  <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>· {outcome} · {timeLabel}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "5px" }}>
                {["↓ PNG", "↓ CSV"].map(a => <button key={a} style={{ padding: "5px 10px", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", fontSize: "10px", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>{a}</button>)}
              </div>
            </div>

            {/* Chart */}
            <div style={{ background: C.white, padding: "18px 16px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "11px", color: C.muted, marginBottom: "12px", fontStyle: "italic" }}>
                {outcome} (%) · Monthly · {timeLabel}
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={CHART_DATA} margin={{ top: 4, right: 14, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.fog} />
                  <XAxis dataKey="yearLabel" tick={{ fontSize: 10, fill: C.muted, fontFamily: "'DM Sans', sans-serif" }} axisLine={{ stroke: C.fog }} tickLine={false} interval={11} />
                  <YAxis domain={[46, 72]} tick={{ fontSize: 10, fill: C.muted, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "'DM Sans', sans-serif", paddingTop: "10px" }} />
                  <Line type="monotone" dataKey="a" name={labelA} stroke={C.sky} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  {showB && <Line type="monotone" dataKey="b" name={labelB} stroke={C.teal} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
                  <Line type="monotone" dataKey="value" name="National avg." stroke={C.accent} strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top lines */}
            <div style={{ background: C.white, borderTop: `1px solid ${C.fog}`, borderRadius: "0 0 7px 7px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "10px 16px 8px", borderBottom: `1px solid ${C.fog}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", color: C.accent, textTransform: "uppercase", fontWeight: 600 }}>Top Lines</div>
                <div style={{ fontSize: "10px", color: C.muted, fontStyle: "italic" }}>Computed from query · not editorial interpretation</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <TopBlock lines={TOP_A} color={C.sky} label="Cut A" />
                {showB && <><div style={{ width: "1px", background: C.fog }} /><TopBlock lines={TOP_B} color={C.teal} label="Cut B" /></>}
              </div>
              <div style={{ padding: "7px 16px", fontSize: "10px", color: C.muted, fontStyle: "italic", borderTop: `1px solid ${C.fog}` }}>
                Derived from Current Population Survey (CPS) microdata. Tabulation by Magnastats.
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&family=DM+Mono:wght@500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
