/**
 * PageSkeleton — on-theme loading skeleton (animate-pulse cards).
 * Used by every loading.tsx so route transitions feel instant and alive.
 */
export default function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5"
      aria-busy="true"
      aria-label="Loading page content"
    >
      {/* Hero strip */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="card-surface animate-pulse rounded-2xl p-5 lg:col-span-1"
          >
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="mt-4 h-8 w-20 rounded-lg bg-emerald-500/20" />
            <div className="mt-3 h-2.5 w-full rounded bg-white/[0.07]" />
            <div className="mt-2 h-2.5 w-2/3 rounded bg-white/[0.07]" />
          </div>
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="card-surface animate-pulse rounded-2xl p-5"
          style={{ animationDelay: `${r * 90}ms` }}
        >
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-36 rounded bg-white/10" />
            <div className="h-6 w-20 rounded-full bg-emerald-500/15" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-white/[0.03] p-3">
                <div className="h-2.5 w-14 rounded bg-white/10" />
                <div className="mt-2 h-5 w-16 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="sr-only">Loading KrishiNethra AI…</p>
    </div>
  );
}
