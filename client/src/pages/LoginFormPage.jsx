import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CampusLogo from "../components/CampusLogo.jsx";
import { LoginIcon } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

function LoginFormPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, getErrorMessage } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <section className="mx-auto max-w-md pt-8">
      <div className="card fade-in relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--brand-soft)]/75" />
        <div className="pointer-events-none absolute bottom-4 left-4 h-2 w-20 rounded-full bg-[var(--brand)]/25" />

        <div className="relative">
          <div className="mb-4 flex items-center justify-between gap-3">
            <CampusLogo compact />
            <Link to="/" className="text-xs font-semibold text-[var(--accent)] underline">
              Back to Landing
            </Link>
          </div>

          <h1 className="text-2xl font-extrabold">Login</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Continue to your Campus Connect dashboard.</p>

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
        </div>
      </div>
    </section>
  );
}

export default LoginFormPage;
