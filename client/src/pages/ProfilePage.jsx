import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const initialPasswordState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function ProfilePage() {
  const { user, updateProfile, getErrorMessage } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPasswordForEmail: "",
  });
  const [passwordForm, setPasswordForm] = useState(initialPasswordState);
  const [loadingBasic, setLoadingBasic] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [basicError, setBasicError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: user?.name || "",
      email: user?.email || "",
    }));
  }, [user?.email, user?.name]);

  const onBasicChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitBasic = async (event) => {
    event.preventDefault();
    setBasicError("");
    setLoadingBasic(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        ...(form.email.trim().toLowerCase() !== (user?.email || "").toLowerCase()
          ? { currentPassword: form.currentPasswordForEmail }
          : {}),
      });
      setForm((prev) => ({ ...prev, currentPasswordForEmail: "" }));
      toast.success("Profile details were updated.");
    } catch (error) {
      const message = getErrorMessage(error);
      setBasicError(message);
      toast.error(message, "Profile update failed");
    } finally {
      setLoadingBasic(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    if (passwordForm.newPassword.length < 8) {
      const message = "New password must be at least 8 characters.";
      setPasswordError(message);
      toast.error(message, "Password update failed");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      const message = "New password and confirm password do not match.";
      setPasswordError(message);
      toast.error(message, "Password update failed");
      return;
    }

    setLoadingPassword(true);
    try {
      await updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(initialPasswordState);
      toast.success("Password updated successfully.");
    } catch (error) {
      const message = getErrorMessage(error);
      setPasswordError(message);
      toast.error(message, "Password update failed");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <div className="fade-in">
        <h1 className="text-2xl font-extrabold">Profile Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Manage your account details and password.</p>
      </div>

      <article className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Account Role</p>
        <p className="mt-1 text-sm font-bold capitalize">{user?.role || "-"}</p>
      </article>

      <article className="card p-5">
        <h2 className="text-lg font-bold">Basic Details</h2>
        <form className="mt-4 space-y-3" onSubmit={submitBasic}>
          <label className="block text-sm font-semibold">
            Name
            <input className="field mt-1" name="name" value={form.name} onChange={onBasicChange} required />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input
              className="field mt-1"
              name="email"
              type="email"
              value={form.email}
              onChange={onBasicChange}
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            Current Password
            <input
              className="field mt-1"
              name="currentPasswordForEmail"
              type="password"
              value={form.currentPasswordForEmail}
              onChange={onBasicChange}
              placeholder="Required if changing email"
            />
          </label>
          {basicError ? <p className="text-sm font-semibold text-red-700 dark:text-red-300">{basicError}</p> : null}
          <button type="submit" className="btn-primary" disabled={loadingBasic}>
            {loadingBasic ? "Saving..." : "Save Details"}
          </button>
        </form>
      </article>

      <article className="card p-5">
        <h2 className="text-lg font-bold">Change Password</h2>
        <form className="mt-4 space-y-3" onSubmit={submitPassword}>
          <label className="block text-sm font-semibold">
            Current Password
            <input
              className="field mt-1"
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={onPasswordChange}
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            New Password
            <input
              className="field mt-1"
              name="newPassword"
              type="password"
              minLength={8}
              value={passwordForm.newPassword}
              onChange={onPasswordChange}
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            Confirm New Password
            <input
              className="field mt-1"
              name="confirmPassword"
              type="password"
              minLength={8}
              value={passwordForm.confirmPassword}
              onChange={onPasswordChange}
              required
            />
          </label>
          {passwordError ? <p className="text-sm font-semibold text-red-700 dark:text-red-300">{passwordError}</p> : null}
          <button type="submit" className="btn-primary" disabled={loadingPassword}>
            {loadingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>
      </article>
    </section>
  );
}

export default ProfilePage;
