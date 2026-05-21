/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { formatDateTime } from "../utils/date.js";
import { BellIcon, SunIcon, MoonIcon, SearchIcon } from "./icons.jsx";

const TYPE_CONFIG = {
  event:        { label: "Event",        icon: "📅", color: "#2f78c8", bg: "#f0f6ff" },
  club:         { label: "Club",         icon: "🏫", color: "#1a5fa0", bg: "#e8f1fb" },
  announcement: { label: "Announcement", icon: "📢", color: "#d97706", bg: "#fffbeb" },
  join_request: { label: "Join Request", icon: "📝", color: "#0f766e", bg: "#ecfdf5" },
  system:       { label: "System",       icon: "⚡", color: "#059669", bg: "#ecfdf5" },
  warning:      { label: "Warning",      icon: "⚠️", color: "#dc2626", bg: "#fef2f2" },
};

function getTypeConfig(notification) {
  if (notification.entityType === "event") return TYPE_CONFIG.event;
  if (notification.entityType === "club") return TYPE_CONFIG.club;
  if (notification.type === "announcement" || notification.entityType === "announcement") return TYPE_CONFIG.announcement;
  if (notification.type === "join_request" || notification.entityType === "join_request") return TYPE_CONFIG.join_request;
  if (notification.type === "warning") return TYPE_CONFIG.warning;
  return TYPE_CONFIG.system;
}

function TopNotificationBar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedId, setExpandedId] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 12000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationsOpen(false);
        setExpandedId("");
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const markAllRead = async () => {
    try { await api.post("/notifications/read-all"); await loadNotifications(); } catch { /* noop */ }
  };

  const toggleNotification = async (notification) => {
    if (!notification.read) {
      try { await api.patch(`/notifications/${notification.id}/read`); } catch { /* noop */ }
    }
    setExpandedId((cur) => (cur === notification.id ? "" : notification.id));
    await loadNotifications();
  };

  const goToEntity = (notification) => {
    if (notification.entityType === "event") navigate(`/events/${notification.entityId}`);
    else if (notification.entityType === "club") navigate(`/clubs/${notification.entityId}`);
    else if (notification.entityType === "announcement") navigate("/announcements");
    else if (notification.entityType === "join_request") navigate("/join-requests");
    setNotificationsOpen(false);
  };

  // Filtering by tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "events") return n.entityType === "event";
    if (activeTab === "clubs") return n.entityType === "club";
    if (activeTab === "requests") return n.type === "join_request" || n.entityType === "join_request";
    if (activeTab === "announcements") return n.type === "announcement" || n.entityType === "announcement";
    if (activeTab === "unread") return !n.read;
    return true;
  });

  if (!user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const tabs = [
    { id: "all",           label: "All" },
    { id: "unread",        label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { id: "events",        label: "Events" },
    { id: "clubs",         label: "Clubs" },
    { id: "requests",      label: "Requests" },
    { id: "announcements", label: "Announcements" },
  ];

  return (
    <header
      className="app-topbar fixed right-0 top-0 z-[90] flex items-center justify-between px-6 transition-all duration-300"
      style={{
        left: "var(--sidebar-w, 260px)",
        height: "var(--topbar-h, 64px)",
        background: "var(--glass)",
        backdropFilter: "blur(20px) saturate(1.6)",
        WebkitBackdropFilter: "blur(20px) saturate(1.6)",
        borderBottom: "1px solid var(--glass-border)",
      }}
    >
      {/* Left — greeting */}
      <div className="hidden md:block">
        <p style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
          {greeting}, <span style={{ color: "var(--brand)" }}>{user?.name?.split(" ")[0]}</span> 👋
        </p>
        <p style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 500 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Right — actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          {searchOpen ? (
            <div className="fade-in-fast flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2">
              <SearchIcon className="h-4 w-4 text-[var(--muted)]" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, clubs…"
                style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.85rem", color: "var(--text)", width: "180px" }}
              />
            </div>
          ) : (
            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search" title="Search">
              <SearchIcon className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>

        {/* Theme toggle */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            className="icon-btn relative"
            onClick={() => setNotificationsOpen((o) => !o)}
            aria-label="Notifications"
            title="Notifications"
          >
            <BellIcon className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "#dc2626", lineHeight: 1 }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              className="card fade-in-up absolute z-[120] overflow-hidden"
              style={{
                boxShadow: "0 20px 48px rgba(0,0,0,0.14)",
                right: "0.75rem",
                top: "calc(var(--topbar-h,64px) + 8px)",
                width: "min(24rem, calc(100vw - 2rem))",
                transformOrigin: "top right",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ background: "linear-gradient(135deg,#2f78c8,#1a5fa0)" }}>
                <div className="flex items-center gap-2">
                  <BellIcon className="h-4 w-4 text-white" />
                  <p style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>Notifications</p>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/30"
                  onClick={markAllRead}
                >
                  Mark all read
                </button>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-6 gap-0 border-b border-[var(--border)] overflow-x-auto"
                style={{ background: "var(--panel-muted)" }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="px-2.5 py-2 text-[11px] font-semibold transition-colors whitespace-nowrap"
                    style={{
                      color: activeTab === tab.id ? "var(--brand)" : "var(--muted)",
                      borderBottom: activeTab === tab.id ? "2px solid var(--brand)" : "2px solid transparent",
                      background: "transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="max-h-[28rem] overflow-y-auto p-2">
                {filteredNotifications.length ? filteredNotifications.map((n) => {
                  const meta = n.meta || {};
                  const isExpanded = expandedId === n.id;
                  const entityLabel = meta.eventTitle || meta.clubName || n.entityType;
                  const typeConf = getTypeConfig(n);
                  return (
                    <div key={n.id}
                      className="mb-2 rounded-2xl border border-[var(--border)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg last:mb-0"
                      style={{ background: n.read ? "var(--panel)" : "var(--brand-soft)" }}>
                      <button className="w-full px-4 py-3 text-left" onClick={() => toggleNotification(n)}>
                        <div className="flex items-start gap-3">
                          {/* Type icon */}
                          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm"
                            style={{ background: typeConf.bg, border: `1px solid ${typeConf.color}22` }}>
                            {typeConf.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-1.5">
                              {!n.read && <span className="mt-1 flex-shrink-0 live-dot" style={{ width: 6, height: 6 }} />}
                              <p className="truncate text-sm font-semibold leading-snug" style={{ color: "var(--text)" }}>
                                {n.actorName}
                                {entityLabel && <span className="ml-1 font-normal text-[var(--muted)]">· {entityLabel}</span>}
                              </p>
                              <span className="ml-auto flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
                                style={{ background: typeConf.bg, color: typeConf.color }}>
                                {typeConf.label}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)] line-clamp-2">{n.message}</p>
                            <p className="mt-1 text-[10px] text-[var(--muted)]">{formatDateTime(n.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                      {isExpanded && (n.entityId) && (
                        <div className="border-t border-[var(--border)] px-4 py-3 fade-in-fast flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--text)]">Open this item</p>
                            <p className="truncate text-[10px] text-[var(--muted)]">
                              {n.entityType === "join_request" ? "Review membership requests" : "View the related record"}
                            </p>
                          </div>
                          <button
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-soft)]"
                            onClick={() => goToEntity(n)}
                          >
                            {n.entityType === "join_request" ? "Open Join Requests" : `Open ${n.entityType}`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center py-10 gap-2">
                    <BellIcon className="h-8 w-8 text-[var(--border)]" />
                    <p className="text-xs font-medium text-[var(--muted)]">
                      {activeTab === "all" ? "No notifications yet" : `No ${activeTab} notifications`}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--border)] px-4 py-2.5"
                style={{ background: "var(--panel-muted)" }}>
                <p className="text-center text-[10px] text-[var(--muted)]">
                  All notifications for events, clubs & announcements appear here
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profile avatar */}
        <Link to="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white transition-transform hover:scale-105"
          style={{ background: "linear-gradient(135deg,#2f78c8,#1a5fa0)", flexShrink: 0 }}
          title="View profile"
        >
          {user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U"}
        </Link>
      </div>
    </header>
  );
}

export default TopNotificationBar;
