function StatCard({ label, value }) {
  return (
    <article className="card fade-in border-[#dce7f5] bg-[#fcfdff] p-4 dark:border-[var(--border)] dark:bg-[var(--panel)]">
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[var(--accent)] dark:text-[var(--text)]">{value}</p>
    </article>
  );
}

export default StatCard;
