function SkeletonGrid({ count = 4, cols = "md:grid-cols-2", cardHeight = "h-40" }) {
  return (
    <div className={`grid gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, index) => (
        <article key={`skeleton-${index}`} className={`card animate-pulse p-4 ${cardHeight}`}>
          <div className="h-4 w-24 rounded bg-[var(--border)]" />
          <div className="mt-3 h-3 w-5/6 rounded bg-[var(--border)]" />
          <div className="mt-2 h-3 w-2/3 rounded bg-[var(--border)]" />
          <div className="mt-5 h-8 w-28 rounded-lg bg-[var(--border)]" />
        </article>
      ))}
    </div>
  );
}

export default SkeletonGrid;
