export default function FertilizerLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading fertilizer calculator">
      {/* Top Banner */}
      <div className="card-surface animate-pulse rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-44 rounded bg-white/10" />
            <div className="h-3 w-64 rounded bg-white/5" />
          </div>
          <div className="h-9 w-40 rounded-xl bg-emerald-500/20" />
        </div>
      </div>

      {/* N-P-K Ratio Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((n) => (
          <div key={n} className="card-surface animate-pulse rounded-2xl p-5 space-y-3">
            <div className="h-3 w-16 rounded bg-white/10" />
            <div className="h-8 w-24 rounded bg-white/15" />
            <div className="h-2 w-full rounded bg-white/10" />
          </div>
        ))}
      </div>

      {/* Recommended Schedule Card */}
      <div className="card-surface animate-pulse rounded-2xl p-5 space-y-3">
        <div className="h-4 w-36 rounded bg-white/10" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.03] p-3" />
          ))}
        </div>
      </div>
    </div>
  );
}
