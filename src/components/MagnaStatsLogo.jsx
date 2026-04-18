/**
 * MagnaStatsLogo
 *
 * A split-shield logo mark inspired by heraldic crests.
 * Left panel: maroon  |  Right panel: navy  |  Accents: gold
 * An upward-trending sparkline cuts across the shield — data + gravitas.
 *
 * Props
 *   variant  "light" (on white / mist bg)  |  "dark" (on navy bg)
 *   width    number, default 200
 *   wordmark boolean, default true — show MAGNASTATS text
 */
export default function MagnaStatsLogo({
  variant = "light",
  width = 200,
  wordmark = true,
}) {
  const dark = variant === "dark";
  const h = Math.round(width * 0.28);

  // Text colours
  const textPrimary = dark ? "#FFFFFF" : "#0D1B2A";
  const textAccent  = dark ? "#C5A044" : "#7B2230";

  // Right shield panel is slightly lighter on dark bg so the split reads
  const shieldRight = dark ? "#2C4A6E" : "#0D1B2A";

  // Unique id prefix so two logos on the same page don't clash
  const uid = "mslogo";

  return (
    <svg
      width={width}
      height={h}
      viewBox={`0 0 ${wordmark ? 200 : 48} 64`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Magnastats logo"
      role="img"
    >
      {/* ── Shield icon (scaled to 75%) ──────────────────── */}
      <g transform="translate(4, 8) scale(0.75)">
        {/* Left panel — maroon */}
        <path
          d="M6,2 L32,2 L32,62 Q18,58 6,38 Z"
          fill="#7B2230"
        />

        {/* Right panel — navy / steel */}
        <path
          d="M32,2 L58,2 L58,38 Q46,58 32,62 Z"
          fill={shieldRight}
        />

        {/* Thin centre divider */}
        <line
          x1="32" y1="2" x2="32" y2="61"
          stroke="#C5A044" strokeWidth="0.6" opacity="0.5"
        />

        {/* Upward sparkline — gold */}
        <polyline
          points="12,46 20,36 32,41 42,26 54,30"
          stroke="#C5A044"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Endpoint dots */}
        <circle cx="12" cy="46" r="2.5" fill="#C5A044" />
        <circle cx="54" cy="30" r="2.5" fill="#C5A044" />

        {/* Shield outline — gold */}
        <path
          d="M6,2 L58,2 L58,38 Q46,58 32,62 Q18,58 6,38 Z"
          stroke="#C5A044"
          strokeWidth="2"
        />
      </g>

      {/* ── Wordmark ───────────────────────────────────────── */}
      {wordmark && (
        <>
          <text
            x="56" y="30"
            fontFamily="'Playfair Display', serif"
            fontWeight="700"
            fontSize="24"
            fill={textPrimary}
          >
            MAGNA
          </text>
          <text
            x="58" y="51"
            fontFamily="'DM Mono', monospace"
            fontSize="17"
            letterSpacing="6"
            fill={textAccent}
          >
            STATS
          </text>
        </>
      )}
    </svg>
  );
}
