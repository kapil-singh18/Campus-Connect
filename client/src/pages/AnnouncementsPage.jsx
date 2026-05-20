import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatDateTime } from "../utils/date.js";
import { MegaphoneIcon, PlusIcon } from "../components/icons.jsx";

const emptyForm = { title: "", content: "", club: "" };

function AnnouncementsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const canManage = user.role === "manager" || user.role === "admin";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [announcementRes, clubRes] = await Promise.all([
        api.get("/announcements"),
        canManage ? api.get("/clubs") : Promise.resolve({ data: { clubs: [] } }),
      ]);
      setAnnouncements(announcementRes.data.announcements || []);
      setClubs((clubRes.data.clubs || []).filter((club) => club.canManage || user.role === "admin"));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  }, [canManage, user.role, toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return announcements;
    return announcements.filter((item) =>
      [item.title, item.content, item.club?.name].some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [announcements, search]);

  const startCreate = () => {
    setEditingId("");
    setForm({ ...emptyForm, club: clubs[0]?.id || "" });
    setShowForm(true);
  };

  const startEdit = (announcement) => {
    setEditingId(announcement.id);
    setForm({
      title: announcement.title,
      content: announcement.content,
      club: announcement.club?._id || announcement.club?.id || announcement.club || "",
    });
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/announcements/${editingId}`, {
          title: form.title,
          content: form.content,
        });
        toast.success("Announcement updated.");
      } else {
        await api.post("/announcements", form);
        toast.success("Announcement posted. Club members were notified.");
      }
      setForm(emptyForm);
      setEditingId("");
      setShowForm(false);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      toast.success("Announcement deleted.");
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete announcement.");
    }
  };

  return (
    <section className="space-y-5 fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            <MegaphoneIcon className="h-6 w-6 text-[var(--brand)]" />
            Announcements
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Club updates, notices, and manager posts for active members.
          </p>
        </div>
        {canManage && (
          <button className="btn-primary" type="button" onClick={startCreate}>
            <PlusIcon className="h-4 w-4" />
            Make Announcement
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className="field"
          style={{ maxWidth: 320 }}
          placeholder="Search announcements..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {showForm && canManage && (
        <form className="card p-5 space-y-3" onSubmit={submit}>
          <h2 className="text-base font-bold">{editingId ? "Edit Announcement" : "Make Announcement"}</h2>
          {!editingId && (
            <select
              className="field"
              required
              value={form.club}
              onChange={(event) => setForm((prev) => ({ ...prev, club: event.target.value }))}
            >
              <option value="">Select club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          )}
          <input
            className="field"
            placeholder="Announcement title"
            required
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <textarea
            className="field"
            rows={4}
            placeholder="Write the update for students..."
            required
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
          />
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Post Announcement"}
            </button>
            <button className="btn-ghost" type="button" onClick={() => setShowForm(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((item) => <div key={item} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : filtered.length ? (
        <div className="grid gap-3">
          {filtered.map((announcement) => (
            <article key={announcement.id} className="card card-hover p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="badge badge-brand">{announcement.club?.name || "Club"}</span>
                    <span className="text-xs text-[var(--muted)]">{formatDateTime(announcement.createdAt)}</span>
                  </div>
                  <h2 className="text-base font-extrabold text-[var(--text)]">{announcement.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{announcement.content}</p>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    Posted by {announcement.createdBy?.name || "Club Manager"}
                  </p>
                </div>
                {announcement.canManage || user.role === "admin" ? (
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs" type="button" onClick={() => startEdit(announcement)}>
                      Edit
                    </button>
                    <button className="btn-ghost text-xs text-red-600" type="button" onClick={() => remove(announcement.id)}>
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-2 py-14">
          <MegaphoneIcon className="h-9 w-9 text-[var(--border)]" />
          <p className="font-bold">No announcements yet</p>
          <p className="text-sm text-[var(--muted)]">Updates from joined or managed clubs will appear here.</p>
        </div>
      )}
    </section>
  );
}

export default AnnouncementsPage;
