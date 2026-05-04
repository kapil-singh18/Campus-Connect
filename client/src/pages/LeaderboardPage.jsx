import { useState } from "react";
import { TrophyIcon, StarIcon, ZapIcon, UsersIcon } from "../components/icons.jsx";

const STUDENTS = [
  { rank: 1,  name: "Rohan Mehta",    points: 1840, club: "Coding Club",    dept: "CSE", year: "3rd", avatar: "RM", badges: ["🏆","⚡","🎯"], events: 24, streak: 12 },
  { rank: 2,  name: "Priya Sharma",   points: 1720, club: "Design Studio",  dept: "IT",  year: "2nd", avatar: "PS", badges: ["⭐","🎨"],       events: 20, streak: 8  },
  { rank: 3,  name: "Aditya Kumar",   points: 1590, club: "Robotics Club",  dept: "ECE", year: "4th", avatar: "AK", badges: ["🤖","💡"],       events: 18, streak: 7  },
  { rank: 4,  name: "Sneha Joshi",    points: 1420, club: "Drama Society",  dept: "BBA", year: "2nd", avatar: "SJ", badges: ["🎭"],             events: 15, streak: 5  },
  { rank: 5,  name: "Vikram Singh",   points: 1380, club: "Music Band",     dept: "MECH",year: "3rd", avatar: "VS", badges: ["🎵","🎸"],       events: 14, streak: 6  },
  { rank: 6,  name: "Ananya Patel",   points: 1250, club: "Photography",    dept: "CSE", year: "1st", avatar: "AP", badges: ["📷"],             events: 12, streak: 4  },
  { rank: 7,  name: "Kunal Rao",      points: 1180, club: "Debate Club",    dept: "LAW", year: "3rd", avatar: "KR", badges: ["🗣️"],             events: 11, streak: 3  },
  { rank: 8,  name: "Meera Nair",     points: 1090, club: "Coding Club",    dept: "CSE", year: "2nd", avatar: "MN", badges: ["💻"],             events: 10, streak: 2  },
  { rank: 9,  name: "Arjun Das",      points: 980,  club: "Robotics Club",  dept: "EEE", year: "4th", avatar: "AD", badges: [],                 events: 9,  streak: 1  },
  { rank: 10, name: "Tara Mehta",     points: 870,  club: "Dance Society",  dept: "BCA", year: "2nd", avatar: "TM", badges: ["💃"],             events: 8,  streak: 2  },
];

const CLUBS = [
  { rank: 1, name: "Coding Club",   members: 214, events: 18, points: 9820, color: "#2f78c8" },
  { rank: 2, name: "Design Studio", members: 178, events: 12, points: 7640, color: "#1a5fa0" },
  { rank: 3, name: "Robotics Club", members: 152, events: 9,  points: 6480, color: "#0891b2" },
  { rank: 4, name: "Drama Society", members: 130, events: 15, points: 5920, color: "#059669" },
  { rank: 5, name: "Music Band",    members: 118, events: 20, points: 5380, color: "#d97706" },
];

const AVATAR_COLORS = ["#2f78c8","#1a5fa0","#0891b2","#059669","#d97706","#e11d48","#0f766e","#4a7ab5","#b45309","#0369a1"];
const RANK_MEDAL    = { 1: "🥇", 2: "🥈", 3: "🥉" };

function LeaderboardPage() {
  const [tab, setTab] = useState("students");

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "var(--text)" }}>
            🏆 Leaderboard
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Top performers across events and clubs this semester
          </p>
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--panel-muted)", border: "1px solid var(--border)" }}>
          {["students","clubs"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all"
              style={tab === t ? { background: "var(--brand)", color: "#fff" } : { color: "var(--muted)" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      {tab === "students" && (
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[STUDENTS[1], STUDENTS[0], STUDENTS[2]].map((s, i) => {
            const podiumOrder = [2, 1, 3];
            const heights = ["h-24", "h-32", "h-20"];
            const isFirst = podiumOrder[i] === 1;
            return (
              <div key={s.rank} className={`flex flex-col items-center gap-2 fade-in stagger-${i+1}`}>
                {/* Avatar */}
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full text-base font-bold text-white"
                    style={{ background: AVATAR_COLORS[s.rank - 1], boxShadow: isFirst ? "0 8px 24px rgba(79,70,229,0.4)" : "none" }}>
                    {s.avatar}
                  </div>
                  <span className="absolute -top-1 -right-1 text-lg">{RANK_MEDAL[s.rank]}</span>
                </div>
                <p className="text-xs font-bold text-center" style={{ color: "var(--text)" }}>{s.name.split(" ")[0]}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--brand)" }}>{s.points.toLocaleString()} pts</p>
                {/* Podium block */}
                <div className={`w-full ${heights[i]} rounded-t-xl flex items-center justify-center`}
                  style={{ background: isFirst ? "linear-gradient(180deg,#2f78c8,#1a5fa0)" : "var(--panel-muted)", border: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.5rem", color: isFirst ? "#fff" : "var(--muted)" }}>
                    #{podiumOrder[i]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      {tab === "students" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--panel-muted)", borderBottom: "1px solid var(--border)" }}>
                  {["Rank","Student","Department","Club","Events","Streak","Points","Badges"].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STUDENTS.map((s, i) => (
                  <tr key={s.rank}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid var(--border-soft)", background: i % 2 === 0 ? "var(--panel)" : "var(--panel-muted)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--brand-soft)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "var(--panel)" : "var(--panel-muted)"}
                  >
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1rem", color: s.rank <= 3 ? "var(--brand)" : "var(--muted)" }}>
                        {RANK_MEDAL[s.rank] || `#${s.rank}`}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0"
                          style={{ background: AVATAR_COLORS[s.rank - 1] }}>
                          {s.avatar}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text)", whiteSpace: "nowrap" }}>{s.name}</p>
                          <p style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{s.year} Year</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--muted)" }}>{s.dept}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span className="badge badge-brand" style={{ whiteSpace: "nowrap" }}>{s.club}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>{s.events}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ fontSize: "0.8rem", color: s.streak >= 7 ? "var(--success)" : "var(--muted)", fontWeight: 600 }}>
                        🔥 {s.streak}d
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "var(--brand)" }}>
                        {s.points.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ fontSize: "1rem" }}>{s.badges.join(" ") || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clubs tab */}
      {tab === "clubs" && (
        <div className="space-y-3">
          {CLUBS.map((club, i) => (
            <div key={club.rank}
              className="card card-hover p-4 flex flex-wrap items-center gap-4 fade-in"
              style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white font-bold text-lg"
                style={{ background: club.color }}>
                {club.rank <= 3 ? RANK_MEDAL[club.rank] : `#${club.rank}`}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>{club.name}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>👥 {club.members} members</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>📅 {club.events} events</span>
                </div>
              </div>
              {/* Points bar */}
              <div style={{ flexBasis: "200px", flexGrow: 1 }}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Points</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: club.color }}>{club.points.toLocaleString()}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, width: `${(club.points / CLUBS[0].points) * 100}%`, background: club.color, transition: "width 1s ease" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
