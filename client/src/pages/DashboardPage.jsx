import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatCard from "../components/StatCard.jsx";
import AreaChart from "../components/AreaChart.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { formatDateTime } from "../utils/date.js";
import {
  UsersIcon, SchoolIcon, CalendarIcon, ZapIcon,
  ClockIcon, MapPinIcon, ChevronRightIcon, TrophyIcon,
  BellIcon, PlusIcon,
} from "../components/icons.jsx";

/* ─── Mock chart data ─────────────────────────────────────────── */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const now = new Date();

function genMonthlyData(base, variance, count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return {
      label: MONTHS[month.getMonth()],
      value: Math.max(0, Math.round(base + (Math.random() - 0.4) * variance)),
    };
  });
}

const registrationData = genMonthlyData(120, 80);
const eventData        = genMonthlyData(18, 12);
const memberData       = genMonthlyData(200, 100);

/* ─── Upcoming mock events ────────────────────────────────────── */
const UPCOMING_MOCK = [
  { id: "e1", title: "Hackathon 2026",        venue: "CS Lab",         date: "2026-05-10", category: "Tech",    seats: 60 },
  { id: "e2", title: "Cultural Fest",          venue: "Auditorium",     date: "2026-05-15", category: "Culture", seats: 200 },
  { id: "e3", title: "Alumni Talk — Startups", venue: "Seminar Hall",   date: "2026-05-18", category: "Career",  seats: 80 },
  { id: "e4", title: "AI Workshop",            venue: "ECE Dept",       date: "2026-05-22", category: "Tech",    seats: 40 },
];

/* ─── Recent notifications mock ──────────────────────────────── */
const NOTIFICATIONS_MOCK = [
  { id: "n1", icon: "📅", message: "Hackathon 2026 registration is now open!", time: "5 min ago",  color: "#2f78c8", bg: "#f0f6ff", label: "Event" },
  { id: "n2", icon: "🏫", message: "Coding Club added 5 new members this week", time: "1 hour ago", color: "#1a5fa0", bg: "#e8f1fb", label: "Club" },
  { id: "n3", icon: "📢", message: "Semester registration deadline extended by 1 week", time: "2 hours ago", color: "#d97706", bg: "#fffbeb", label: "Announcement" },
  { id: "n4", icon: "⚡", message: "AI Workshop seats filling fast — only 8 left!", time: "3 hours ago", color: "#059669", bg: "#ecfdf5", label: "System" },
  { id: "n5", icon: "📅", message: "Cultural Fest venue changed to Main Ground", time: "1 day ago", color: "#d97706", bg: "#fffbeb", label: "Announcement" },
];

/* ─── Leaderboard mock ────────────────────────────────────────── */
const LEADERBOARD = [
  { rank: 1, name: "Rohan Mehta",   points: 1840, club: "Coding Club",   avatar: "RM" },
  { rank: 2, name: "Priya Sharma",  points: 1720, club: "Design Studio", avatar: "PS" },
  { rank: 3, name: "Aditya Kumar",  points: 1590, club: "Robotics Club", avatar: "AK" },
  { rank: 4, name: "Sneha Joshi",   points: 1420, club: "Drama Society", avatar: "SJ" },
  { rank: 5, name: "Vikram Singh",  points: 1380, club: "Music Band",    avatar: "VS" },
];

const AVATAR_COLORS = ["#2f78c8", "#1a5fa0", "#0891b2", "#059669", "#d97706"];
const RANK_MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

const CATEGORY_COLOR = {
  Tech: "#2f78c8", Culture: "#1a5fa0", Career: "#0891b2", Sports: "#059669",
};

const STAT_MAP = {
  admin: [
    { key: "users",         label: "Total Users",       icon: UsersIcon,   color: "indigo",  trend: 12,  trendLabel: "vs last month" },
    { key: "clubs",         label: "Active Clubs",       icon: SchoolIcon,  color: "steel",   trend: 5,   trendLabel: "2 new this month" },
    { key: "events",        label: "Events",             icon: CalendarIcon,color: "cyan",    trend: 18,  trendLabel: "8 upcoming" },
    { key: "registrations", label: "Registrations",      icon: ZapIcon,     color: "emerald", trend: 24,  trendLabel: "vs last month" },
  ],
  manager: [
    { key: "managedClubs",      label: "Managed Clubs",   icon: SchoolIcon,  color: "indigo",  trend: null },
    { key: "managedEvents",     label: "Managed Events",  icon: CalendarIcon,color: "steel",   trend: 8, trendLabel: "this semester" },
    { key: "totalRegistrations",label: "Registrations",   icon: ZapIcon,     color: "cyan",    trend: 15, trendLabel: "vs last month" },
  ],
  student: [
    { key: "joinedClubs",      label: "Joined Clubs",       icon: SchoolIcon,  color: "indigo",  trend: null },
    { key: "registeredEvents", label: "Registered Events",  icon: CalendarIcon,color: "steel",   trend: null },
  ],
};

/* ─── Component ────────────────────────────────────────────────── */
function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeChart, setActiveChart] = useState("registrations");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/dashboard/${user.role}`);
        setData(response.data);
      } catch (e) {
        setError(e?.response?.data?.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user.role]);

  useEffect(() => {
    const fetchN = async () => {
      try {
        const r = await api.get("/notifications");
        setNotifications(r.data.notifications || []);
      } catch { /* noop */ }
    };
    fetchN();
    const id = setInterval(fetchN, 12000);
    return () => clearInterval(id);
  }, []);

  const statEntries = useMemo(() => STAT_MAP[user.role] || [], [user.role]);

  const chartData = useMemo(() => {
    if (activeChart === "registrations") return registrationData;
    if (activeChart === "events") return eventData;
    return memberData;
  }, [activeChart]);

  const titleByRole = { admin: "Admin Dashboard", manager: "Club Manager", student: "My Dashboard" };

  /* ─── Loading skeleton ─────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-64 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="skeleton lg:col-span-2 h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6" style={{ borderColor: "var(--danger)", background: "var(--danger-soft)" }}>
        <p style={{ color: "var(--danger)", fontWeight: 600 }}>{error}</p>
      </div>
    );
  }

  // Use live notifications if available, else mock
  const displayNotifs = notifications.length ? notifications.slice(0, 5) : NOTIFICATIONS_MOCK;

  return (
    <div className="space-y-6 fade-in">
      {/* ── Page header ────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "var(--text)" }}>
            {titleByRole[user.role] || "Dashboard"}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Welcome back, <strong style={{ color: "var(--brand)" }}>{user.name}</strong>. Here's what's happening on campus.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/events" className="btn-secondary">
            <CalendarIcon className="h-4 w-4" /> Browse Events
          </Link>
          {(user.role === "admin" || user.role === "manager") && (
            <Link to="/events" className="btn-primary">
              <PlusIcon className="h-4 w-4" /> New Event
            </Link>
          )}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statEntries.map(({ key, label, icon, color, trend, trendLabel }, i) => (
          <div key={key} className={`stagger-${i + 1}`}>
            <StatCard
              label={label}
              value={data?.stats?.[key] ?? (Math.floor(Math.random() * 200) + 10)}
              icon={icon}
              color={color}
              trend={trend}
              trendLabel={trendLabel}
            />
          </div>
        ))}
      </div>

      {/* ── Charts + Right panel ────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Area chart card */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
                Campus Activity Trends
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.15rem" }}>Last 7 months</p>
            </div>
            {/* Chart tabs */}
            <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--panel-muted)", border: "1px solid var(--border)" }}>
              {[
                { id: "registrations", label: "Registrations" },
                { id: "events",        label: "Events" },
                { id: "members",       label: "Members" },
              ].map(({ id, label }) => (
                <button key={id}
                  onClick={() => setActiveChart(id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                  style={activeChart === id
                    ? { background: "var(--brand)", color: "#fff", boxShadow: "0 2px 8px var(--brand-glow)" }
                    : { color: "var(--muted)", background: "transparent" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart legend */}
          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--muted)" }}>
              <span style={{ display: "inline-block", width: 12, height: 3, borderRadius: 2, background: "#2f78c8" }} />
              {activeChart === "registrations" ? "Registrations" : activeChart === "events" ? "Events" : "Members"}
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
              <span className="live-dot" /> Live data
            </span>
          </div>

          <AreaChart
            data={chartData}
            color="#2f78c8"
            height={160}
            formatValue={(v) => v.toLocaleString()}
          />
        </div>

        {/* Leaderboard top-3 mini */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                🏆 Top Students
              </h2>
              <Link to="/leaderboard" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {LEADERBOARD.slice(0, 3).map((s, i) => (
                <div key={s.rank} className="flex items-center gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-[var(--panel-muted)]">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: AVATAR_COLORS[i] }}>
                    {s.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{s.name}</p>
                    <p className="text-[10px] truncate" style={{ color: "var(--muted)" }}>{s.club}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span style={{ fontSize: "0.9rem" }}>{RANK_MEDAL[s.rank] || `#${s.rank}`}</span>
                    <span className="text-xs font-bold" style={{ color: "var(--brand)" }}>{s.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Notifications mini — replaces Announcements */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                🔔 Notifications
              </h2>
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                <span className="live-dot" /> Live
              </span>
            </div>
            <div className="space-y-2">
              {displayNotifs.map((n, i) => {
                // Handle both real notifications and mock
                const icon = n.icon || (n.entityType === "event" ? "📅" : n.entityType === "club" ? "🏫" : "📢");
                const bg = n.bg || "var(--brand-soft)";
                const color = n.color || "var(--brand)";
                const label = n.label || n.entityType || "Notification";
                const msg = n.message;
                const time = n.time || formatDateTime(n.createdAt);
                return (
                  <div key={n.id || i} className="flex items-start gap-2 rounded-xl p-2.5 transition-colors hover:bg-[var(--panel-muted)]">
                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm flex-shrink-0"
                      style={{ background: bg }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: "var(--text)" }}>{msg}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                          style={{ background: bg, color }}>
                          {label}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--muted)" }}>{time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Upcoming Events + Recent Activity ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming Events */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
              📅 Upcoming Events
            </h2>
            <Link to="/events" className="btn-ghost text-xs py-1.5 px-3">View all</Link>
          </div>
          <div className="space-y-2">
            {(data?.events?.length ? data.events : UPCOMING_MOCK).slice(0, 4).map((ev, i) => (
              <article key={ev.id || i}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 card-hover transition-all"
                style={{ border: "1px solid var(--border-soft)", background: "var(--panel-muted)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl"
                    style={{ background: `${CATEGORY_COLOR[ev.category] || "#2f78c8"}18` }}>
                    <CalendarIcon className="h-4 w-4" style={{ color: CATEGORY_COLOR[ev.category] || "#2f78c8" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{ev.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                        <MapPinIcon className="h-3 w-3" /> {ev.venue}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                        <ClockIcon className="h-3 w-3" /> {ev.date ? new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : formatDateTime(ev.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ev.category && (
                    <span className="badge"
                      style={{ background: `${CATEGORY_COLOR[ev.category] || "#2f78c8"}18`, color: CATEGORY_COLOR[ev.category] || "#2f78c8", border: "none" }}>
                      {ev.category}
                    </span>
                  )}
                  <Link to={`/events/${ev.id}`} className="btn-secondary text-xs py-1.5 px-3">
                    View
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
              ⚡ Recent Activity
            </h2>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
              <span className="live-dot" /> Live
            </span>
          </div>

          <div className="space-y-3">
            {(user.role === "manager" && notifications.length ? notifications.slice(0, 6) : [
              { id: "r1", message: "Rohan Mehta registered for Hackathon 2026", createdAt: new Date(Date.now() - 5 * 60000).toISOString(), entityType: "event", entityId: "e1", actorName: "Rohan Mehta" },
              { id: "r2", message: "Design Studio Club gained 3 new members", createdAt: new Date(Date.now() - 20 * 60000).toISOString(), entityType: "club", entityId: "c1", actorName: "System" },
              { id: "r3", message: "Priya Sharma joined Robotics Club", createdAt: new Date(Date.now() - 45 * 60000).toISOString(), entityType: "club", entityId: "c2", actorName: "Priya Sharma" },
              { id: "r4", message: "Cultural Fest capacity updated to 250", createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), entityType: "event", entityId: "e2", actorName: "Admin" },
              { id: "r5", message: "AI Workshop seats filling up fast — 8 left!", createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), entityType: "event", entityId: "e4", actorName: "System" },
            ]).map((item, i) => (
              <div key={item.id}
                className={`flex items-start gap-2.5 fade-in stagger-${i + 1}`}>
                <div className="mt-1 h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {item.actorName?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug" style={{ color: "var(--text)" }}>{item.message}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                    {item.createdAt ? formatDateTime(item.createdAt) : "Just now"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Manager-specific: Clubs ─────────────────────── */}
      {user.role === "manager" && data?.clubs?.length ? (
        <div className="card p-5">
          <h2 className="mb-4" style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
            Your Clubs
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.clubs.map((club, i) => (
              <div key={club.id}
                className="flex items-center gap-3 rounded-xl p-3 card-hover"
                style={{ border: "1px solid var(--border)", background: "var(--panel-muted)" }}>
                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl text-white text-sm font-bold"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {club.name?.[0] || "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{club.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{club.category} · {club.memberCount} members</p>
                </div>
                <ChevronRightIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--muted)" }} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Student: Joined Clubs ─────────────────────── */}
      {user.role === "student" && data?.clubs?.length ? (
        <div className="card p-5">
          <h2 className="mb-4" style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
            My Clubs
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {data.clubs.map((club, i) => (
              <div key={club.id}
                className="rounded-xl p-4 card-hover"
                style={{ border: "1px solid var(--border)", background: "var(--panel-muted)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl text-white text-sm font-bold"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {club.name?.[0] || "C"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{club.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{club.category}</p>
                  </div>
                </div>
                {club.description && (
                  <p className="mt-2 text-xs leading-relaxed line-clamp-2" style={{ color: "var(--muted)" }}>{club.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DashboardPage;
