import { useState } from "react";
import { InfoIcon, CheckIcon, MegaphoneIcon, PlusIcon } from "../components/icons.jsx";

const ALL_ANNOUNCEMENTS = [
  {
    id: "a1", type: "info", priority: "high",
    title: "Semester Registration Deadline Extended",
    body: "The deadline for semester course registration has been extended to May 15, 2026. All students must complete their registration before the deadline to avoid late fees.",
    author: "Academic Office", time: "2 hours ago", pinned: true, tags: ["Academic"],
  },
  {
    id: "a2", type: "success", priority: "normal",
    title: "🎉 Winners of Spring Hackathon 2026 Announced!",
    body: "Congratulations to Team CodeVerse (Rohan Mehta, Priya Sharma, Aditya Kumar) for winning the Spring Hackathon with their AI-powered campus navigation app. Prizes will be distributed on May 8.",
    author: "Coding Club", time: "1 day ago", pinned: true, tags: ["Events","Awards"],
  },
  {
    id: "a3", type: "warning", priority: "high",
    title: "Venue Change: Campus Cultural Fest",
    body: "Due to construction work, the Cultural Fest venue has been moved from the Open Air Theatre to the Main Ground. All existing registrations remain valid. Entry gates open at 4 PM.",
    author: "Events Team", time: "2 days ago", pinned: false, tags: ["Events"],
  },
  {
    id: "a4", type: "info", priority: "normal",
    title: "New Club Inauguration: Cybersecurity Club",
    body: "We're excited to announce the launch of the CampusConnect Cybersecurity Club! The inaugural session will cover ethical hacking basics. Open to all branches. Register through the Clubs section.",
    author: "Dean of Students", time: "3 days ago", pinned: false, tags: ["Clubs"],
  },
  {
    id: "a5", type: "info", priority: "low",
    title: "Library Hours Extended During Exam Season",
    body: "The central library will remain open until midnight from May 10 to June 5 to support students during examination preparation. Biometric access will be available for all registered students.",
    author: "Library Administration", time: "4 days ago", pinned: false, tags: ["Academic"],
  },
  {
    id: "a6", type: "success", priority: "normal",
    title: "Robotics Team Wins State Championship",
    body: "Our Robotics Club team has won the State-Level Robotics Championship for the third consecutive year. A felicitation ceremony will be held on May 12 in the Main Auditorium.",
    author: "Robotics Club", time: "5 days ago", pinned: false, tags: ["Awards","Clubs"],
  },
  {
    id: "a7", type: "warning", priority: "high",
    title: "Campus Wi-Fi Maintenance — May 6, 2-6 AM",
    body: "Scheduled maintenance will affect campus internet connectivity on May 6 between 2 AM and 6 AM. Please plan accordingly and download any required resources beforehand.",
    author: "IT Department", time: "6 days ago", pinned: false, tags: ["Infrastructure"],
  },
];

const TYPE_CONFIG = {
  info:    { bg: "var(--info-soft)",    color: "var(--info)",    border: "rgba(2,132,199,0.3)",    label: "Info",    icon: "ℹ️" },
  success: { bg: "var(--success-soft)", color: "var(--success)", border: "rgba(5,150,105,0.3)",   label: "Update",  icon: "✅" },
  warning: { bg: "var(--warning-soft)", color: "var(--warning)", border: "rgba(217,119,6,0.3)",   label: "Alert",   icon: "⚠️" },
  danger:  { bg: "var(--danger-soft)",  color: "var(--danger)",  border: "rgba(220,38,38,0.3)",   label: "Urgent",  icon: "🚨" },
};

const PRIORITY_BADGE = {
  high:   { bg: "var(--danger-soft)",   color: "var(--danger)",   label: "High Priority" },
  normal: { bg: "var(--brand-soft)",    color: "var(--brand)",    label: "Normal" },
  low:    { bg: "var(--panel-muted)",   color: "var(--muted)",    label: "Low" },
};

const ALL_TAGS = ["All", "Academic", "Events", "Clubs", "Awards", "Infrastructure"];

function AnnouncementsPage() {
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = ALL_ANNOUNCEMENTS.filter((a) => {
    const matchTag = filter === "All" || a.tags.includes(filter);
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.body.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  const pinned = filtered.filter((a) => a.pinned);
  const rest   = filtered.filter((a) => !a.pinned);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "var(--text)" }}>
            📢 Announcements
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {ALL_ANNOUNCEMENTS.length} announcements · {ALL_ANNOUNCEMENTS.filter((a) => a.priority === "high").length} high priority
          </p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2" style={{ background: "var(--panel)" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.85rem", color: "var(--text)", width: "200px" }}
          />
        </div>
        {/* Tag filters */}
        <div className="flex flex-wrap gap-1.5">
          {ALL_TAGS.map((tag) => (
            <button key={tag} onClick={() => setFilter(tag)}
              className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
              style={filter === tag
                ? { background: "var(--brand)", color: "#fff" }
                : { background: "var(--panel-muted)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            📌 Pinned
          </p>
          <div className="space-y-3">
            {pinned.map((a, i) => (
              <AnnouncementCard key={a.id} a={a} expanded={expanded === a.id} onToggle={() => setExpanded(expanded === a.id ? null : a.id)} delay={i} />
            ))}
          </div>
        </div>
      )}

      {/* Rest */}
      {rest.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              Recent
            </p>
          )}
          <div className="space-y-3">
            {rest.map((a, i) => (
              <AnnouncementCard key={a.id} a={a} expanded={expanded === a.id} onToggle={() => setExpanded(expanded === a.id ? null : a.id)} delay={i} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card flex flex-col items-center py-16 gap-3">
          <span style={{ fontSize: "2.5rem" }}>🔍</span>
          <p style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, color: "var(--text)" }}>No announcements found</p>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Try a different filter or search term</p>
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ a, expanded, onToggle, delay }) {
  const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
  const pCfg = PRIORITY_BADGE[a.priority] || PRIORITY_BADGE.normal;

  return (
    <article
      className="card card-hover fade-in cursor-pointer overflow-hidden"
      style={{ animationDelay: `${delay * 0.06}s`, borderLeft: `3px solid ${cfg.color}` }}
      onClick={onToggle}
    >
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{cfg.icon}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {a.pinned && <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 600 }}>📌 PINNED</span>}
                <span className="badge" style={{ background: pCfg.bg, color: pCfg.color, border: "none", fontSize: "0.6rem" }}>
                  {pCfg.label}
                </span>
                {a.tags.map((tag) => (
                  <span key={tag} className="badge badge-brand" style={{ fontSize: "0.6rem" }}>{tag}</span>
                ))}
              </div>
              <h3 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", lineHeight: 1.3 }}>
                {a.title}
              </h3>
              {!expanded && (
                <p className="mt-1 line-clamp-1" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{a.body}</p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{a.time}</p>
            <p style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.25rem" }}>by {a.author}</p>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 fade-in-fast" style={{ borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text)", lineHeight: 1.7 }}>{a.body}</p>
          </div>
        )}
      </div>
    </article>
  );
}

export default AnnouncementsPage;
