import { Link } from "react-router-dom";
import { formatDateTime, statusClass } from "../utils/date.js";

const registrationStateLabel = {
  open: "Open",
  closed_by_manager: "Closed by manager",
  deadline_passed: "Deadline passed",
  full: "Full",
};

function EventCard({
  event,
  canManage,
  canRegister,
  onRegister,
  onUnregister,
  onEdit,
  onDelete,
  actionLoading,
}) {
  const clubId = event.club?._id || event.club?.id || event.club;
  const needsClubJoin = canRegister && !event.isRegistered && !event.isClubMember;

  return (
    <article className="card fade-in flex h-full flex-col overflow-hidden">
      <img src={event.posterUrl} alt={event.title} className="h-44 w-full object-cover" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold">{event.title}</h3>
          <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${statusClass(event.status)}`}>
            {event.status}
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm text-[var(--muted)]">{event.description}</p>
        <p className="mt-3 text-sm">
          <span className="font-semibold">Date:</span> {formatDateTime(event.date)}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">Venue:</span> {event.venue}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">Category:</span> {event.category}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">Registrations:</span> {event.registrationCount} / {event.maxParticipants}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">Spots Left:</span> {event.spotsLeft ?? "-"}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">Deadline:</span> {formatDateTime(event.registrationDeadline)}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">Registration:</span>{" "}
          {registrationStateLabel[event.registrationState] || "Open"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/events/${event.id}`} className="btn-secondary text-sm">
            Details
          </Link>

          {canRegister && !event.isRegistered ? (
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={actionLoading || !event.registrationOpen || needsClubJoin}
              onClick={() => {
                if (!event.registrationOpen || needsClubJoin) return;
                onRegister();
              }}
            >
              {actionLoading
                ? "Please wait..."
                : needsClubJoin
                  ? "Join Club First"
                  : event.registrationOpen
                  ? "Register"
                  : registrationStateLabel[event.registrationState] || "Closed"}
            </button>
          ) : null}

          {canRegister && event.isRegistered ? (
            <button
              type="button"
              className="btn-secondary text-sm"
              disabled={actionLoading}
              onClick={onUnregister}
            >
              {actionLoading ? "Please wait..." : "Unregister"}
            </button>
          ) : null}

          {canManage ? (
            <>
              <button type="button" className="btn-secondary text-sm" onClick={onEdit}>
                Edit
              </button>
              <button
                type="button"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700"
                onClick={onDelete}
              >
                Delete
              </button>
            </>
          ) : null}
        </div>

        {needsClubJoin && clubId ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Join the club first to register.
            {" "}
            <Link to={`/clubs/${clubId}`} className="font-semibold text-[var(--accent)] underline">
              Open club
            </Link>
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default EventCard;
