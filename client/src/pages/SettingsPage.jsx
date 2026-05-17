import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { CheckIcon } from "../components/icons.jsx";

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: checked ? "var(--brand)" : "var(--border)",
        position: "relative", transition: "background 0.22s ease", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.22s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function Row({ label, desc, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.15rem" }}>{desc}</p>}
      </div>
      {right}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem 1.5rem" }}>
      <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "var(--text)", margin: "0 0 0.25rem" }}>
        {title}
      </h2>
      <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.75rem" }}>
        {children}
      </div>
    </div>
  );
}

function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notify, setNotify] = useState({ events: true, clubs: true, announcements: true });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: "1.25rem" }} className="fade-in">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.625rem", color: "var(--text)", margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
          Manage your account preferences
        </p>
      </div>

      {/* Appearance */}
      <Section title="Appearance">
        <Row
          label="Dark mode"
          desc="Switch between light and dark themes"
          right={<Toggle checked={theme === "dark"} onChange={toggleTheme} id="toggle-dark" />}
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Row
          label="Event registrations"
          desc="When someone registers for your event"
          right={<Toggle checked={notify.events} onChange={v => setNotify(p => ({ ...p, events: v }))} id="toggle-events" />}
        />
        <Row
          label="Club joins"
          desc="When someone joins your club"
          right={<Toggle checked={notify.clubs} onChange={v => setNotify(p => ({ ...p, clubs: v }))} id="toggle-clubs" />}
        />
        <Row
          label="Announcements"
          desc="Campus-wide announcements"
          right={<Toggle checked={notify.announcements} onChange={v => setNotify(p => ({ ...p, announcements: v }))} id="toggle-announce" />}
        />
      </Section>

      {/* Account */}
      <Section title="Account">
        <Row label="Full name" right={<span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>{user?.name || "—"}</span>} />
        <Row label="Email" right={<span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{user?.email || "—"}</span>} />
        <Row
          label="Role"
          right={
            <span style={{
              padding: "0.25rem 0.6rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700,
              background: "var(--brand-soft)", color: "var(--brand)", textTransform: "capitalize",
            }}>
              {user?.role || "—"}
            </span>
          }
        />
        <div style={{ paddingTop: "0.875rem" }}>
          <a href="/profile" className="btn-secondary" style={{ fontSize: "0.8125rem" }}>Edit Profile</a>
        </div>
      </Section>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} className="btn-primary" style={{ gap: "0.5rem" }}>
          {saved ? <><CheckIcon className="h-4 w-4" /> Saved!</> : "Save preferences"}
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;
