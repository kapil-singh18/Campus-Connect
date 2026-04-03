import { Link } from "react-router-dom";

function ClubCard({ club, canJoin, canLeave, onJoin, onLeave, joining }) {
  return (
    <article className="card fade-in flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold">{club.name}</h3>
        <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold">
          {club.category}
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm text-[var(--muted)]">{club.description}</p>
      <p className="mt-4 text-sm">
        <span className="font-semibold">Members:</span> {club.memberCount}
      </p>
      <p className="mt-1 text-sm">
        <span className="font-semibold">Manager:</span> {club.manager?.name || "Not assigned"}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Link to={`/clubs/${club.id}`} className="btn-secondary text-sm">
          View Profile
        </Link>
        {canJoin ? (
          <button type="button" className="btn-primary text-sm" disabled={joining} onClick={onJoin}>
            {joining ? "Joining..." : "Join Club"}
          </button>
        ) : null}
        {canLeave ? (
          <button type="button" className="btn-secondary text-sm" disabled={joining} onClick={onLeave}>
            {joining ? "Updating..." : "Leave Club"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default ClubCard;
