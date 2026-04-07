import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Home",          to: "/" },
  { label: "Macro Metrics", to: "/indicators" },
  { label: "Data Explorer", to: "/data" },
  { label: "Research",      to: "/research" },
  { label: "Contact",       to: "/contact" },
];

export default function Nav() {
  return (
    <header style={{
      background: "var(--navy)",
      borderBottom: "3px solid var(--accent)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52,
      }}>
        {/* Wordmark */}
        <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <polygon points="11,1 21,6 21,16 11,21 1,16 1,6" fill="none" stroke="#E8A838" strokeWidth="1.5"/>
            <rect x="5" y="14" width="2.5" height="5" fill="#E8A838" opacity="0.9"/>
            <rect x="9.75" y="10" width="2.5" height="9" fill="#E8A838" opacity="0.7"/>
            <rect x="14.5" y="7" width="2.5" height="12" fill="#E8A838" opacity="0.5"/>
          </svg>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18, fontWeight: 700,
            color: "var(--white)", letterSpacing: "-0.01em",
          }}>
            Magnastats
          </span>
        </NavLink>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: 4 }}>
          {NAV_ITEMS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              style={({ isActive }) => ({
                padding: "6px 14px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.02em",
                color: isActive ? "var(--accent)" : "rgba(255,255,255,0.5)",
                borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "all 0.15s",
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
