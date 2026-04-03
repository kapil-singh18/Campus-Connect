import { useEffect, useState } from "react";

const blankState = {
  club: "",
  title: "",
  description: "",
  category: "",
  date: "",
  registrationDeadline: "",
  maxParticipants: "100",
  venue: "",
  posterUrl: "",
};

const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
};

function EventFormModal({ clubs, initialData, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(blankState);

  useEffect(() => {
    if (!initialData) {
      setForm((prev) => ({ ...blankState, club: clubs[0]?.id || prev.club }));
      return;
    }

    setForm({
      club: initialData.club?._id || initialData.club?.id || initialData.club || "",
      title: initialData.title || "",
      description: initialData.description || "",
      category: initialData.category || "",
      date: toLocalDateTime(initialData.date),
      registrationDeadline: toLocalDateTime(initialData.registrationDeadline),
      maxParticipants: String(initialData.maxParticipants || 100),
      venue: initialData.venue || "",
      posterUrl: initialData.posterUrl || "",
    });
  }, [initialData, clubs]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const eventDate = new Date(form.date);
    const deadline = new Date(form.registrationDeadline);
    if (deadline.getTime() > eventDate.getTime()) {
      window.alert("Registration deadline must be on or before the event date.");
      return;
    }

    await onSubmit({
      ...form,
      date: eventDate.toISOString(),
      registrationDeadline: deadline.toISOString(),
      maxParticipants: Number(form.maxParticipants),
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/35 p-4">
      <div className="card w-full max-w-2xl p-6">
        <h2 className="text-xl font-extrabold">{initialData ? "Edit Event" : "Create Event"}</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold">
            Club
            <select className="field mt-1" name="club" value={form.club} onChange={handleChange} required>
              {clubs.map((club) => (
                <option value={club.id} key={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Title
            <input className="field mt-1" name="title" value={form.title} onChange={handleChange} required />
          </label>

          <label className="block text-sm font-semibold">
            Description
            <textarea
              className="field mt-1 min-h-24"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold">
              Category
              <input
                className="field mt-1"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              />
            </label>
            <label className="block text-sm font-semibold">
              Date
              <input
                className="field field-picker mt-1"
                name="date"
                type="datetime-local"
                value={form.date}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold">
              Registration Deadline
              <input
                className="field field-picker mt-1"
                name="registrationDeadline"
                type="datetime-local"
                value={form.registrationDeadline}
                onChange={handleChange}
                required
              />
            </label>
            <label className="block text-sm font-semibold">
              Max Participants
              <input
                className="field mt-1"
                name="maxParticipants"
                type="number"
                min={1}
                step={1}
                value={form.maxParticipants}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold">
              Venue
              <input className="field mt-1" name="venue" value={form.venue} onChange={handleChange} required />
            </label>
            <label className="block text-sm font-semibold">
              Poster URL
              <input
                className="field mt-1"
                name="posterUrl"
                type="url"
                value={form.posterUrl}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventFormModal;
