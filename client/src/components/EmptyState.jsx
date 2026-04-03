function EmptyState({ title = "Nothing to show", description = "", action = null }) {
  return (
    <article className="card p-6 text-center">
      <div className="mx-auto h-12 w-12 rounded-full border border-[var(--border)] bg-[var(--panel-muted)]" />
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      {description ? <p className="mx-auto mt-1 max-w-xl text-sm text-[var(--muted)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </article>
  );
}

export default EmptyState;
