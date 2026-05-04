import { useEffect, useRef, useState } from "react";

/**
 * Lightweight SVG-based area chart — no external dependencies.
 * Props:
 *   data      — array of { label, value } objects
 *   color     — hex/css color for the stroke & fill gradient
 *   height    — chart area height in px (default 120)
 *   showDots  — show interactive dots (default true)
 *   showGrid  — show horizontal grid lines (default true)
 *   animated  — animate path drawing (default true)
 */
function AreaChart({
  data = [],
  color = "#2f78c8",
  secondaryData = null,
  secondaryColor = "#1a5fa0",
  height = 140,
  showDots = true,
  showGrid = true,
  animated = true,
  formatValue = (v) => v,
}) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [drawn, setDrawn] = useState(!animated);

  useEffect(() => {
    if (animated) {
      const t = setTimeout(() => setDrawn(true), 80);
      return () => clearTimeout(t);
    }
  }, [animated]);

  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Not enough data</p>
      </div>
    );
  }

  const PAD_LEFT = 8;
  const PAD_RIGHT = 8;
  const PAD_TOP = 10;
  const PAD_BOTTOM = 28;

  const buildPath = (dataset, w, h) => {
    const allValues = dataset.map((d) => d.value);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;

    const points = dataset.map((d, i) => ({
      x: PAD_LEFT + (i / (dataset.length - 1)) * (w - PAD_LEFT - PAD_RIGHT),
      y: PAD_TOP + (1 - (d.value - min) / range) * (h - PAD_TOP - PAD_BOTTOM),
      value: d.value,
      label: d.label,
    }));

    // Smooth bezier curve
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2;
      path += ` C ${cx} ${points[i - 1].y}, ${cx} ${points[i].y}, ${points[i].x} ${points[i].y}`;
    }

    const areaPath =
      path +
      ` L ${points[points.length - 1].x} ${h - PAD_BOTTOM}` +
      ` L ${points[0].x} ${h - PAD_BOTTOM} Z`;

    return { points, linePath: path, areaPath };
  };

  // We need to measure the SVG width — use a percentage + viewBox approach
  const VW = 600;
  const VH = height;

  const { points, linePath, areaPath } = buildPath(data, VW, VH);
  const secondaryBuild = secondaryData ? buildPath(secondaryData, VW, VH) : null;

  const gridLines = showGrid ? [0.25, 0.5, 0.75].map((t) => PAD_TOP + t * (VH - PAD_TOP - PAD_BOTTOM)) : [];

  const gradId = `area-grad-${color.replace("#", "")}`;
  const grad2Id = `area-grad2-${secondaryColor.replace("#", "")}`;

  // Animated path length trick
  const pathRef = useRef(null);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          {secondaryData && (
            <linearGradient id={grad2Id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.01" />
            </linearGradient>
          )}
        </defs>

        {/* Grid lines */}
        {gridLines.map((y, i) => (
          <line key={i} x1={PAD_LEFT} y1={y} x2={VW - PAD_RIGHT} y2={y}
            stroke="var(--border)" strokeWidth="0.8" strokeDasharray="4 4" />
        ))}

        {/* Secondary area */}
        {secondaryBuild && (
          <>
            <path d={secondaryBuild.areaPath} fill={`url(#${grad2Id})`} />
            <path d={secondaryBuild.linePath} fill="none" stroke={secondaryColor}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={drawn ? "none" : "2000"}
              strokeDashoffset={drawn ? "0" : "2000"}
              style={{ transition: "stroke-dashoffset 1.2s ease" }}
            />
          </>
        )}

        {/* Primary area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Primary line */}
        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={drawn ? "none" : "2000"}
          strokeDashoffset={drawn ? "0" : "2000"}
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />

        {/* Dots */}
        {showDots && points.map((pt, i) => (
          <g key={i}
            onMouseEnter={(e) => {
              const rect = svgRef.current?.getBoundingClientRect();
              if (!rect) return;
              setTooltip({ x: pt.x, y: pt.y, value: pt.value, label: pt.label, idx: i });
            }}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor: "pointer" }}
          >
            {/* Hit area */}
            <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
            {/* Visible dot */}
            <circle cx={pt.x} cy={pt.y} r={tooltip?.idx === i ? 5 : 3.5}
              fill={color} stroke="var(--panel)" strokeWidth="2"
              style={{ transition: "r 0.15s ease" }}
            />
          </g>
        ))}

        {/* X-axis labels */}
        {points.map((pt, i) => {
          const step = Math.max(1, Math.floor(points.length / 7));
          if (i % step !== 0 && i !== points.length - 1) return null;
          return (
            <text key={i} x={pt.x} y={VH - 6} textAnchor="middle"
              style={{ fontSize: "11px", fill: "var(--muted)", fontFamily: "Inter,sans-serif" }}>
              {pt.label}
            </text>
          );
        })}

        {/* Tooltip vertical line */}
        {tooltip && (
          <line x1={tooltip.x} y1={PAD_TOP} x2={tooltip.x} y2={VH - PAD_BOTTOM}
            stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        )}
      </svg>

      {/* HTML tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-[var(--border)] px-3 py-2 text-xs shadow-lg fade-in-fast"
          style={{
            background: "var(--panel)",
            left: `${(tooltip.x / 600) * 100}%`,
            top: `${(tooltip.y / height) * 100}%`,
            transform: "translate(-50%, -130%)",
            whiteSpace: "nowrap",
            fontFamily: "Inter,sans-serif",
          }}
        >
          <p style={{ fontWeight: 700, color: "var(--text)" }}>{formatValue(tooltip.value)}</p>
          <p style={{ color: "var(--muted)" }}>{tooltip.label}</p>
        </div>
      )}
    </div>
  );
}

export default AreaChart;
