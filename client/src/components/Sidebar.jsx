import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import CampusLogo from "./CampusLogo.jsx";
import {
  HomeIcon, SchoolIcon, CalendarIcon, QuestionIcon,
  LogoutIcon, AnalyticsIcon, TrophyIcon, SettingsIcon, ChevronRightIcon,
} from "./icons.jsx";

const NAV_ITEMS = [
  { to: "/dashboard",   label: "Dashboard",   icon: HomeIcon },
  { to: "/clubs",       label: "Clubs",        icon: SchoolIcon },
  { to: "/events",      label: "Events",       icon: CalendarIcon },
  { to: "/analytics",   label: "Analytics",    icon: AnalyticsIcon },
  { to: "/leaderboard", label: "Leaderboard",  icon: TrophyIcon },
  { to: "/ask-doubt",   label: "Ask Doubt",    icon: QuestionIcon },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const roleLabel = useMemo(() => String(user?.role || "").toUpperCase(), [user?.role]);
  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  }, [user?.name]);

  const handleLogout = () => {
    logout();
    toast.info("You have been logged out.");
    navigate("/");
  };

  const sidebarW = collapsed ? "w-[72px]" : "w-[260px]";

  return (
    <aside
      className={`fixed left-0 top-0 z-[100] h-screen ${sidebarW} border-r border-[var(--border)] flex flex-col overflow-hidden transition-all duration-300`}
      style={{ background: "var(--panel)" }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-[var(--border)] px-4 ${collapsed ? "justify-center py-5" : "justify-between py-4"}`}
        style={{ minHeight: "var(--topbar-h)" }}>
        {!collapsed && (
          <Link to="/dashboard" aria-label="CampusConnect Home" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg,#2f78c8,#1a5fa0)" }}>
              <span style={{ color: "#fff", fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "0.9rem" }}>CC</span>
            </div>
            <div>
              <p style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "var(--text)", lineHeight: 1 }}>
                Campus<span style={{ color: "var(--brand)" }}>Connect</span>
              </p>
              <p style={{ fontSize: "0.6rem", color: "var(--muted)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                College Hub
              </p>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" aria-label="CampusConnect Home">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg,#2f78c8,#1a5fa0)" }}>
              <span style={{ color: "#fff", fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "0.9rem" }}>CC</span>
            </div>
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="icon-btn"
            style={{ width: "2rem", height: "2rem" }}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="icon-btn mt-2"
            style={{ width: "2rem", height: "2rem" }}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {!collapsed && (
          <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.5rem 0.75rem 0.25rem" }}>
            Navigation
          </p>
        )}
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) => [
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group",
              isActive
                ? "text-white"
                : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--brand-soft)]",
              collapsed ? "justify-center" : "",
            ].join(" ")}
            style={({ isActive }) => isActive
              ? { background: "linear-gradient(135deg,#2f78c8,#1a5fa0)", boxShadow: "0 4px 12px rgba(47,120,200,0.3)" }
              : {}}
          >
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && <span style={{ fontFamily: "Inter,sans-serif" }}>{label}</span>}
            {!collapsed && (
              <ChevronRightIcon className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[var(--border)] px-2 py-3 space-y-1">
        <NavLink
          to="/settings"
          title={collapsed ? "Settings" : undefined}
          className={({ isActive }) => [
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
            isActive
              ? "bg-[var(--brand-soft)] text-[var(--brand)]"
              : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--brand-soft)]",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <SettingsIcon className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {/* User card */}
        <div className={`rounded-xl border border-[var(--border)] p-2.5 ${collapsed ? "flex justify-center" : "flex items-center gap-2.5"}`}
          style={{ background: "var(--panel-muted)" }}>
          <Link to="/profile" className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#2f78c8,#1a5fa0)" }}>
              {initials}
            </div>
          </Link>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold" style={{ color: "var(--text)" }}>{user?.name}</p>
              <p className="truncate text-[10px]" style={{ color: "var(--muted)" }}>{roleLabel}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} className="icon-btn flex-shrink-0"
              style={{ width: "1.8rem", height: "1.8rem" }} title="Logout">
              <LogoutIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-xl px-3 py-2 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-all duration-150"
            title="Logout">
            <LogoutIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
