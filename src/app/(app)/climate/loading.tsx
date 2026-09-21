export default function ClimateLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading climate">
      {/* Hero Weather Card */}
      <div className="card-surface animate-pulse rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-10 w-28 rounded-lg bg-emerald-500/20" />
            <div className="h-3 w-48 rounded bg-white/5" />
          </div>
          <div className="h-16 w-16 rounded-full bg-white/5" />
        </div>
      </div>

      {/* Sensor Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card-surface animate-pulse rounded-2xl p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="h-7 w-16 rounded bg-white/15" />
            <div className="h-2 w-full rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Chart Card */}
      <div className="card-surface animate-pulse rounded-2xl p-5 min-h-[260px]">
        <div className="h-4 w-36 rounded bg-white/10" />
        <div className="mt-5 h-[180px] rounded-xl bg-white/[0.02]" />
      </div>
    </div>
  );
}
