import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/http.js";
import { formatDateTime } from "../utils/date.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { downloadCsv } from "../utils/csv.js";
import ClubJoinModal from "../components/ClubJoinModal.jsx";
import EmptyState from "../components/EmptyState.jsx";

function ClubDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/clubs/${id}`);
      setClub(response.data.club);
      setEvents(response.data.events || []);
      setError("");
    } catch (fetchError) {
      const message = fetchError?.response?.data?.message || "Unable to load club profile.";
      setError(message);
      toast.error(message, "Club details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleJoin = async (details) => {
    try {
      setJoinLoading(true);
      await api.post(`/clubs/${id}/join`, details);
      await fetchData();
      setJoinModalOpen(false);
      toast.success("Joined club successfully.");
    } catch (joinError) {
      const message = joinError?.response?.data?.message || "Unable to join club.";
      setError(message);
      toast.error(message, "Join failed");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      await api.delete(`/clubs/${id}/join`);
      await fetchData();
      toast.success("Left club successfully.");
    } catch (leaveError) {
      const message = leaveError?.response?.data?.message || "Unable to leave club.";
      setError(message);
      toast.error(message, "Leave failed");
    }
  };

  const handleDeleteClub = async () => {
    if (!window.confirm("Delete this club and all its events?")) return;
    try {
      await api.delete(`/clubs/${id}`);
      toast.success("Club deleted successfully.");
      navigate("/clubs");
    } catch (deleteError) {
      const message = deleteError?.response?.data?.message || "Unable to delete club.";
      setError(message);
      toast.error(message, "Delete failed");
    }
  };

  const exportMembersCsv = () => {
    const members = club?.members || [];
    if (!members.length) return;
    downloadCsv({
      filename: `${club.name.replace(/\s+/g, "_").toLowerCase()}_members.csv`,
      headers: ["Name", "Email", "Role"],
      rows: members.map((member) => [member.name, member.email, member.role || "student"]),
    });
  };

  if (loading) {
    return <div className="card animate-pulse p-6">Loading club profile...</div>;
  }

  if (error) {
    return <div className="card p-6 text-red-700 dark:text-red-300">{error}</div>;
  }

  if (!club) {
    return <div className="card p-6">Club not found.</div>;
  }

  const managerId = club.manager?._id || club.manager?.id || club.manager;
  const canManageClub = user.role === "manager" && managerId === user.id;
  const canViewMembers = user.role === "admin" || canManageClub;

  return (
    <section className="space-y-5">
      <article className="card fade-in p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{club.name}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{club.category}</p>
          </div>
          {user.role === "student" && !club.isMember ? (
            <button type="button" className="btn-primary" onClick={() => setJoinModalOpen(true)}>
              Join Club
            </button>
          ) : null}
          {user.role === "student" && club.isMember ? (
            <button type="button" className="btn-secondary" onClick={handleLeave}>
              Leave Club
            </button>
          ) : null}
        </div>
        <p className="mt-4 text-sm">{club.description}</p>
        <p className="mt-4 text-sm">
          <span className="font-semibold">Manager:</span> {club.manager?.name || "Not assigned"}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">Members:</span> {club.memberCount}
        </p>
        {canManageClub ? (
          <div className="mt-4">
            <button
              type="button"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700"
              onClick={handleDeleteClub}
              disabled={club.upcomingEventCount > 0}
              title={
                club.upcomingEventCount > 0
                  ? `${club.upcomingEventCount} upcoming event(s) still scheduled`
                  : "Delete club"
              }
            >
              Delete Club
            </button>
            {club.upcomingEventCount > 0 ? (
              <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                Delete blocked: {club.upcomingEventCount} upcoming event(s) must be removed first.
              </p>
            ) : null}
          </div>
        ) : null}
      </article>

      <article className="card fade-in p-6">
        <h2 className="text-xl font-bold">Club Events</h2>
        <div className="mt-4 space-y-3">
          {events.length ? (
            events.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3"
              >
                <div>
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-[var(--muted)]">{event.venue}</p>
                  <p className="text-sm text-[var(--muted)]">{formatDateTime(event.date)}</p>
                </div>
                <Link to={`/events/${event.id}`} className="btn-secondary text-sm">
                  Event Detail
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              title="No events yet"
              description="Once the manager creates events, they will appear here."
            />
          )}
        </div>
      </article>

      {canViewMembers ? (
        <article className="card fade-in p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Member List</h2>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={exportMembersCsv}
              disabled={!club.members?.length}
            >
              Export CSV
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {club.members?.length ? (
              club.members.map((member) => (
                <div
                  key={member._id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-3"
                >
                  <p className="text-sm font-semibold">{member.name}</p>
                  <p className="text-xs text-[var(--muted)]">{member.email}</p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No members yet"
                description="Students who join this club will show in this list."
              />
            )}
          </div>
        </article>
      ) : null}

      <ClubJoinModal
        open={joinModalOpen}
        clubName={club.name}
        initialValues={{
          name: user?.name || "",
          email: user?.email || "",
          department: "",
          year: "",
          phone: "",
        }}
        loading={joinLoading}
        onClose={() => setJoinModalOpen(false)}
        onSubmit={handleJoin}
      />
    </section>
  );
}

export default ClubDetailsPage;
