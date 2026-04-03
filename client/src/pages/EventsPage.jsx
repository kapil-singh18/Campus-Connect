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

function EventsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    date: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState("");
  const [registrationTarget, setRegistrationTarget] = useState(null);

  const canCreate = user.role === "admin" || user.role === "manager";
  const canRegister = user.role === "student";

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
    } catch (_error) {
      setClubs([]);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchClubs();
  }, []);

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

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (event) => {
    setEditing(event);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

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
      setError(message);
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
      setError(message);
      toast.error(message, "Delete failed");
    }
  };

  const openRegisterForm = (event) => {
    if (!event.isClubMember) {
      const message = "Join this event's club first, then you can register.";
      setError(message);
      toast.info(message, "Join club required");
      return;
    }
    if (!event.registrationOpen) {
      const message = "Registration is currently closed for this event.";
      setError(message);
      toast.info(message, "Registration closed");
      return;
    }
    setRegistrationTarget(event);
  };

  const closeRegisterForm = () => {
    setRegistrationTarget(null);
  };

  const handleRegister = async (eventId, payload) => {
    setActionId(eventId);
    try {
      await api.post(`/events/${eventId}/register`, payload || {});
      closeRegisterForm();
      await fetchEvents();
      toast.success("Registered for event successfully.");
    } catch (registerError) {
      const message = registerError?.response?.data?.message || "Unable to register for event.";
      setError(message);
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
      setError(message);
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

  return (
    <section className="space-y-5">
      <div className="fade-in flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Events</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Search and filter by name, category, or date.
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            className="btn-primary"
            onClick={openCreate}
            disabled={!availableClubs.length}
          >
            Create Event
          </button>
        ) : null}
      </div>

      <form className="card fade-in grid gap-3 p-4 md:grid-cols-4" onSubmit={applyFilters}>
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
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input
          className="field field-picker"
          name="date"
          type="date"
          value={filters.date}
          onChange={onFilterChange}
        />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary w-full">
            Apply
          </button>
          <button type="button" className="btn-secondary w-full" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </form>

      {error ? <p className="card p-4 text-red-700 dark:text-red-300">{error}</p> : null}
      {loading ? <SkeletonGrid count={4} cols="md:grid-cols-2" cardHeight="h-56" /> : null}

      {!loading ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
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

          {!events.length ? (
            <EmptyState
              title="No events found"
              description="Try changing search, category, or date filters."
              action={
                <button type="button" className="btn-secondary text-sm" onClick={resetFilters}>
                  Reset filters
                </button>
              }
            />
          ) : null}

          <EventCalendar events={events} selectedDate={filters.date} onSelectDate={handleCalendarSelect} />
        </>
      ) : null}

      {modalOpen ? (
        <EventFormModal
          clubs={availableClubs}
          initialData={editing}
          onClose={closeModal}
          onSubmit={handleSubmitEvent}
          loading={submitting}
        />
      ) : null}

      {registrationTarget ? (
        <RegistrationFormModal
          eventTitle={registrationTarget.title}
          loading={actionId === registrationTarget.id}
          onClose={closeRegisterForm}
          onSubmit={(payload) => handleRegister(registrationTarget.id, payload)}
        />
      ) : null}
    </section>
  );
}

export default EventsPage;
