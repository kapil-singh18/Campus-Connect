import { TrendUpIcon, TrendDownIcon } from "./icons.jsx";

const ICON_BG = {
  indigo:  { bg: "linear-gradient(135deg,#2f78c8,#1a5fa0)", shadow: "rgba(47,120,200,0.3)" },
  steel:   { bg: "linear-gradient(135deg,#1a5fa0,#0f4a80)", shadow: "rgba(26,95,160,0.3)" },
  violet:  { bg: "linear-gradient(135deg,#4a7ab5,#2f78c8)", shadow: "rgba(74,122,181,0.3)" },
  cyan:    { bg: "linear-gradient(135deg,#0891b2,#06b6d4)", shadow: "rgba(8,145,178,0.3)" },
  emerald: { bg: "linear-gradient(135deg,#059669,#10b981)", shadow: "rgba(5,150,105,0.3)" },
  amber:   { bg: "linear-gradient(135deg,#d97706,#f59e0b)", shadow: "rgba(217,119,6,0.3)" },
  rose:    { bg: "linear-gradient(135deg,#e11d48,#f43f5e)", shadow: "rgba(225,29,72,0.3)" },
};

function StatCard({ label, value, icon: Icon, color = "indigo", trend, trendLabel, suffix = "" }) {
  const { bg, shadow } = ICON_BG[color] || ICON_BG.indigo;
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <article
      className="card card-hover fade-in p-5 flex flex-col gap-4"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Subtle glow orb */}
      <div style={{
        position: "absolute", top: -20, right: -20, width: 100, height: 100,
        borderRadius: "50%", background: bg, opacity: 0.06, filter: "blur(20px)",
        pointerEvents: "none",
      }} />

      <div className="flex items-start justify-between">
        {/* Icon */}
        {Icon && (
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: bg, boxShadow: `0 6px 18px ${shadow}` }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}

        {/* Trend badge */}
        {trend !== undefined && trend !== null && (
          <div
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold"
            style={{
              background: isPositive ? "var(--success-soft)" : isNegative ? "var(--danger-soft)" : "var(--panel-muted)",
              color: isPositive ? "var(--success)" : isNegative ? "var(--danger)" : "var(--muted)",
            }}
          >
            {isPositive ? <TrendUpIcon className="h-3 w-3" /> : isNegative ? <TrendDownIcon className="h-3 w-3" /> : null}
            {isPositive ? "+" : ""}{trend}%
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <p
          className="text-3xl font-extrabold tracking-tight"
          style={{ fontFamily: "Outfit,sans-serif", color: "var(--text)", animation: "count-up 0.5s ease both" }}
        >
          {value?.toLocaleString?.() ?? value}{suffix}
        </p>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--muted)" }}>{label}</p>
        {trendLabel && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted-light, var(--muted))" }}>{trendLabel}</p>
        )}
      </div>
    </article>
  );
}

export default StatCard;
