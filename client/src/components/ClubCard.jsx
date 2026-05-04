import { Link } from "react-router-dom";

function ClubCard({ club, canJoin, canLeave, onJoin, onLeave, joining, isManaged, isAdmin }) {
  return (
    <article className="card card-hover fade-in flex h-full flex-col p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
            style={{ background: "linear-gradient(135deg,#2f78c8,#1a5fa0)" }}>
            {club.name?.[0]?.toUpperCase() || "C"}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold leading-snug truncate" style={{ color: "var(--text)" }}>{club.name}</h3>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              {club.memberCount ?? 0} member{club.memberCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "var(--brand-soft)", color: "var(--brand)", border: "1px solid var(--glass-border)" }}>
            {club.category}
          </span>
          {isManaged && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: "#ecfdf5", color: "#059669", border: "1px solid rgba(5,150,105,0.2)" }}>
              ⚙ Managed
            </span>
          )}
          {isAdmin && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: "#f0f6ff", color: "#2f78c8", border: "1px solid rgba(47,120,200,0.2)" }}>
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="line-clamp-3 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        {club.description || "No description available."}
      </p>

      {/* Meta */}
      <div className="mt-3 pt-3 border-t border-[var(--border-soft)] space-y-1 text-xs" style={{ color: "var(--muted)" }}>
        <p><span className="font-semibold" style={{ color: "var(--text)" }}>Manager:</span> {club.manager?.name || "Not assigned"}</p>
        {club.isMember && (
          <p className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="font-semibold text-green-600 dark:text-green-400">You're a member</span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link to={`/clubs/${club.id}`} className="btn-secondary text-sm flex-1 justify-center">
          View Profile
        </Link>
        {canJoin && (
          <button type="button" className="btn-primary text-sm flex-1 justify-center" disabled={joining} onClick={onJoin}>
            {joining ? "Joining..." : "Join Club"}
          </button>
        )}
        {canLeave && (
          <button type="button" className="btn-ghost text-sm flex-1 justify-center text-red-600 hover:bg-red-50 hover:text-red-700" disabled={joining} onClick={onLeave}>
            {joining ? "Updating..." : "Leave"}
          </button>
        )}
      </div>
    </article>
  );
}

export default ClubCard;
