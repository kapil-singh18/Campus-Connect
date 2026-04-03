import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import CampusLogo from "../components/CampusLogo.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { LoginIcon, MoonIcon, SunIcon } from "../components/icons.jsx";
import api from "../api/http.js";
import { formatDate } from "../utils/date.js";

const roleCards = [
  {
    role: "Student",
    title: "Explore and Register",
    detail: "Discover clubs, join communities, and register for events in a guided flow.",
  },
  {
    role: "Manager",
    title: "Manage and Track",
    detail: "Run club events, control registrations, and track participant activity in one place.",
  },
  {
    role: "Admin",
    title: "Platform Overview",
    detail: "See complete campus activity with role-aware dashboards and notifications.",
  },
];

const workflowSteps = [
  {
    id: "step-1",
    title: "Create Profile",
    detail: "Sign up with your role and login securely.",
  },
  {
    id: "step-2",
    title: "Explore Campus",
    detail: "Browse clubs and upcoming events with filters.",
  },
  {
    id: "step-3",
    title: "Join and Register",
    detail: "Students join clubs and register for events.",
  },
  {
    id: "step-4",
    title: "Track and Assist",
    detail: "Use dashboard, notifications, and chatbot guidance.",
  },
];

const trustItems = ["Live registrations", "Activity logs", "Manager notifications"];

const fallbackPreview = {
  clubs: [
    {
      id: "fallback-club-1",
      name: "CodeCraft Club",
      category: "Technology",
      description: "Collaborative coding and hackathon practice sessions.",
      memberCount: 0,
    },
    {
      id: "fallback-club-2",
      name: "Campus Culture Collective",
      category: "Cultural",
      description: "Performances, open mic, and cultural event planning.",
      memberCount: 0,
    },
  ],
  events: [
    {
      id: "fallback-event-1",
      title: "Campus Hack Sprint",
      club: "CodeCraft Club",
      date: new Date().toISOString(),
      status: "upcoming",
      venue: "Innovation Lab",
      posterUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1100&q=80",
    },
    {
      id: "fallback-event-2",
      title: "Open Mic Evening",
      club: "Campus Culture Collective",
      date: new Date().toISOString(),
      status: "ongoing",
      venue: "Main Auditorium",
      posterUrl:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1100&q=80",
    },
  ],
};

const categoryPosterMap = {
  technology:
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1100&q=80",
  cultural:
    "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1100&q=80",
  sports:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1100&q=80",
  social:
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=80",
  default:
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1100&q=80",
};

const getClubPoster = (club, events) => {
  const clubName = String(club?.name || "").trim().toLowerCase();
  const linkedEventPoster = (events || []).find(
    (event) =>
      String(event?.club || "")
        .trim()
        .toLowerCase() === clubName && event?.posterUrl
  )?.posterUrl;

  if (linkedEventPoster) return linkedEventPoster;

  const category = String(club?.category || "")
    .trim()
    .toLowerCase();
  return categoryPosterMap[category] || categoryPosterMap.default;
};

function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(fallbackPreview);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [clubSlide, setClubSlide] = useState(0);
  const [eventSlide, setEventSlide] = useState(0);
  const { login, getErrorMessage } = useAuth();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const loadLandingPreview = async () => {
      try {
        const response = await api.get("/public/landing");
        if (!mounted) return;

        const clubs = Array.isArray(response.data?.clubs) ? response.data.clubs.slice(0, 4) : [];
        const events = Array.isArray(response.data?.events) ? response.data.events.slice(0, 4) : [];

        if (clubs.length || events.length) {
          setPreview({
            clubs: clubs.length ? clubs : fallbackPreview.clubs,
            events: events.length ? events : fallbackPreview.events,
          });
        }
      } catch (_error) {
        if (!mounted) return;
        setPreview(fallbackPreview);
      } finally {
        if (mounted) setPreviewLoading(false);
      }
    };

    loadLandingPreview();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const clubsLength = (preview.clubs || []).length || 1;
    const eventsLength = (preview.events || []).length || 1;
    setClubSlide((current) => current % clubsLength);
    setEventSlide((current) => current % eventsLength);
  }, [preview.clubs, preview.events]);

  useEffect(() => {
    const interval = setInterval(() => {
      setClubSlide((current) => current + 1);
      setEventSlide((current) => current + 1);
    }, 5500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach((element, index) => {
      element.classList.add("reveal-on-scroll");
      element.style.setProperty("--reveal-delay", `${Math.min(index * 55, 330)}ms`);
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back!");
      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      const message = getErrorMessage(submitError);
      setError(message);
      toast.error(message, "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const clubs = preview.clubs || [];
  const events = preview.events || [];
  const clubsCount = clubs.length || 1;
  const eventsCount = events.length || 1;
  const activeClub = clubs[clubSlide % clubsCount] || fallbackPreview.clubs[0];
  const activeEvent = events[eventSlide % eventsCount] || fallbackPreview.events[0];

  const moveClubSlide = (direction) => {
    setClubSlide((current) => (current + direction + clubsCount) % clubsCount);
  };

  const moveEventSlide = (direction) => {
    setEventSlide((current) => (current + direction + eventsCount) % eventsCount);
  };

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden pb-5 pt-16 md:pb-7 md:pt-20">
      <header className="fixed left-0 right-0 top-0 z-50 w-screen border-b border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <CampusLogo compact />
            <p className="hidden text-sm font-semibold text-[var(--muted)] sm:block">College Event & Club Manager</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] bg-[var(--panel-muted)] text-[var(--accent)] shadow-sm transition hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--brand)_35%,var(--border))] hover:bg-[var(--brand-soft)]"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <Link to="/login" className="btn-secondary px-4 py-2 text-sm">
              Login
            </Link>
          </div>
        </div>
      </header>

      <div className="card overflow-hidden" data-reveal>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_24rem]">
          <article className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--panel-muted)] px-6 py-7 md:px-8 lg:border-b-0 lg:border-r">
            <div className="pointer-events-none absolute right-6 top-6 h-44 w-44 rounded-full bg-[var(--brand-soft)]/85" />
            <div className="pointer-events-none absolute -right-4 bottom-14 h-24 w-24 rounded-full border border-[var(--border)] bg-[var(--panel)]/70" />
            <div className="pointer-events-none absolute bottom-7 left-8 h-2 w-20 rounded-full bg-[var(--brand)]/30" />
            <div className="pointer-events-none absolute left-12 top-20 h-2 w-2 rounded-full bg-[var(--brand)]/45" />
            <div className="pointer-events-none absolute left-16 top-28 h-2 w-2 rounded-full bg-[var(--brand)]/35" />
            <div className="pointer-events-none absolute left-24 top-24 h-2 w-2 rounded-full bg-[var(--brand)]/25" />

            <div className="relative max-w-2xl">
              <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">
                Calm. Modern. Student-first.
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">Welcome to Campus Connect</h1>
              <p className="mt-4 text-base leading-relaxed text-[var(--muted)] md:text-lg">
                A calm and modern campus platform for clubs, events, and student participation.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] md:text-base">
                Campus Connect keeps activities organized with clean dashboards, guided registrations, and one assistant
                for event planning support.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {trustItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--muted)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <aside className="bg-[var(--panel)] p-5 md:p-6">
            <div className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">
              Secure Access
            </div>
            <h2 className="mt-3 text-2xl font-extrabold">Login</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Welcome back. Continue to your dashboard.</p>

            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold">
                Email
                <input
                  className="field mt-1"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={onChange}
                />
              </label>
              <label className="block text-sm font-semibold">
                Password
                <input
                  className="field mt-1"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={onChange}
                />
              </label>
              {error ? <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}
              <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2" disabled={loading}>
                <LoginIcon />
                <span>{loading ? "Logging in..." : "Login to Campus Connect"}</span>
              </button>
            </form>

            <p className="mt-4 text-sm text-[var(--muted)]">
              New user?{" "}
              <Link className="font-bold text-[var(--text)] underline" to="/signup">
                Create an account
              </Link>
            </p>
          </aside>
        </div>
      </div>

      <div className="card mt-5 relative overflow-hidden p-6 md:p-7" data-reveal>
        <div className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 rounded-full bg-[var(--brand-soft)]/65" />
        <div className="pointer-events-none absolute bottom-8 left-6 h-14 w-14 rounded-full border border-[var(--border)] bg-[var(--panel)]/75" />
        <h2 className="text-xl font-extrabold text-[var(--accent)]">Campus Highlights</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Preview core capabilities before sign in with a clean snapshot of clubs, events, and access roles.
        </p>

        <div className="relative mt-5 grid gap-3 md:grid-cols-3">
          {roleCards.map((item, index) => (
            <article
              key={item.role}
              className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-4 shadow-sm"
              data-reveal
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <span className="pointer-events-none absolute -right-4 -top-4 h-12 w-12 rounded-full bg-[var(--brand-soft)]/80" />
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">{item.role}</p>
              <h3 className="mt-1 text-sm font-extrabold text-[var(--accent)]">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <article className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4" data-reveal>
            <span className="pointer-events-none absolute right-3 top-3 h-1.5 w-14 rounded-full bg-[var(--brand)]/25" />
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[var(--accent)]">Featured Clubs</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-[var(--border)] bg-[var(--panel-muted)] px-2 py-1 text-xs font-bold"
                  onClick={() => moveClubSlide(-1)}
                  disabled={clubs.length < 2}
                  aria-label="Previous club"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className="rounded-md border border-[var(--border)] bg-[var(--panel-muted)] px-2 py-1 text-xs font-bold"
                  onClick={() => moveClubSlide(1)}
                  disabled={clubs.length < 2}
                  aria-label="Next club"
                >
                  &gt;
                </button>
                <Link to="/signup" className="text-xs font-semibold text-[var(--accent)] underline">
                  Join now
                </Link>
              </div>
            </div>

            <article className="relative min-h-[10.5rem] overflow-hidden rounded-lg border border-[var(--border)]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${getClubPoster(activeClub, events)})` }}
              />
              <div className="absolute inset-0 bg-slate-950/52" />
              <div className="relative p-3 text-white">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold">{activeClub.name}</p>
                  <span className="rounded-full border border-white/35 bg-white/15 px-2 py-0.5 text-[11px] font-bold">
                    {activeClub.category}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-white/90">{activeClub.description}</p>
                <p className="mt-1 text-[11px] font-semibold text-white/90">Members: {activeClub.memberCount ?? 0}</p>
              </div>
            </article>

            <div className="mt-3 flex items-center gap-1.5">
              {clubs.map((club, index) => (
                <button
                  key={club.id}
                  type="button"
                  className={`h-2.5 w-2.5 rounded-full border border-[var(--border)] ${index === clubSlide % clubsCount ? "bg-[var(--brand)]" : "bg-[var(--panel-muted)]"
                    }`}
                  onClick={() => setClubSlide(index)}
                  aria-label={`Go to club ${index + 1}`}
                />
              ))}
            </div>

            {previewLoading ? <p className="mt-2 text-xs text-[var(--muted)]">Loading live clubs...</p> : null}
          </article>

          <article className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4" data-reveal>
            <span className="pointer-events-none absolute right-3 top-3 h-1.5 w-14 rounded-full bg-[var(--brand)]/25" />
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[var(--accent)]">Upcoming Events</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-[var(--border)] bg-[var(--panel-muted)] px-2 py-1 text-xs font-bold"
                  onClick={() => moveEventSlide(-1)}
                  disabled={events.length < 2}
                  aria-label="Previous event"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className="rounded-md border border-[var(--border)] bg-[var(--panel-muted)] px-2 py-1 text-xs font-bold"
                  onClick={() => moveEventSlide(1)}
                  disabled={events.length < 2}
                  aria-label="Next event"
                >
                  &gt;
                </button>
                <Link to="/signup" className="text-xs font-semibold text-[var(--accent)] underline">
                  Explore
                </Link>
              </div>
            </div>

            <article className="relative min-h-[10.5rem] overflow-hidden rounded-lg border border-[var(--border)]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${activeEvent.posterUrl || categoryPosterMap.default})` }}
              />
              <div className="absolute inset-0 bg-slate-950/55" />
              <div className="relative p-3 text-white">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold">{activeEvent.title}</p>
                  <span className="rounded-full border border-white/35 bg-white/15 px-2 py-0.5 text-[11px] font-bold uppercase">
                    {activeEvent.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/90">
                  {activeEvent.club} | {activeEvent.venue}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-white/90">{formatDate(activeEvent.date)}</p>
              </div>
            </article>

            <div className="mt-3 flex items-center gap-1.5">
              {events.map((event, index) => (
                <button
                  key={event.id}
                  type="button"
                  className={`h-2.5 w-2.5 rounded-full border border-[var(--border)] ${index === eventSlide % eventsCount ? "bg-[var(--brand)]" : "bg-[var(--panel-muted)]"
                    }`}
                  onClick={() => setEventSlide(index)}
                  aria-label={`Go to event ${index + 1}`}
                />
              ))}
            </div>

            {previewLoading ? <p className="mt-2 text-xs text-[var(--muted)]">Loading live events...</p> : null}
          </article>
        </div>

        <article className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4" data-reveal>
          <h3 className="text-sm font-extrabold text-[var(--accent)]">How Campus Connect Works</h3>
          <div className="mt-4 relative">
            <div className="absolute left-3 top-3 bottom-3 w-px bg-[var(--border)] md:hidden" />
            <div className="absolute left-8 right-8 top-5 hidden h-px bg-[var(--border)] md:block" />
            <div className="grid gap-3 md:grid-cols-4">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="relative rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] p-3 pl-12 md:pl-3 md:pt-11"
                >
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full bg-[var(--brand)] text-xs font-extrabold text-white md:left-1/2 md:top-2.5 md:-translate-x-1/2 md:translate-y-0">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold">{step.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default LoginPage;
