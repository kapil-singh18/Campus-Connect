import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api/http.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatDateTime } from "../utils/date.js";
import { BellIcon, CheckIcon, ChevronRightIcon } from "../components/icons.jsx";

function JoinRequestsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/clubs/join-requests");
      setRequests(response.data.requests || []);
      setError("");
    } catch (requestError) {
      const message = requestError?.response?.data?.message || "Unable to load join requests.";
      setError(message);
      toast.error(message, "Join Requests");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const groupedRequests = useMemo(() => {
    return requests.reduce((groups, request) => {
      const clubName = request.club?.name || "Unknown Club";
      if (!groups[clubName]) groups[clubName] = [];
      groups[clubName].push(request);
      return groups;
    }, {});
  }, [requests]);

  const handleReview = async (requestId, action) => {
    setBusyId(requestId);
    try {
      await api.patch(`/clubs/join-requests/${requestId}`, { action });
      toast.success(action === "accept" ? "Join request accepted." : "Join request rejected.");
      await loadRequests();
    } catch (requestError) {
      const message = requestError?.response?.data?.message || "Unable to review request.";
      toast.error(message, "Join Requests");
    } finally {
      setBusyId("");
    }
  };

  if (user.role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (user.role !== "manager") {
    return (
      <div className="card p-6">
        <p className="text-sm font-semibold text-[var(--muted)]">Join requests are available to club managers only.</p>
        <Link to="/dashboard" className="btn-secondary mt-4 inline-flex">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-5 fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
            <BellIcon className="h-4 w-4 text-[var(--brand)]" />
            Join Requests
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-[var(--text)]">Manage club membership requests</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Review new requests, accept approved students, or reject incomplete applications.</p>
        </div>
        <Link to="/dashboard" className="btn-secondary">
          Back to dashboard
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Pending Requests</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{requests.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Clubs with Requests</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">{Object.keys(groupedRequests).length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Action Status</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text)]">Live</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((item) => <div key={item} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : error ? (
        <div className="card p-5 text-sm font-semibold text-[var(--danger)]" style={{ background: "var(--danger-soft)" }}>
          {error}
        </div>
      ) : requests.length ? (
        <div className="space-y-5">
          {Object.entries(groupedRequests).map(([clubName, clubRequests]) => (
            <div key={clubName} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--muted)]">{clubName}</h2>
                <span className="badge badge-brand">{clubRequests.length} pending</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {clubRequests.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ borderColor: "var(--border)", background: "var(--panel)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[var(--text)]">
                          {request.studentMeta?.name || request.student?.name || "Student"}
                        </p>
                        <p className="mt-1 truncate text-xs text-[var(--muted)]">
                          {request.studentMeta?.email || request.student?.email || "Email not available"}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">Requested: {formatDateTime(request.createdAt)}</p>
                      </div>
                      <div className="rounded-xl bg-[var(--brand-soft)] p-2 text-[var(--brand)]">
                        <ChevronRightIcon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-[var(--border-soft)] bg-[var(--panel-muted)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Requested Club</p>
                      <p className="mt-1 text-sm font-bold text-[var(--text)]">{request.club?.name || "Unknown Club"}</p>
                      <p className="text-xs text-[var(--muted)]">{request.club?.category || "Club membership"}</p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="btn-primary flex-1 text-xs"
                        disabled={busyId === request.id}
                        onClick={() => handleReview(request.id, "accept")}
                      >
                        <CheckIcon className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn-ghost flex-1 text-xs text-red-600"
                        disabled={busyId === request.id}
                        onClick={() => handleReview(request.id, "reject")}
                      >
                        <span aria-hidden="true">×</span>
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-3 py-14">
          <BellIcon className="h-10 w-10 text-[var(--border)]" />
          <p className="text-base font-bold text-[var(--text)]">No pending join requests</p>
          <p className="text-sm text-[var(--muted)]">Requests from students will appear here when they click Join Club.</p>
        </div>
      )}
    </section>
  );
}

export default JoinRequestsPage;