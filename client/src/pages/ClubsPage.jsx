import { useEffect, useState } from "react";
import api from "../api/http.js";
import ClubCard from "../components/ClubCard.jsx";
import ClubJoinModal from "../components/ClubJoinModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import SkeletonGrid from "../components/SkeletonGrid.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

function ClubsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [joinTarget, setJoinTarget] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
  });

  const canCreate = user.role === "admin" || user.role === "manager";

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

  useEffect(() => {
    fetchClubs();
  }, []);

  const openJoinModal = (club) => {
    setJoinTarget({
      id: club.id,
      name: club.name,
    });
  };

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
      setError(message);
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
      setError(message);
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
      await fetchClubs();
      toast.success("Club created successfully.");
    } catch (createError) {
      const message = createError?.response?.data?.message || "Unable to create club.";
      setError(message);
      toast.error(message, "Create failed");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="fade-in">
        <h1 className="text-2xl font-extrabold">Clubs</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Discover student communities and join clubs that match your interests.
        </p>
      </div>

      {error ? <p className="card p-4 text-red-700 dark:text-red-300">{error}</p> : null}
      {loading ? <SkeletonGrid count={4} cols="md:grid-cols-2" cardHeight="h-44" /> : null}

      {canCreate ? (
        <form className="card fade-in grid gap-3 p-4 md:grid-cols-4" onSubmit={handleCreateClub}>
          <input
            className="field"
            name="name"
            placeholder="Club name"
            required
            value={form.name}
            onChange={onFormChange}
          />
          <input
            className="field"
            name="category"
            placeholder="Category"
            required
            value={form.category}
            onChange={onFormChange}
          />
          <input
            className="field md:col-span-2"
            name="description"
            placeholder="Short club description"
            required
            value={form.description}
            onChange={onFormChange}
          />
          <button type="submit" className="btn-primary md:col-span-1" disabled={createLoading}>
            {createLoading ? "Creating..." : "Create Club"}
          </button>
        </form>
      ) : null}

      {!loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {clubs.map((club) => {
            const canJoin = user.role === "student";
            return (
              <ClubCard
                key={club.id}
                club={club}
                canJoin={canJoin && !club.isMember}
                canLeave={canJoin && club.isMember}
                joining={busyId === club.id}
                onJoin={() => openJoinModal(club)}
                onLeave={() => handleLeave(club.id)}
              />
            );
          })}
          {!clubs.length ? (
            <div className="md:col-span-2">
              <EmptyState
                title="No clubs available"
                description="Clubs created by admin or managers will show here."
              />
            </div>
          ) : null}
        </div>
      ) : null}

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
