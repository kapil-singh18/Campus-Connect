import { useId } from "react";

/* ─────────────────────────────────────────────
   CampusLogoMark  —  icon only (no text)
   Props:
     size   – px dimension (default 36)
     pulse  – show ambient pulse ring (default false)
     style  – extra inline styles
   ───────────────────────────────────────────── */
export function CampusLogoMark({ size = 36, pulse = false, style = {} }) {
  const bgId   = useId();
  const shId   = useId();
  const glowId = useId();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        cursor: "default",
        ...style,
      }}
      className="cc-logo-mark"
    >
      {pulse && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: Math.round(size * 0.22) + 4,
            border: "2px solid rgba(59,140,240,0.35)",
            animation: "cc-pulse 2.4s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ display: "block", flexShrink: 0 }}
      >
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#3b8cf0" />
            <stop offset="100%" stopColor="#1a4fa0" />
          </linearGradient>
          <linearGradient id={shId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.20)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background rounded rect */}
        <rect width="64" height="64" rx="14" fill={`url(#${bgId})`} />
        {/* Glass shine overlay */}
        <rect width="64" height="33" rx="14" fill={`url(#${shId})`} />

        {/* ── Graduation cap (top-view diamond) ── */}
        <polygon
          points="32,11 48,21 32,31 16,21"
          fill="white"
          opacity="0.95"
          filter={`url(#${glowId})`}
        />
        {/* Cap face highlight */}
        <polygon
          points="32,15 42,21 32,27 22,21"
          fill="rgba(59,140,240,0.38)"
        />
        {/* Cap edge lines */}
        <line x1="32" y1="11" x2="48" y2="21" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <line x1="48" y1="21" x2="32" y2="31" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <line x1="32" y1="31" x2="16" y2="21" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <line x1="16" y1="21" x2="32" y2="11" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

        {/* Cap stem */}
        <rect x="30.5" y="31" width="3" height="9.5" rx="1.5" fill="white" opacity="0.9" />

        {/* ── Campus arch / building ── */}
        <path
          d="M18 54 Q18 44 26 44 L38 44 Q46 44 46 54"
          fill="none"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Door arch */}
        <path
          d="M29 54 Q29 49 32 49 Q35 49 35 54"
          fill="white"
          opacity="0.6"
        />
        {/* Left column */}
        <rect x="19.5" y="44" width="2.2" height="10" rx="1.1" fill="white" opacity="0.55" />
        {/* Right column */}
        <rect x="42.3" y="44" width="2.2" height="10" rx="1.1" fill="white" opacity="0.55" />

        {/* ── Orange accent dot (connect / notification) ── */}
        <circle cx="48" cy="13" r="5.5" fill="#f5a142" />
        <circle cx="48" cy="13" r="3.2" fill="#ffcc80" />
        <circle cx="46.8" cy="11.8" r="1.1" fill="rgba(255,255,255,0.7)" />
      </svg>

      <style>{`
        .cc-logo-mark {
          transition: transform 0.22s cubic-bezier(.34,1.56,.64,1),
                      filter 0.22s ease;
        }
        .cc-logo-mark:hover {
          transform: scale(1.08) rotate(-2deg);
          filter: drop-shadow(0 4px 12px rgba(47,120,200,0.45));
        }
        @keyframes cc-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 0;   transform: scale(1.18); }
        }
      `}</style>
    </span>
  );
}

/* ─────────────────────────────────────────────
   CampusLogo  —  mark + wordmark
   Props:
     compact   – smaller, tighter layout
     textColor – override text color
   ───────────────────────────────────────────── */
function CampusLogo({ compact = false, textColor }) {
  const markSize = compact ? 34 : 42;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? "0.5rem" : "0.65rem",
      }}
    >
      <CampusLogoMark size={markSize} />
      <div>
        <p
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 800,
            fontSize: compact ? "0.9rem" : "1rem",
            color: textColor || "var(--text)",
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Campus<span style={{ color: "var(--brand)" }}>Connect</span>
        </p>
        <p
          style={{
            fontSize: compact ? "0.555rem" : "0.585rem",
            color: "var(--muted)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          College Hub
        </p>
      </div>
    </div>
  );
}

export default CampusLogo;
