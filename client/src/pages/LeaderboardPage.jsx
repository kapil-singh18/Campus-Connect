import { useEffect, useMemo, useState } from "react";
import api from "../api/http.js";
import { TrophyIcon, StarIcon, ZapIcon, UsersIcon } from "../components/icons.jsx";

const AVATAR_COLORS = ["#2f78c8", "#059669", "#d97706", "#0891b2", "#e11d48", "#0f766e", "#4a7ab5", "#7c3aed"];
const RANK_LABEL = { 1: "1st", 2: "2nd", 3: "3rd" };

function Metric({ icon, label, value }) {
  const MetricIcon = icon;
  return (
    <div className="leaderboard-metric">
      <MetricIcon className="h-4 w-4" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LeaderboardPage() {
  const [tab, setTab] = useState("students");
  const [data, setData] = useState({ students: [], managers: [], clubs: [], generatedFrom: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await api.get("/leaderboard");
        if (alive) {
          setData({
            students: response.data.students || [],
            managers: response.data.managers || [],
            clubs: response.data.clubs || [],
            generatedFrom: response.data.generatedFrom || {},
          });
          setError("");
        }
      } catch {
        if (alive) setError("Leaderboard data could not be loaded right now.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadLeaderboard();
    return () => {
      alive = false;
    };
  }, []);

  const podium = useMemo(() => {
    const [first, second, third] = data.students;
    return [second, first, third].filter(Boolean);
  }, [data.students]);

  const activeRows = tab === "students" ? data.students : tab === "managers" ? data.managers : data.clubs;

  return (
    <div className="leaderboard-page fade-in">
      <div className="leaderboard-header">
        <div>
          <div className="leaderboard-kicker">
            <TrophyIcon className="h-4 w-4" />
            Live campus ranking
          </div>
          <h1>Leaderboard</h1>
          <p>Rankings are calculated from real seeded users, joined clubs, events, and registrations.</p>
        </div>

        <div className="leaderboard-tabs" role="tablist" aria-label="Leaderboard type">
          {["students", "managers", "clubs"].map((item) => (
            <button
              key={item}
              type="button"
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="leaderboard-summary">
        <Metric icon={UsersIcon} label="Students tracked" value={data.generatedFrom.students || 0} />
        <Metric icon={StarIcon} label="Managers ranked" value={data.managers.length || 0} />
        <Metric icon={ZapIcon} label="Registrations" value={data.generatedFrom.registrations || 0} />
      </div>

      {error && <div className="card leaderboard-empty">{error}</div>}

      {loading ? (
        <div className="leaderboard-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card leaderboard-skeleton">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : activeRows.length === 0 ? (
        <div className="card leaderboard-empty">No real activity is available yet. Seed or register users to start ranking.</div>
      ) : (
        <>
          {tab === "students" && podium.length > 0 && (
            <div className="leaderboard-podium" aria-label="Top students">
              {podium.map((student) => {
                const color = AVATAR_COLORS[(student.rank - 1) % AVATAR_COLORS.length];
                return (
                  <article key={student.id} className={`card podium-card rank-${student.rank}`}>
                    <span className="podium-rank">{RANK_LABEL[student.rank] || `#${student.rank}`}</span>
                    <div className="podium-avatar" style={{ background: color }}>{student.avatar}</div>
                    <h2>{student.name}</h2>
                    <p>{student.club}</p>
                    <strong>{student.points.toLocaleString()} pts</strong>
                  </article>
                );
              })}
            </div>
          )}

          {tab === "students" ? (
            <div className="leaderboard-list">
              {data.students.map((student) => {
                const color = AVATAR_COLORS[(student.rank - 1) % AVATAR_COLORS.length];
                return (
                  <article key={student.id} className="card leaderboard-row">
                    <div className="leaderboard-rank">#{student.rank}</div>
                    <div className="leaderboard-avatar" style={{ background: color }}>{student.avatar}</div>
                    <div className="leaderboard-main">
                      <h2>{student.name}</h2>
                      <p>{student.department} - {student.year}</p>
                      <div className="leaderboard-badges">
                        <span>{student.club}</span>
                        {student.badges.map((badge) => <span key={badge}>{badge}</span>)}
                      </div>
                    </div>
                    <div className="leaderboard-stats">
                      <span>{student.events} events</span>
                      <span>{student.clubs} clubs</span>
                      <strong>{student.points.toLocaleString()} pts</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : tab === "managers" ? (
            <div className="leaderboard-list">
              {data.managers.map((manager) => {
                const color = AVATAR_COLORS[(manager.rank - 1) % AVATAR_COLORS.length];
                return (
                  <article key={manager.id} className="card leaderboard-row">
                    <div className="leaderboard-rank">#{manager.rank}</div>
                    <div className="leaderboard-avatar" style={{ background: color }}>{manager.avatar}</div>
                    <div className="leaderboard-main">
                      <h2>{manager.name}</h2>
                      <p>{manager.email}</p>
                      <div className="leaderboard-badges">
                        <span>{manager.clubs} managed clubs</span>
                        <span>{manager.members} members</span>
                      </div>
                    </div>
                    <div className="leaderboard-stats">
                      <span>{manager.events} events</span>
                      <span>{manager.registrations} registrations</span>
                      <strong>{manager.points.toLocaleString()} pts</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="leaderboard-list">
              {data.clubs.map((club) => (
                <article key={club.id} className="card leaderboard-row club-row">
                  <div className="leaderboard-rank">#{club.rank}</div>
                  <div className="leaderboard-main">
                    <h2>{club.name}</h2>
                    <p>{club.category}</p>
                    <div className="club-progress">
                      <span style={{ width: `${(club.points / data.clubs[0].points) * 100}%` }} />
                    </div>
                  </div>
                  <div className="leaderboard-stats">
                    <span>{club.members} members</span>
                    <span>{club.events} events</span>
                    <span>{club.registrations} registrations</span>
                    <strong>{club.points.toLocaleString()} pts</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LeaderboardPage;
