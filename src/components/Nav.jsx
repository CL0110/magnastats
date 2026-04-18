import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Home",          to: "/" },
  { label: "Indicators", to: "/indicators" },
  { label: "Data Explorer", to: "/data" },
  { label: "Insights",      to: "/insights" },
  { label: "Analysis",      to: "/research" },
  { label: "About",         to: "/about" },
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
        <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={import.meta.env.BASE_URL + "favicon.svg"} alt="" style={{ width: 22, height: 22 }} />
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
