import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { LoginIcon, MoonIcon, SunIcon } from "../components/icons.jsx";
import { CampusLogoMark } from "../components/CampusLogo.jsx";
import api from "../api/http.js";
import { formatDate } from "../utils/date.js";

const fallbackPreview = {
  clubs: [
    { id: "fc1", name: "CodeCraft Club", category: "Technology", description: "Collaborative coding and hackathon sessions.", memberCount: 42 },
    { id: "fc2", name: "Campus Culture Collective", category: "Cultural", description: "Performances, open mic, and cultural planning.", memberCount: 28 },
  ],
  events: [
    { id: "fe1", title: "Campus Hack Sprint", club: "CodeCraft Club", date: new Date().toISOString(), status: "upcoming", venue: "Innovation Lab", posterUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80" },
    { id: "fe2", title: "Open Mic Evening", club: "Campus Culture Collective", date: new Date().toISOString(), status: "ongoing", venue: "Main Auditorium", posterUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80" },
  ],
};

const categoryPosterMap = {
  technology: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
  cultural: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=800&q=80",
  sports: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
  default: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
};

const getClubPoster = (club, events) => {
  const clubName = String(club?.name || "").trim().toLowerCase();
  const linked = (events || []).find(
    (e) => String(e?.club || "").trim().toLowerCase() === clubName && e?.posterUrl
  )?.posterUrl;
  if (linked) return linked;
  const cat = String(club?.category || "").trim().toLowerCase();
  return categoryPosterMap[cat] || categoryPosterMap.default;
};



function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(fallbackPreview);
  const [clubSlide, setClubSlide] = useState(0);
  const [eventSlide, setEventSlide] = useState(0);
  const { login, getErrorMessage } = useAuth();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/public/landing");
        if (!mounted) return;
        const clubs = Array.isArray(res.data?.clubs) ? res.data.clubs.slice(0, 4) : [];
        const events = Array.isArray(res.data?.events) ? res.data.events.slice(0, 4) : [];
        if (clubs.length || events.length) {
          setPreview({ clubs: clubs.length ? clubs : fallbackPreview.clubs, events: events.length ? events : fallbackPreview.events });
        }
      } catch { if (mounted) setPreview(fallbackPreview); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setClubSlide(c => c + 1);
      setEventSlide(e => e + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back!");
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg, "Login failed");
    } finally { setLoading(false); }
  };

  const clubs = preview.clubs || [];
  const events = preview.events || [];
  const cc = clubs.length || 1;
  const ec = events.length || 1;
  const activeClub = clubs[clubSlide % cc] || fallbackPreview.clubs[0];
  const activeEvent = events[eventSlide % ec] || fallbackPreview.events[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Top navigation ─────────────────────────────────────── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: "1px solid var(--border)",
        background: "var(--panel)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <CampusLogoMark size={34} pulse />
            <div>
              <p style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "var(--text)", lineHeight: 1.1 }}>
                Campus<span style={{ color: "var(--brand)" }}>Connect</span>
              </p>
              <p style={{ fontSize: "0.6rem", color: "var(--muted)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>College Hub</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={toggleTheme}
              style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--panel-muted)", color: "var(--muted)", cursor: "pointer", transition: "all 0.2s ease" }}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--brand-soft)"; e.currentTarget.style.color = "var(--brand)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--panel-muted)"; e.currentTarget.style.color = "var(--muted)"; }}
            >
              {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
            <Link to="/login" style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.45rem 1rem", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 600,
              background: "var(--brand)", color: "#fff", border: "none", textDecoration: "none",
              transition: "opacity 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero + Login split ──────────────────────────────────── */}
      <div style={{ paddingTop: 64, maxWidth: 1100, margin: "0 auto", padding: "80px 1.5rem 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "3rem", alignItems: "start", paddingTop: "3.5rem" }}>

          {/* Left — Hero copy */}
          <div>
            <span style={{
              display: "inline-block", padding: "0.25rem 0.75rem",
              borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              background: "var(--brand-soft)", color: "var(--brand)", border: "1px solid var(--glass-border)",
              marginBottom: "1.25rem",
            }}>
              Your campus, organised
            </span>

            <h1 style={{
              fontFamily: "Outfit,sans-serif", fontWeight: 900, lineHeight: 1.1,
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)", color: "var(--text)", margin: 0,
            }}>
              One platform for<br />
              <span style={{ color: "var(--brand)" }}>clubs, events</span><br />
              & everything campus.
            </h1>

            <p style={{ marginTop: "1.25rem", fontSize: "1rem", color: "var(--muted)", lineHeight: 1.7, maxWidth: 480 }}>
              Campus Connect keeps college life organised — from club registrations to event management, all in one calm, modern dashboard.
            </p>

            <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {["Live registrations", "Club management", "Event calendar", "AI assistant"].map(tag => (
                <span key={tag} style={{
                  padding: "0.35rem 0.85rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600,
                  background: "var(--panel)", border: "1px solid var(--border)", color: "var(--muted)",
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Preview cards */}
            <div style={{ marginTop: "2.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {/* Club preview */}
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "var(--panel)" }}>
                <div style={{ padding: "0.75rem 1rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text)" }}>Featured Club</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setClubSlide(c => (c - 1 + cc) % cc)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--border)", background: "var(--panel-muted)", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--muted)" }} disabled={cc < 2}>‹</button>
                    <button onClick={() => setClubSlide(c => (c + 1) % cc)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--border)", background: "var(--panel-muted)", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--muted)" }} disabled={cc < 2}>›</button>
                  </div>
                </div>
                <div style={{ position: "relative", height: 110, background: "#0f172a" }}>
                  <img src={getClubPoster(activeClub, events)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }} />
                  <div style={{ position: "absolute", inset: 0, padding: "0.65rem 0.8rem", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.8125rem", margin: 0 }}>{activeClub.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.7rem", marginTop: 2 }}>{activeClub.category} · {activeClub.memberCount ?? 0} members</p>
                  </div>
                </div>
              </div>

              {/* Event preview */}
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "var(--panel)" }}>
                <div style={{ padding: "0.75rem 1rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text)" }}>Upcoming Event</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setEventSlide(e => (e - 1 + ec) % ec)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--border)", background: "var(--panel-muted)", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--muted)" }} disabled={ec < 2}>‹</button>
                    <button onClick={() => setEventSlide(e => (e + 1) % ec)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--border)", background: "var(--panel-muted)", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--muted)" }} disabled={ec < 2}>›</button>
                  </div>
                </div>
                <div style={{ position: "relative", height: 110, background: "#0f172a" }}>
                  <img src={activeEvent.posterUrl || categoryPosterMap.default} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }} />
                  <div style={{ position: "absolute", inset: 0, padding: "0.65rem 0.8rem", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: "0.8125rem", margin: 0 }}>{activeEvent.title}</p>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.7rem", marginTop: 2 }}>{activeEvent.venue} · {formatDate(activeEvent.date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works — compact */}
            <div style={{ marginTop: "2.5rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.875rem" }}>How it works</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                {[
                  { step: "01", label: "Create Profile" },
                  { step: "02", label: "Explore Campus" },
                  { step: "03", label: "Join & Register" },
                  { step: "04", label: "Track Activity" },
                ].map(({ step, label }) => (
                  <div key={step} style={{ padding: "0.75rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--panel)", textAlign: "center" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--brand)", letterSpacing: "0.05em" }}>{step}</span>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text)", marginTop: 4 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Login form */}
          <div style={{
            borderRadius: 16, border: "1px solid var(--border)", background: "var(--panel)",
            padding: "2rem 1.75rem",
            boxShadow: "0 4px 24px rgba(47,120,200,0.08)",
            position: "sticky", top: 88,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.5rem" }}>
              <CampusLogoMark size={30} />
              <div>
                <p style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "0.875rem", color: "var(--text)", lineHeight: 1.1 }}>Campus Connect</p>
                <p style={{ fontSize: "0.625rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Secure access</p>
              </div>
            </div>

            <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.375rem", color: "var(--text)", margin: 0 }}>Welcome back</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.25rem", marginBottom: "1.5rem" }}>Sign in to your dashboard</p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>Email</span>
                <input
                  className="field"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={onChange}
                  placeholder="you@university.edu"
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>Password</span>
                <input
                  className="field"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={onChange}
                  placeholder="••••••••"
                />
              </label>
              {error && (
                <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--danger)", margin: 0 }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  padding: "0.7rem 1.25rem", borderRadius: 10, fontSize: "0.875rem", fontWeight: 700,
                  background: "var(--brand)", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1, transition: "opacity 0.2s, transform 0.15s ease",
                  marginTop: "0.25rem",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <LoginIcon />
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                New to Campus Connect?{" "}
                <Link to="/signup" style={{ color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>
                  Create account
                </Link>
              </p>
            </div>

            {/* Role info */}
            <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { role: "Student", desc: "Explore clubs & events" },
                { role: "Manager", desc: "Manage club events" },
                { role: "Admin", desc: "Full platform access" },
              ].map(({ role, desc }) => (
                <div key={role} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.625rem", borderRadius: 8, background: "var(--panel-muted)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text)", minWidth: 60 }}>{role}</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{ marginTop: "5rem", borderTop: "1px solid var(--border)", padding: "1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
          © {new Date().getFullYear()} Campus Connect · Built for student communities
        </p>
      </footer>
    </div>
  );
}

export default LoginPage;
