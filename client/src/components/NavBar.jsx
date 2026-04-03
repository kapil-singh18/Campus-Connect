import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import api from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatDateTime } from "../utils/date.js";
import CampusLogo from "./CampusLogo.jsx";
import { BellIcon, LogoutIcon, MoonIcon, SunIcon, UserBadgeIcon } from "./icons.jsx";

const linkClass = ({ isActive }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-semibold transition",
    isActive ? "bg-[var(--accent-soft)] text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]",
  ].join(" ");

function NavBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedId, setExpandedId] = useState("");
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const roleLabel = useMemo(() => String(user?.role || "").toUpperCase(), [user?.role]);

  const loadNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (_error) {
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
    const handleOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
        setExpandedId("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.info("You have been logged out.");
    navigate("/");
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      await loadNotifications();
    } catch (_error) {
      // noop
    }
  };

  const toggleNotification = async (notification) => {
    if (!notification.read) {
      try {
        await api.patch(`/notifications/${notification.id}/read`);
      } catch (_error) {
        // noop
      }
    }

    setExpandedId((current) => (current === notification.id ? "" : notification.id));
    await loadNotifications();
  };

  const goToEntity = (notification) => {
    if (notification.entityType === "event") {
      navigate(`/events/${notification.entityId}`);
      return;
    }
    navigate(`/clubs/${notification.entityId}`);
  };

  return (
    <header className="sticky top-0 z-[90] border-b border-[var(--border)] bg-[var(--panel)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link to="/dashboard" aria-label="Campus Connect Home">
          <CampusLogo compact />
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/clubs" className={linkClass}>
            Clubs
          </NavLink>
          <NavLink to="/events" className={linkClass}>
            Events
          </NavLink>
          <NavLink to="/ask-doubt" className={linkClass}>
            Ask Doubt
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="icon-btn"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              className="icon-btn relative"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label="Notifications"
              title="Notifications"
            >
              <BellIcon />
              {unreadCount > 0 ? (
                <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[11px] font-extrabold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="card absolute right-0 z-[120] mt-2 w-[22rem] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-extrabold">Activity ({unreadCount})</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[var(--muted)] underline"
                    onClick={markAllRead}
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {notifications.length ? (
                    notifications.map((notification) => {
                      const meta = notification.meta || {};
                      const student = meta.student || {};
                      const isExpanded = expandedId === notification.id;
                      const entityLabel = meta.eventTitle || meta.clubName || notification.entityType;

                      return (
                        <div
                          key={notification.id}
                          className={`rounded-lg border ${notification.read
                              ? "border-[var(--border)] bg-[var(--panel)]"
                              : "border-[#c8dff7] bg-[var(--brand-soft)]"
                            }`}
                        >
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left"
                            onClick={() => toggleNotification(notification)}
                          >
                            <p className="text-sm font-bold">
                              {notification.actorName}
                              <span className="ml-2 text-xs font-semibold text-[var(--muted)]">{entityLabel}</span>
                            </p>
                            <p className="mt-1 text-xs text-[var(--muted)]">{notification.message}</p>
                            <p className="mt-1 text-[11px] text-[var(--muted)]">{formatDateTime(notification.createdAt)}</p>
                          </button>

                          {isExpanded ? (
                            <div className="border-t border-[var(--border)] px-3 py-2">
                              <p className="text-xs font-semibold text-[var(--muted)]">Student Details</p>
                              <p className="text-xs">{student.name || "Name not available"}</p>
                              <p className="text-xs text-[var(--muted)]">{student.email || "Email not available"}</p>
                              {student.department || student.year || student.phone ? (
                                <p className="mt-1 text-xs text-[var(--muted)]">
                                  {student.department || "Department"} | {student.year || "Year"} |{" "}
                                  {student.phone || "No phone"}
                                </p>
                              ) : null}
                              {meta.memberCount !== undefined ? (
                                <p className="mt-1 text-xs text-[var(--muted)]">Club members: {meta.memberCount}</p>
                              ) : null}
                              {meta.participantCount !== undefined ? (
                                <p className="mt-1 text-xs text-[var(--muted)]">
                                  Event participants: {meta.participantCount}
                                </p>
                              ) : null}

                              <button
                                type="button"
                                className="mt-2 text-xs font-semibold text-[var(--accent)] underline"
                                onClick={() => goToEntity(notification)}
                              >
                                Open {notification.entityType} details
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[var(--muted)]">No notifications yet.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              className="badge-brand flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-extrabold uppercase"
              onClick={() => setProfileOpen((open) => !open)}
            >
              <UserBadgeIcon />
              {roleLabel}
            </button>
            {profileOpen ? (
              <div className="card absolute right-0 z-[120] mt-2 w-72 p-4">
                <p className="text-sm font-extrabold">{user?.name}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{user?.email}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Role</p>
                <p className="text-sm font-bold capitalize">{user?.role}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Member Since</p>
                <p className="text-sm">{user?.createdAt ? formatDateTime(user.createdAt) : "Not available"}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="btn-secondary px-3 py-1.5 text-xs"
                    onClick={() => setProfileOpen(false)}
                  >
                    Edit Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    className="btn-secondary px-3 py-1.5 text-xs"
                    onClick={() => setProfileOpen(false)}
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn-primary flex items-center gap-2 text-sm"
            title="Logout"
          >
            <LogoutIcon />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default NavBar;
