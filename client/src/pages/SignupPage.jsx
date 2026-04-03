import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import CampusLogo from "../components/CampusLogo.jsx";
import { useToast } from "../context/ToastContext.jsx";

function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, getErrorMessage } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      toast.success("Account created successfully.");
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      const message = getErrorMessage(submitError);
      setError(message);
      toast.error(message, "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md pt-8">
      <div className="card fade-in relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--brand-soft)]/75" />
        <div className="pointer-events-none absolute bottom-4 left-4 h-2 w-20 rounded-full bg-[var(--brand)]/25" />

        <div className="relative mb-4 flex items-center justify-between gap-3">
          <CampusLogo compact />
          <Link to="/" className="text-xs font-semibold text-[var(--accent)] underline">
            Back to Landing
          </Link>
        </div>

        <h1 className="text-2xl font-extrabold">Create account</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Join clubs and register for events in minutes.</p>
        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold">
            Full Name
            <input className="field mt-1" name="name" required value={form.name} onChange={onChange} />
          </label>
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
              minLength={8}
              required
              value={form.password}
              onChange={onChange}
            />
          </label>
          <label className="block text-sm font-semibold">
            Role
            <select className="field mt-1" name="role" value={form.role} onChange={onChange}>
              <option value="student">Student</option>
              <option value="manager">Club Manager</option>
            </select>
          </label>
          {error ? <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link className="font-bold text-[var(--text)] underline" to="/login">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default SignupPage;
