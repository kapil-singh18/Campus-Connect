import { useState } from "react";

const INITIAL_STATE = {
  phone: "",
  department: "",
  year: "",
};

function RegistrationFormModal({ eventTitle, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(INITIAL_STATE);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      phone: form.phone.trim(),
      department: form.department.trim(),
      year: form.year.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/35 p-4">
      <div className="card w-full max-w-lg p-6">
        <h2 className="text-xl font-extrabold">Register for Event</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{eventTitle}</p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold">
            Phone (optional)
            <input
              className="field mt-1"
              name="phone"
              placeholder="9876543210"
              value={form.phone}
              onChange={handleChange}
            />
          </label>
          <label className="block text-sm font-semibold">
            Department
            <input
              className="field mt-1"
              name="department"
              placeholder="Computer Science"
              value={form.department}
              onChange={handleChange}
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            Year
            <select className="field mt-1" name="year" value={form.year} onChange={handleChange} required>
              <option value="">Select year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Registering..." : "Confirm Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrationFormModal;
