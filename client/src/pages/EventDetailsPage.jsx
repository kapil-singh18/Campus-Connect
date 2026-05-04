import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatDateTime, statusClass } from "../utils/date.js";
import RegistrationFormModal from "../components/RegistrationFormModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { downloadCsv } from "../utils/csv.js";

const registrationStateLabel = {
  open: "Open",
  closed_by_manager: "Closed by manager/admin",
  deadline_passed: "Deadline passed",
  full: "Full",
};

function EventDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);

  const canRegister = user.role === "student";

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.event);
      setParticipants(response.data.participants || []);
      setError("");
    } catch (fetchError) {
      const message = fetchError?.response?.data?.message || "Unable to load event details.";
      setError(message);
      toast.error(message, "Event details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success("Event deleted successfully.");
      navigate("/events");
    } catch (deleteError) {
      const message = deleteError?.response?.data?.message || "Unable to delete event.";
      setError(message);
      toast.error(message, "Delete failed");
    }
  };

  const handleRegisterToggle = async (payload = {}) => {
    if (!event) return;
    setActionLoading(true);
    try {
      if (event.isRegistered) {
        await api.delete(`/events/${id}/register`);
      } else {
        await api.post(`/events/${id}/register`, payload);
      }
      setRegisterOpen(false);
      await fetchEvent();
      toast.success(event.isRegistered ? "Unregistered from event." : "Registered successfully.");
    } catch (registerError) {
      const message = registerError?.response?.data?.message || "Unable to update registration.";
      setError(message);
      toast.error(message, "Registration failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRegistrationStatus = async () => {
    if (!event) return;
    setToggleLoading(true);
    try {
      await api.patch(`/events/${id}/registration-status`, {
        closed: !event.registrationClosed,
      });
      await fetchEvent();
      toast.success(event.registrationClosed ? "Registration reopened." : "Registration closed.");
    } catch (toggleError) {
      const message = toggleError?.response?.data?.message || "Unable to update registration status.";
      setError(message);
      toast.error(message, "Status update failed");
    } finally {
      setToggleLoading(false);
    }
  };

  const exportParticipantsCsv = () => {
    if (!participants.length) return;
    downloadCsv({
      filename: `${event.title.replace(/\s+/g, "_").toLowerCase()}_participants.csv`,
      headers: ["Name", "Email", "Phone", "Department", "Year", "Registered At"],
      rows: participants.map((participant) => [
        participant.name,
        participant.email,
        participant.phone || "",
        participant.department || "",
        participant.year || "",
        formatDateTime(participant.registeredAt),
      ]),
    });
  };

  if (loading) {
    return <div className="card animate-pulse p-6">Loading event details...</div>;
  }

  if (error) {
    return <div className="card p-6 text-red-700 dark:text-red-300">{error}</div>;
  }

  if (!event) {
    return <div className="card p-6">Event not found.</div>;
  }
  const canManage = Boolean(event.canManage);
  const canControlRegistration = Boolean(event.canControlRegistration);
  const clubId = event.club?._id || event.club?.id || event.club;
  const needsClubJoin = canRegister && !event.isRegistered && !event.isClubMember;

  return (
    <section className="page-section-wide space-y-5">
      <Link className="text-sm font-semibold text-[var(--muted)] underline" to="/events">
        Back to Events
      </Link>
      <article className="card fade-in overflow-hidden">
        <img src={event.posterUrl} alt={event.title} className="h-60 w-full object-cover md:h-64" />
        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-extrabold">{event.title}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${statusClass(event.status)}`}>
              {event.status}
            </span>
          </div>
          <p className="mt-3 text-sm">{event.description}</p>
          <div className="mt-4 grid gap-2 text-sm">
            <p>
              <span className="font-semibold">Club:</span> {event.club?.name || "Unknown Club"}
            </p>
            <p>
              <span className="font-semibold">Category:</span> {event.category}
            </p>
            <p>
              <span className="font-semibold">Date:</span> {formatDateTime(event.date)}
            </p>
            <p>
              <span className="font-semibold">Venue:</span> {event.venue}
            </p>
            <p>
              <span className="font-semibold">Registrations:</span> {event.registrationCount} / {event.maxParticipants}
            </p>
            <p>
              <span className="font-semibold">Spots Left:</span> {event.spotsLeft ?? "-"}
            </p>
            <p>
              <span className="font-semibold">Registration Deadline:</span> {formatDateTime(event.registrationDeadline)}
            </p>
            <p>
              <span className="font-semibold">Registration Status:</span>{" "}
              {registrationStateLabel[event.registrationState] || "Open"}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {canRegister ? (
              <button
                type="button"
                className="btn-primary"
                disabled={actionLoading || (!event.registrationOpen && !event.isRegistered) || needsClubJoin}
                onClick={() => {
                  if (event.isRegistered) {
                    handleRegisterToggle();
                  } else {
                    if (needsClubJoin) {
                      toast.info("Join this event's club first, then register.", "Join club required");
                      return;
                    }
                    if (!event.registrationOpen) return;
                    setRegisterOpen(true);
                  }
                }}
              >
                {actionLoading
                  ? "Please wait..."
                  : event.isRegistered
                    ? "Unregister from Event"
                    : needsClubJoin
                      ? "Join Club First"
                    : event.registrationOpen
                      ? "Register for Event"
                      : registrationStateLabel[event.registrationState] || "Registration Closed"}
              </button>
            ) : null}
            {canControlRegistration ? (
              <button
                type="button"
                className="btn-secondary"
                disabled={toggleLoading}
                onClick={handleToggleRegistrationStatus}
              >
                {toggleLoading
                  ? "Updating..."
                  : event.registrationClosed
                    ? "Open Registration"
                    : "Close Registration"}
              </button>
            ) : null}
            {canManage ? (
              <button
                type="button"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700"
                onClick={handleDelete}
              >
                Delete Event
              </button>
            ) : null}
          </div>
          {needsClubJoin && clubId ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              You need to join this club before event registration.
              {" "}
              <Link to={`/clubs/${clubId}`} className="font-semibold text-[var(--accent)] underline">
                Open club profile
              </Link>
            </p>
          ) : null}
        </div>
      </article>

      {canManage ? (
        <article className="card fade-in p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Participant Details</h2>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={exportParticipantsCsv}
              disabled={!participants.length}
            >
              Export CSV
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {participants.length ? (
              participants.map((participant, index) => (
                <div
                  key={`${participant.email}-${index}`}
                  className="rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-3"
                >
                  <p className="text-sm font-semibold">{participant.name}</p>
                  <p className="text-xs text-[var(--muted)]">{participant.email}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {participant.department || "Department not provided"} | {participant.year || "Year not provided"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Phone: {participant.phone || "Not provided"} | Registered: {formatDateTime(participant.registeredAt)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No participants yet"
                description="Participant details will appear here after student registrations."
              />
            )}
          </div>
        </article>
      ) : null}

      {registerOpen ? (
        <RegistrationFormModal
          eventTitle={event.title}
          loading={actionLoading}
          onClose={() => setRegisterOpen(false)}
          onSubmit={(payload) => handleRegisterToggle(payload)}
        />
      ) : null}
    </section>
  );
}

export default EventDetailsPage;
