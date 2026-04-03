import { useEffect, useState } from "react";

const defaultForm = {
  name: "",
  email: "",
  department: "",
  year: "",
  phone: "",
};

function ClubJoinModal({ open, clubName, initialValues, loading, onClose, onSubmit }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...defaultForm,
      ...(initialValues || {}),
    });
  }, [open, initialValues]);

  if (!open) return null;

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-slate-950/35 px-4">
      <div className="card w-full max-w-md p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-extrabold">Join {clubName}</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">Share basic details before joining this club.</p>
          </div>
          <button
            type="button"
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold">
            Name
            <input className="field mt-1" name="name" required value={form.name} onChange={onChange} />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input className="field mt-1" name="email" type="email" required value={form.email} onChange={onChange} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Department
              <input className="field mt-1" name="department" required value={form.department} onChange={onChange} />
            </label>
            <label className="block text-sm font-semibold">
              Year
              <input className="field mt-1" name="year" required value={form.year} onChange={onChange} />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Phone (Optional)
            <input className="field mt-1" name="phone" value={form.phone} onChange={onChange} />
          </label>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Joining..." : "Confirm Join"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ClubJoinModal;
