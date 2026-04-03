import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatCard from "../components/StatCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import SkeletonGrid from "../components/SkeletonGrid.jsx";
import { formatDateTime } from "../utils/date.js";

const titleByRole = {
  admin: "Admin Dashboard",
  manager: "Club Manager Dashboard",
  student: "Student Dashboard",
};

const statKeyMap = {
  admin: [
    ["users", "Users"],
    ["clubs", "Clubs"],
    ["events", "Events"],
    ["registrations", "Registrations"],
  ],
  manager: [
    ["managedClubs", "Managed Clubs"],
    ["managedEvents", "Managed Events"],
    ["totalRegistrations", "Registrations"],
  ],
  student: [
    ["joinedClubs", "Joined Clubs"],
    ["registeredEvents", "Registered Events"],
  ],
};

function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/dashboard/${user.role}`);
        setData(response.data);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user.role]);

  useEffect(() => {
    if (user.role !== "manager") return;

    const fetchNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        setNotifications(response.data.notifications || []);
        setNotificationError("");
      } catch (fetchError) {
        setNotificationError(fetchError?.response?.data?.message || "Unable to load notifications.");
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalId);
  }, [user.role]);

  const statEntries = useMemo(() => statKeyMap[user.role] || [], [user.role]);

  if (loading) {
    return <SkeletonGrid count={4} cols="sm:grid-cols-2 lg:grid-cols-4" cardHeight="h-32" />;
  }

  if (error) {
    return <div className="card p-6 text-red-700 dark:text-red-300">{error}</div>;
  }

  return (
    <section className="space-y-5">
      <div className="fade-in">
        <h1 className="text-2xl font-extrabold">{titleByRole[user.role] || "Dashboard"}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Welcome back, {user.name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statEntries.map(([key, label]) => (
          <StatCard key={key} label={label} value={data?.stats?.[key] ?? 0} />
        ))}
      </div>

      {user.role === "manager" && data?.clubs?.length ? (
        <section className="card fade-in border-[#dce7f5] bg-[#fcfdff] p-5 dark:border-[var(--border)] dark:bg-[var(--panel)]">
          <h2 className="text-lg font-bold">Your Clubs</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {data.clubs.map((club) => (
              <article key={club.id} className="rounded-xl border border-[#dce7f5] bg-[#f8fbff] p-3 dark:border-[var(--border)] dark:bg-[var(--panel-muted)]">
                <p className="font-bold">{club.name}</p>
                <p className="text-sm text-[var(--muted)]">{club.category}</p>
                <p className="text-sm">Members: {club.memberCount}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {user.role === "manager" ? (
        <section className="card fade-in border-[#dce7f5] bg-[#fcfdff] p-5 dark:border-[var(--border)] dark:bg-[var(--panel)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Registration Notifications</h2>
            <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
              {notifications.filter((item) => !item.read).length} unread
            </span>
          </div>
          {notificationError ? (
            <p className="mt-3 text-sm text-red-700 dark:text-red-300">{notificationError}</p>
          ) : null}
          <div className="mt-3 space-y-2">
            {notifications.length ? (
              notifications.slice(0, 8).map((item) => {
                const meta = item.meta || {};
                const student = meta.student || {};
                return (
                  <article key={item.id} className="rounded-xl border border-[#dce7f5] bg-[#f8fbff] p-3 dark:border-[var(--border)] dark:bg-[var(--panel-muted)]">
                    <p className="text-sm font-bold">{item.message}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(item.createdAt)}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {student.name || "Student"} | {student.email || "No email"}
                    </p>
                    {(student.department || student.year || student.phone) ? (
                      <p className="text-xs text-[var(--muted)]">
                        {student.department || "Department"} | {student.year || "Year"} | {student.phone || "No phone"}
                      </p>
                    ) : null}
                    {meta.memberCount !== undefined ? (
                      <p className="text-xs text-[var(--muted)]">Current members: {meta.memberCount}</p>
                    ) : null}
                    {meta.participantCount !== undefined ? (
                      <p className="text-xs text-[var(--muted)]">Current participants: {meta.participantCount}</p>
                    ) : null}
                    <div className="mt-2">
                      <Link
                        to={item.entityType === "event" ? `/events/${item.entityId}` : `/clubs/${item.entityId}`}
                        className="text-xs font-semibold text-[var(--accent)] underline"
                      >
                        Open {item.entityType}
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-[var(--muted)]">No notifications yet for your clubs/events.</p>
            )}
          </div>
        </section>
      ) : null}

      {user.role === "manager" ? (
        <section className="card fade-in border-[#dce7f5] bg-[#fcfdff] p-5 dark:border-[var(--border)] dark:bg-[var(--panel)]">
          <h2 className="text-lg font-bold">Activity Log</h2>
          <div className="mt-3 space-y-2">
            {data?.activityLogs?.length ? (
              data.activityLogs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-xl border border-[#dce7f5] bg-[#f8fbff] p-3 dark:border-[var(--border)] dark:bg-[var(--panel-muted)]"
                >
                  <p className="text-sm font-bold">{log.actorName}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{log.details}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(log.createdAt)}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No activity logs yet.</p>
            )}
          </div>
        </section>
      ) : null}

      {user.role === "student" && data?.clubs?.length ? (
        <section className="card fade-in border-[#dce7f5] bg-[#fcfdff] p-5 dark:border-[var(--border)] dark:bg-[var(--panel)]">
          <h2 className="text-lg font-bold">Joined Clubs</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {data.clubs.map((club) => (
              <article key={club.id} className="rounded-xl border border-[#dce7f5] bg-[#f8fbff] p-3 dark:border-[var(--border)] dark:bg-[var(--panel-muted)]">
                <p className="font-bold">{club.name}</p>
                <p className="text-sm text-[var(--muted)]">{club.category}</p>
                <p className="text-sm">{club.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card fade-in border-[#dce7f5] bg-[#fcfdff] p-5 dark:border-[var(--border)] dark:bg-[var(--panel)]">
        <h2 className="text-lg font-bold">Recent Activity</h2>
        <div className="mt-3 space-y-3">
          {(data?.events || data?.registeredEvents || data?.upcomingEvents || []).length ? (
            (data.events || data.registeredEvents || data.upcomingEvents).map((event) => (
              <article
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce7f5] bg-[#f8fbff] p-3 dark:border-[var(--border)] dark:bg-[var(--panel-muted)]"
              >
                <div>
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {event.club} | {event.venue}
                  </p>
                  <p className="text-sm text-[var(--muted)]">{formatDateTime(event.date)}</p>
                </div>
                <Link to={`/events/${event.id}`} className="btn-secondary text-sm">
                  View
                </Link>
              </article>
            ))
          ) : (
            <EmptyState
              title="No activity yet"
              description="Your latest events and registrations will appear here once you start using Campus Connect."
            />
          )}
        </div>
      </section>
    </section>
  );
}

export default DashboardPage;
