import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { CheckIcon } from "../components/icons.jsx";

const NOTIFICATION_OPTIONS = [
  { id: "event_reg",    label: "Event Registrations",     desc: "When someone registers for your event" },
  { id: "club_join",    label: "Club Joins",              desc: "When someone joins your club" },
  { id: "announcements",label: "Announcements",           desc: "Campus-wide announcements" },
  { id: "reminders",    label: "Event Reminders",         desc: "24h before events you've registered for" },
  { id: "leaderboard",  label: "Leaderboard Updates",     desc: "Weekly leaderboard position changes" },
];

const PRIVACY_OPTIONS = [
  { id: "profile_public", label: "Public Profile",        desc: "Make your profile visible to all students" },
  { id: "show_clubs",     label: "Show Club Memberships", desc: "Display clubs on your public profile" },
  { id: "show_events",    label: "Show Event History",    desc: "Display your event attendance history" },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: checked ? "var(--brand)" : "var(--border)",
        position: "relative", transition: "background 0.2s ease", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s ease", display: "block",
        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
      }} />
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-5">
      <h2 className="mb-4" style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState({
    event_reg: true, club_join: true, announcements: true, reminders: true, leaderboard: false,
  });
  const [privacy, setPrivacy] = useState({
    profile_public: true, show_clubs: true, show_events: false,
  });
  const [accentColor, setAccentColor] = useState("blue");
  const [saved, setSaved] = useState(false);

  const COLORS = [
    { id: "blue",    label: "Blue",    hex: "#2f78c8" },
    { id: "steel",   label: "Steel",   hex: "#1a5fa0" },
    { id: "cyan",    label: "Cyan",    hex: "#0891b2" },
    { id: "emerald", label: "Emerald", hex: "#059669" },
    { id: "rose",    label: "Rose",    hex: "#e11d48" },
  ];

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "var(--text)" }}>
          ⚙️ Settings
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Manage your preferences and account settings
        </p>
      </div>

      {/* Appearance */}
      <Section title="🎨 Appearance">
        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}>Dark Mode</p>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.15rem" }}>Toggle between light and dark themes</p>
            </div>
            <Toggle checked={theme === "dark"} onChange={toggleTheme} />
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

          {/* Accent color */}
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)", marginBottom: "0.75rem" }}>Accent Color</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c.id}
                  title={c.label}
                  onClick={() => setAccentColor(c.id)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%", background: c.hex, border: "none", cursor: "pointer",
                    outline: accentColor === c.id ? `3px solid ${c.hex}` : "3px solid transparent",
                    outlineOffset: "2px", transition: "outline 0.15s ease", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {accentColor === c.id && <CheckIcon className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="🔔 Notifications">
        <div className="space-y-4">
          {NOTIFICATION_OPTIONS.map((opt) => (
            <div key={opt.id} className="flex items-center justify-between">
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}>{opt.label}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.1rem" }}>{opt.desc}</p>
              </div>
              <Toggle
                checked={notifications[opt.id]}
                onChange={(v) => setNotifications((prev) => ({ ...prev, [opt.id]: v }))}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Privacy */}
      <Section title="🔒 Privacy">
        <div className="space-y-4">
          {PRIVACY_OPTIONS.map((opt) => (
            <div key={opt.id} className="flex items-center justify-between">
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}>{opt.label}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.1rem" }}>{opt.desc}</p>
              </div>
              <Toggle
                checked={privacy[opt.id]}
                onChange={(v) => setPrivacy((prev) => ({ ...prev, [opt.id]: v }))}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Account info */}
      <Section title="👤 Account">
        <div className="space-y-3">
          {[
            { label: "Full Name",  value: user?.name  || "—" },
            { label: "Email",      value: user?.email || "—" },
            { label: "Role",       value: user?.role  || "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-soft)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text)", fontWeight: 600, textTransform: "capitalize" }}>{value}</span>
            </div>
          ))}
          <div className="pt-2">
            <a href="/profile" className="btn-secondary text-sm">Edit Profile</a>
          </div>
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary gap-2">
          {saved ? <><CheckIcon className="h-4 w-4" /> Saved!</> : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;
