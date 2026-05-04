import { useEffect, useMemo, useState } from "react";
import api from "../api/http.js";
import EventCard from "../components/EventCard.jsx";
import EventCalendar from "../components/EventCalendar.jsx";
import EventFormModal from "../components/EventFormModal.jsx";
import RegistrationFormModal from "../components/RegistrationFormModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import SkeletonGrid from "../components/SkeletonGrid.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { PlusIcon, CalendarIcon, ZapIcon } from "../components/icons.jsx";

function EventsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ q: "", category: "", date: "" });
  const [activeTab, setActiveTab] = useState("all"); // all | registered | managed
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState("");
  const [registrationTarget, setRegistrationTarget] = useState(null);

  const canCreate  = user.role === "admin" || user.role === "manager";
  const canRegister = user.role === "student";
  const isAdmin    = user.role === "admin";
  const isManager  = user.role === "manager";
  const isStudent  = user.role === "student";

  const fetchEvents = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([, value]) => Boolean(value))
      );
      const response = await api.get("/events", { params });
      setEvents(response.data.events || []);
      setError("");
    } catch (fetchError) {
      const message = fetchError?.response?.data?.message || "Unable to load events.";
      setError(message);
      toast.error(message, "Events");
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    if (!canCreate) return;
    try {
      const response = await api.get("/clubs");
      setClubs(response.data.clubs || []);
    } catch { setClubs([]); }
  };

  useEffect(() => { fetchEvents(); fetchClubs(); }, []);

  const availableClubs = useMemo(() => {
    if (user.role === "admin") return clubs;
    return clubs.filter((club) => {
      const managerId = club.manager?._id || club.manager?.id || club.manager;
      return managerId === user.id;
    });
  }, [clubs, user.id, user.role]);

  const categories = useMemo(
    () => Array.from(new Set(events.map((event) => event.category))).sort(),
    [events]
  );

  // Tab-filtered events
  const tabEvents = useMemo(() => {
    if (activeTab === "registered") return events.filter(e => e.isRegistered);
    if (activeTab === "managed") return events.filter(e => e.canManage);
    if (activeTab === "open") return events.filter(e => e.registrationOpen);
    return events;
  }, [events, activeTab]);

  const onFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = async (event) => {
    event.preventDefault();
    await fetchEvents();
  };

  const resetFilters = async () => {
    const next = { q: "", category: "", date: "" };
    setFilters(next);
    await fetchEvents(next);
  };

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (event) => { setEditing(event); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmitEvent = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/events/${editing.id}`, payload);
        toast.success("Event updated successfully.");
      } else {
        await api.post("/events", payload);
        toast.success("Event created successfully.");
      }
      closeModal();
      await fetchEvents();
    } catch (submitError) {
      const message = submitError?.response?.data?.message || "Unable to save event.";
      toast.error(message, "Event save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.delete(`/events/${eventId}`);
      await fetchEvents();
      toast.success("Event deleted successfully.");
    } catch (deleteError) {
      const message = deleteError?.response?.data?.message || "Unable to delete event.";
      toast.error(message, "Delete failed");
    }
  };

  const openRegisterForm = (event) => {
    if (!event.isClubMember) {
      toast.info("Join this event's club first, then you can register.", "Join club required");
      return;
    }
    if (!event.registrationOpen) {
      toast.info("Registration is currently closed for this event.", "Registration closed");
      return;
    }
    setRegistrationTarget(event);
  };

  const closeRegisterForm = () => setRegistrationTarget(null);

  const handleRegister = async (eventId, payload) => {
    setActionId(eventId);
    try {
      await api.post(`/events/${eventId}/register`, payload || {});
      closeRegisterForm();
      await fetchEvents();
      toast.success("Registered for event successfully.");
    } catch (registerError) {
      const message = registerError?.response?.data?.message || "Unable to register for event.";
      toast.error(message, "Registration failed");
    } finally {
      setActionId("");
    }
  };

  const handleUnregister = async (eventId) => {
    setActionId(eventId);
    try {
      await api.delete(`/events/${eventId}/register`);
      await fetchEvents();
      toast.success("Unregistered from event.");
    } catch (registerError) {
      const message = registerError?.response?.data?.message || "Unable to unregister.";
      toast.error(message, "Unregister failed");
    } finally {
      setActionId("");
    }
  };

  const handleCalendarSelect = async (dayKey) => {
    const nextDate = filters.date === dayKey ? "" : dayKey;
    const nextFilters = { ...filters, date: nextDate };
    setFilters(nextFilters);
    await fetchEvents(nextFilters);
  };

  // Summary counts
  const registeredCount = events.filter(e => e.isRegistered).length;
  const managedCount    = events.filter(e => e.canManage).length;
  const openCount       = events.filter(e => e.registrationOpen).length;

  // Tabs per role
  const tabs = [
    { id: "all",        label: "All Events",    count: events.length },
    ...(isStudent  ? [{ id: "registered", label: "My Registrations", count: registeredCount }] : []),
    ...(isStudent  ? [{ id: "open",       label: "Open Now",          count: openCount }] : []),
    ...(canCreate  ? [{ id: "managed",    label: "Managed by Me",     count: managedCount }] : []),
  ];

  return (
    <section className="page-section-wide space-y-5">
      {/* ── Page Header ── */}
      <div className="fade-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "var(--text)" }}>
            Events
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {isStudent && `You're registered for ${registeredCount} event${registeredCount !== 1 ? "s" : ""}. `}
            {canCreate && `You manage ${managedCount} event${managedCount !== 1 ? "s" : ""}. `}
            {openCount > 0 && `${openCount} event${openCount !== 1 ? "s" : ""} open for registration.`}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            className="btn-primary"
            onClick={openCreate}
            disabled={!availableClubs.length}
            title={!availableClubs.length ? "No clubs available to create events for" : ""}
          >
            <PlusIcon className="h-4 w-4" />
            Create Event
          </button>
        )}
      </div>

      {/* ── Role Summary Stats ── */}
      {!loading && (
        <div className="fade-in grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Events",   value: events.length,    color: "#2f78c8", bg: "#f0f6ff", icon: "📅" },
            { label: "Open for Reg.",  value: openCount,        color: "#059669", bg: "#ecfdf5", icon: "✅" },
            ...(isStudent ? [{ label: "Registered",   value: registeredCount, color: "#1a5fa0", bg: "#e8f1fb", icon: "🎫" }] : []),
            ...(canCreate ? [{ label: "Managed",      value: managedCount,    color: "#d97706", bg: "#fffbeb", icon: "⚙" }] : []),
          ].map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-xl font-extrabold" style={{ color: s.color, fontFamily: "Outfit,sans-serif" }}>{s.value}</p>
                <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="fade-in flex gap-0 border-b border-[var(--border)] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5"
            style={{
              color: activeTab === tab.id ? "var(--brand)" : "var(--muted)",
              borderBottom: activeTab === tab.id ? "2px solid var(--brand)" : "2px solid transparent",
              background: "transparent",
            }}
          >
            {tab.label}
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                background: activeTab === tab.id ? "var(--brand-soft)" : "var(--panel-muted)",
                color: activeTab === tab.id ? "var(--brand)" : "var(--muted)",
              }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <form className="card fade-in grid gap-3 p-4 lg:grid-cols-[1.2fr_0.9fr_0.8fr_auto]" onSubmit={applyFilters}>
        <input
          className="field"
          name="q"
          placeholder="Search event name"
          value={filters.q}
          onChange={onFilterChange}
        />
        <select className="field" name="category" value={filters.category} onChange={onFilterChange}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <input
          className="field"
          name="date"
          type="date"
          value={filters.date}
          onChange={onFilterChange}
        />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary w-full">Apply</button>
          <button type="button" className="btn-secondary w-full" onClick={resetFilters}>Reset</button>
        </div>
      </form>

      {error ? <p className="card p-4 text-red-700 dark:text-red-300">{error}</p> : null}
      {loading ? <SkeletonGrid count={4} cols="md:grid-cols-2" cardHeight="h-56" /> : null}

      {!loading && (
        <>
          {/* Student: Registration reminder */}
          {isStudent && activeTab === "all" && events.some(e => !e.isClubMember && e.registrationOpen) && (
            <div className="fade-in rounded-xl p-3 flex items-center gap-3"
              style={{ background: "#f0f6ff", border: "1px solid rgba(47,120,200,0.2)" }}>
              <span className="text-lg">💡</span>
              <p className="text-sm" style={{ color: "#1a5fa0" }}>
                <strong>Tip:</strong> Join a club first to register for its events. Look for the "Join Club First" button.
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tabEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                canManage={Boolean(event.canManage)}
                canRegister={canRegister}
                actionLoading={actionId === event.id}
                onRegister={() => openRegisterForm(event)}
                onUnregister={() => handleUnregister(event.id)}
                onEdit={() => openEdit(event)}
                onDelete={() => handleDeleteEvent(event.id)}
              />
            ))}
          </div>

          {!tabEvents.length && (
            <EmptyState
              title={activeTab !== "all" ? `No ${activeTab} events` : "No events found"}
              description={
                activeTab === "registered" ? "You haven't registered for any events yet." :
                activeTab === "managed" ? "You don't manage any events yet." :
                "Try changing search, category, or date filters."
              }
              action={
                activeTab === "all" && (
                  <button type="button" className="btn-secondary text-sm" onClick={resetFilters}>
                    Reset filters
                  </button>
                )
              }
            />
          )}

          <EventCalendar events={events} selectedDate={filters.date} onSelectDate={handleCalendarSelect} />
        </>
      )}

      {modalOpen && (
        <EventFormModal
          clubs={availableClubs}
          initialData={editing}
          onClose={closeModal}
          onSubmit={handleSubmitEvent}
          loading={submitting}
        />
      )}

      {registrationTarget && (
        <RegistrationFormModal
          eventTitle={registrationTarget.title}
          loading={actionId === registrationTarget.id}
          onClose={closeRegisterForm}
          onSubmit={(payload) => handleRegister(registrationTarget.id, payload)}
        />
      )}
    </section>
  );
}

export default EventsPage;
