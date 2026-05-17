import { useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  HomeIcon, SchoolIcon, CalendarIcon, QuestionIcon,
  LogoutIcon, TrophyIcon, SettingsIcon, ChevronRightIcon,
} from "./icons.jsx";
import { CampusLogoMark } from "./CampusLogo.jsx";

const NAV_ITEMS = [
  { to: "/dashboard",   label: "Dashboard",   icon: HomeIcon },
  { to: "/clubs",       label: "Clubs",        icon: SchoolIcon },
  { to: "/events",      label: "Events",       icon: CalendarIcon },
  { to: "/leaderboard", label: "Leaderboard",  icon: TrophyIcon },
  { to: "/ask-doubt",   label: "Ask Doubt",    icon: QuestionIcon },
];



function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

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

  return (
    <aside
      style={{
        position: "fixed", left: 0, top: 0, zIndex: 100, height: "100vh",
        width: "var(--sidebar-w, 260px)",
        display: "flex", flexDirection: "column",
        background: "var(--panel)",
        borderRight: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.625rem",
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        minHeight: "var(--topbar-h, 64px)",
      }}>
        <Link to="/dashboard" aria-label="CampusConnect Home" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <CampusLogoMark size={34} />
          <div>
            <p style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.1 }}>
              Campus<span style={{ color: "var(--brand)" }}>Connect</span>
            </p>
            <p style={{ fontSize: "0.575rem", color: "var(--muted)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              College Hub
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <p style={{ fontSize: "0.575rem", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.25rem 0.75rem 0.5rem" }}>
          Navigation
        </p>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => [
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group",
              isActive ? "text-white" : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--brand-soft)]",
            ].join(" ")}
            style={({ isActive }) => isActive
              ? { background: "linear-gradient(135deg,#2f78c8,#1a5fa0)", boxShadow: "0 4px 12px rgba(47,120,200,0.28)" }
              : {}}
          >
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
            <span style={{ fontFamily: "Inter,sans-serif" }}>{label}</span>
            <ChevronRightIcon className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <NavLink
          to="/settings"
          className={({ isActive }) => [
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
            isActive ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--brand-soft)]",
          ].join(" ")}
        >
          <SettingsIcon className="h-[18px] w-[18px] flex-shrink-0" />
          <span>Settings</span>
        </NavLink>

        {/* User card */}
        <div style={{
          borderRadius: 12, border: "1px solid var(--border)", padding: "0.625rem 0.75rem",
          display: "flex", alignItems: "center", gap: "0.625rem",
          background: "var(--panel-muted)",
        }}>
          <Link to="/profile" style={{ flexShrink: 0, textDecoration: "none" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg,#2f78c8,#1a5fa0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.7rem", fontWeight: 700, color: "#fff",
            }}>
              {initials}
            </div>
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</p>
            <p style={{ fontSize: "0.625rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{roleLabel}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: "grid", placeItems: "center", width: 28, height: 28,
              borderRadius: 8, border: "1px solid var(--border)",
              background: "transparent", color: "var(--muted)", cursor: "pointer",
              transition: "all 0.15s ease", flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-soft)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "var(--danger)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            title="Logout"
          >
            <LogoutIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
