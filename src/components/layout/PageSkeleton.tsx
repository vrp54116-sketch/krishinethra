"use client";

/**
 * PageSkeleton — Apple-style liquid glass loading skeleton with left->right shimmer gradient.
 * Used by loading.tsx so route transitions feel fast, silky, and organic.
 */
export default function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5"
      aria-busy="true"
      aria-label="Loading page content"
    >
      {/* Hero strip with shimmer */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="liquid-glass-card relative overflow-hidden rounded-3xl p-5 border border-white/10"
          >
            {/* Left to right gradient sweep */}
            <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

            <div className="h-3 w-28 rounded-md bg-white/10" />
            <div className="mt-4 h-9 w-24 rounded-xl bg-emerald-500/20" />
            <div className="mt-3 h-2.5 w-full rounded-md bg-white/[0.06]" />
            <div className="mt-2 h-2.5 w-2/3 rounded-md bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Body cards with liquid shimmer */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="liquid-glass-card relative overflow-hidden rounded-3xl p-6 border border-white/10"
          style={{ animationDelay: `${r * 120}ms` }}
        >
          {/* Left to right gradient sweep */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.4s_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          <div className="flex items-center justify-between">
            <div className="h-4 w-44 rounded-md bg-white/10" />
            <div className="h-6 w-24 rounded-full bg-emerald-500/15" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="liquid-glass-pill rounded-2xl bg-white/[0.03] p-3.5 border border-white/5">
                <div className="h-2.5 w-16 rounded bg-white/10" />
                <div className="mt-2 h-6 w-20 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="sr-only">Loading KrishiNethra AI…</p>
    </div>
  );
}
