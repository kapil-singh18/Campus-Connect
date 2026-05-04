import { useState } from "react";
import AreaChart from "../components/AreaChart.jsx";
import StatCard from "../components/StatCard.jsx";
import { UsersIcon, CalendarIcon, SchoolIcon, ZapIcon, TrophyIcon } from "../components/icons.jsx";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const now = new Date();

function gen(base, variance, count = 12) {
  return Array.from({ length: count }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return { label: MONTHS[m.getMonth()], value: Math.max(0, Math.round(base + (Math.random() - 0.38) * variance)) };
  });
}

const REG_DATA   = gen(140, 90);
const EVENT_DATA = gen(22,  14);
const MEMBER_DATA= gen(280, 120);
const ACTIVE_DATA= gen(60,  30);

const CLUB_BREAKDOWN = [
  { name: "Coding Club",   members: 214, events: 18, color: "#2f78c8" },
  { name: "Design Studio", members: 178, events: 12, color: "#1a5fa0" },
  { name: "Robotics",      members: 152, events: 9,  color: "#0891b2" },
  { name: "Drama Society", members: 130, events: 15, color: "#059669" },
  { name: "Music Band",    members: 118, events: 20, color: "#d97706" },
  { name: "Photography",   members: 96,  events: 8,  color: "#e11d48" },
];

const MAX_MEMBERS = Math.max(...CLUB_BREAKDOWN.map((c) => c.members));

const PEAK_HOURS = [
  { hour: "8am",  val: 30  },{ hour: "9am",  val: 60  },{ hour: "10am", val: 90  },
  { hour: "11am", val: 120 },{ hour: "12pm", val: 100 },{ hour: "1pm",  val: 80  },
  { hour: "2pm",  val: 110 },{ hour: "3pm",  val: 130 },{ hour: "4pm",  val: 95  },
  { hour: "5pm",  val: 70  },{ hour: "6pm",  val: 50  },{ hour: "7pm",  val: 35  },
];

const CATEGORY_DIST = [
  { label: "Technology",  pct: 34, color: "#2f78c8" },
  { label: "Cultural",    pct: 22, color: "#1a5fa0" },
  { label: "Sports",      pct: 18, color: "#0891b2" },
  { label: "Academic",    pct: 15, color: "#059669" },
  { label: "Career",      pct: 11, color: "#d97706" },
];

function DonutChart({ data }) {
  const R = 54; const CX = 70; const CY = 70; const stroke = 18;
  const circumference = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" style={{ width: 140, height: 140, flexShrink: 0 }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {data.map((d, i) => {
          const dash = (d.pct / 100) * circumference;
          const gap  = circumference - dash;
          const el = (
            <circle key={i} cx={CX} cy={CY} r={R} fill="none"
              stroke={d.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={CX} y={CY - 6} textAnchor="middle" style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: 18, fill: "var(--text)" }}>
          {data.reduce((a, d) => a + d.pct, 0)}%
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" style={{ fontSize: 10, fill: "var(--muted)", fontFamily: "Inter,sans-serif" }}>
          Active
        </text>
      </svg>
      <div className="space-y-2 flex-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text)", flex: 1 }}>{d.label}</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)" }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const [range, setRange] = useState("12m");

  const sliceData = (arr) => {
    if (range === "3m")  return arr.slice(-3);
    if (range === "6m")  return arr.slice(-6);
    return arr;
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "var(--text)" }}>
            Analytics
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Deep insights into campus activity and engagement
          </p>
        </div>
        {/* Range selector */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--panel-muted)", border: "1px solid var(--border)" }}>
          {["3m","6m","12m"].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
              style={range === r
                ? { background: "var(--brand)", color: "#fff", boxShadow: "0 2px 8px var(--brand-glow)" }
                : { color: "var(--muted)" }}>
              {r === "3m" ? "3 Months" : r === "6m" ? "6 Months" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stagger-1"><StatCard label="Total Registrations" value={2847} icon={ZapIcon}       color="indigo"  trend={18} trendLabel="vs prev period" /></div>
        <div className="stagger-2"><StatCard label="Active Members"      value={1203} icon={UsersIcon}     color="violet"  trend={12} /></div>
        <div className="stagger-3"><StatCard label="Events Hosted"       value={94}   icon={CalendarIcon}  color="cyan"    trend={7}  /></div>
        <div className="stagger-4"><StatCard label="Clubs Active"        value={18}   icon={SchoolIcon}    color="emerald" trend={5}  /></div>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-1" style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>Registrations Over Time</h2>
          <p className="mb-4 text-xs" style={{ color: "var(--muted)" }}>Monthly event registrations</p>
          <AreaChart data={sliceData(REG_DATA)} color="#2f78c8" height={160} />
        </div>
        <div className="card p-5">
          <h2 className="mb-1" style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>Events Created</h2>
          <p className="mb-4 text-xs" style={{ color: "var(--muted)" }}>Monthly new events</p>
          <AreaChart data={sliceData(EVENT_DATA)} color="#1a5fa0" height={160} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Club breakdown */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4" style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>Club Membership Breakdown</h2>
          <div className="space-y-3">
            {CLUB_BREAKDOWN.map((club) => (
              <div key={club.name}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>{club.name}</span>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{club.events} events</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: club.color }}>{club.members}</span>
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    width: `${(club.members / MAX_MEMBERS) * 100}%`,
                    background: club.color,
                    transition: "width 1s cubic-bezier(0.22,1,0.36,1)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event category donut */}
        <div className="card p-5">
          <h2 className="mb-4" style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>Event Categories</h2>
          <DonutChart data={CATEGORY_DIST} />
        </div>
      </div>

      {/* Peak activity hours */}
      <div className="card p-5">
        <h2 className="mb-1" style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>Peak Activity Hours</h2>
        <p className="mb-4 text-xs" style={{ color: "var(--muted)" }}>Average campus portal usage throughout the day</p>
        <AreaChart data={PEAK_HOURS} color="#0891b2" height={120} />
      </div>
    </div>
  );
}

export default AnalyticsPage;
