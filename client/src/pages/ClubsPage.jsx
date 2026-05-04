import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/http.js";
import ClubCard from "../components/ClubCard.jsx";
import ClubJoinModal from "../components/ClubJoinModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import SkeletonGrid from "../components/SkeletonGrid.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { PlusIcon, SchoolIcon } from "../components/icons.jsx";

const CATEGORIES = ["Tech", "Culture", "Sports", "Arts", "Career", "Science", "Social"];

function ClubsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [joinTarget, setJoinTarget] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [form, setForm] = useState({ name: "", description: "", category: "" });

  const canCreate = user.role === "admin" || user.role === "manager";
  const isAdmin   = user.role === "admin";
  const isManager = user.role === "manager";
  const isStudent = user.role === "student";

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/clubs");
      setClubs(response.data.clubs || []);
      setError("");
    } catch (fetchError) {
      const message = fetchError?.response?.data?.message || "Unable to load clubs.";
      setError(message);
      toast.error(message, "Clubs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClubs(); }, []);

  const openJoinModal = (club) => setJoinTarget({ id: club.id, name: club.name });

  const handleJoin = async (details) => {
    if (!joinTarget?.id) return;
    try {
      setBusyId(joinTarget.id);
      await api.post(`/clubs/${joinTarget.id}/join`, details);
      await fetchClubs();
      setJoinTarget(null);
      toast.success("Joined club successfully.");
    } catch (joinError) {
      const message = joinError?.response?.data?.message || "Unable to join club.";
      toast.error(message, "Join failed");
    } finally {
      setBusyId("");
    }
  };

  const handleLeave = async (clubId) => {
    try {
      setBusyId(clubId);
      await api.delete(`/clubs/${clubId}/join`);
      await fetchClubs();
      toast.success("Left club successfully.");
    } catch (leaveError) {
      const message = leaveError?.response?.data?.message || "Unable to leave club.";
      toast.error(message, "Leave failed");
    } finally {
      setBusyId("");
    }
  };

  const onFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateClub = async (event) => {
    event.preventDefault();
    setCreateLoading(true);
    setError("");
    try {
      await api.post("/clubs", form);
      setForm({ name: "", description: "", category: "" });
      setShowCreateForm(false);
      await fetchClubs();
      toast.success("Club created successfully.");
    } catch (createError) {
      const message = createError?.response?.data?.message || "Unable to create club.";
      toast.error(message, "Create failed");
    } finally {
      setCreateLoading(false);
    }
  };

  // Filter clubs
  const filteredClubs = clubs.filter((club) => {
    const matchQ = !searchQ || club.name?.toLowerCase().includes(searchQ.toLowerCase()) || club.description?.toLowerCase().includes(searchQ.toLowerCase());
    const matchCat = !filterCat || club.category === filterCat;
    return matchQ && matchCat;
  });

  const joinedClubs = clubs.filter((c) => c.isMember);
  const managedClubs = clubs.filter((c) => {
    const managerId = c.manager?._id || c.manager?.id || c.manager;
    return managerId === user.id;
  });

  return (
    <section className="page-section-wide space-y-5">
      {/* ── Page Header ── */}
      <div className="fade-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "var(--text)" }}>
            Clubs
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {isStudent && `You've joined ${joinedClubs.length} club${joinedClubs.length !== 1 ? "s" : ""}. `}
            {isManager && `You manage ${managedClubs.length} club${managedClubs.length !== 1 ? "s" : ""}. `}
            {isAdmin && `${clubs.length} clubs on campus. `}
            Discover communities that match your interests.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowCreateForm((v) => !v)}
          >
            <PlusIcon className="h-4 w-4" />
            {showCreateForm ? "Cancel" : "Create Club"}
          </button>
        )}
      </div>

      {/* ── Role-specific Summary Bar ── */}
      {(isAdmin || isManager) && (
        <div className="fade-in grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Clubs", value: clubs.length, color: "#2f78c8", bg: "#f0f6ff" },
            { label: "My Managed", value: managedClubs.length, color: "#1a5fa0", bg: "#e8f1fb" },
            { label: "Total Members", value: clubs.reduce((a, c) => a + (c.memberCount || 0), 0), color: "#059669", bg: "#ecfdf5" },
            { label: "Categories", value: new Set(clubs.map(c => c.category)).size, color: "#d97706", bg: "#fffbeb" },
          ].map((s) => (
            <div key={s.label} className="card p-4 flex flex-col gap-1" style={{ borderLeft: `3px solid ${s.color}` }}>
              <p className="text-xl font-extrabold" style={{ color: s.color, fontFamily: "Outfit,sans-serif" }}>{s.value}</p>
              <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Club Form (Admin/Manager only) ── */}
      {canCreate && showCreateForm && (
        <form className="card fade-in p-5 space-y-4" onSubmit={handleCreateClub}>
          <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
            🏫 Create New Club
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="field"
              name="name"
              placeholder="Club name *"
              required
              value={form.name}
              onChange={onFormChange}
            />
            <select className="field" name="category" required value={form.category} onChange={onFormChange}>
              <option value="">Select category *</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <textarea
              className="field md:col-span-2"
              name="description"
              placeholder="Club description *"
              rows={2}
              required
              value={form.description}
              onChange={onFormChange}
              style={{ resize: "none" }}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={createLoading}>
              {createLoading ? "Creating..." : "Create Club"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* ── Search & Filter Bar ── */}
      <div className="fade-in flex flex-wrap gap-2">
        <input
          className="field"
          style={{ maxWidth: "280px" }}
          placeholder="Search clubs…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
        <select className="field" style={{ maxWidth: "180px" }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        {(searchQ || filterCat) && (
          <button className="btn-ghost text-sm" onClick={() => { setSearchQ(""); setFilterCat(""); }}>
            Clear filters
          </button>
        )}
        <span className="ml-auto flex items-center text-xs" style={{ color: "var(--muted)" }}>
          {filteredClubs.length} club{filteredClubs.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {error ? <p className="card p-4 text-red-700 dark:text-red-300">{error}</p> : null}
      {loading ? <SkeletonGrid count={4} cols="md:grid-cols-2" cardHeight="h-44" /> : null}

      {/* ── Student: My Clubs section ── */}
      {isStudent && !loading && joinedClubs.length > 0 && (
        <div className="space-y-3">
          <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            My Joined Clubs ({joinedClubs.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {joinedClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                canJoin={false}
                canLeave={true}
                joining={busyId === club.id}
                onLeave={() => handleLeave(club.id)}
                onJoin={() => {}}
              />
            ))}
          </div>
          <hr className="divider" />
        </div>
      )}

      {/* ── Main clubs grid ── */}
      {!loading && (
        <div className="space-y-3">
          {isStudent && joinedClubs.length > 0 && (
            <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Explore More Clubs
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(isStudent ? filteredClubs.filter(c => !c.isMember) : filteredClubs).map((club) => {
              const canJoin = isStudent && !club.isMember;
              const isManaged = isManager && (() => {
                const mid = club.manager?._id || club.manager?.id || club.manager;
                return mid === user.id;
              })();
              return (
                <ClubCard
                  key={club.id}
                  club={club}
                  canJoin={canJoin}
                  canLeave={false}
                  joining={busyId === club.id}
                  onJoin={() => openJoinModal(club)}
                  onLeave={() => {}}
                  isManaged={isManaged}
                  isAdmin={isAdmin}
                />
              );
            })}
            {!filteredClubs.length && (
              <div className="md:col-span-2 xl:col-span-3">
                <EmptyState
                  title={searchQ || filterCat ? "No clubs match your search" : "No clubs available"}
                  description={searchQ || filterCat ? "Try different search terms or clear filters." : "Clubs created by admin or managers will show here."}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <ClubJoinModal
        open={Boolean(joinTarget)}
        clubName={joinTarget?.name || "Club"}
        initialValues={{
          name: user?.name || "",
          email: user?.email || "",
          department: "",
          year: "",
          phone: "",
        }}
        loading={busyId === joinTarget?.id}
        onClose={() => setJoinTarget(null)}
        onSubmit={handleJoin}
      />
    </section>
  );
}

export default ClubsPage;
