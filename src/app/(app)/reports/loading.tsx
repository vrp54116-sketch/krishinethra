export default function ReportsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading reports">
      {/* Header with Segmented Control & buttons */}
      <div className="card-surface animate-pulse rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-44 rounded bg-white/10" />
            <div className="h-3 w-64 rounded bg-white/5" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="h-10 w-full sm:w-72 rounded-xl bg-black/40 border border-white/10" />
            <div className="h-10 w-24 rounded-xl bg-emerald-500/20" />
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="card-surface animate-pulse rounded-2xl p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="h-8 w-24 rounded bg-white/15" />
            <div className="h-2 w-16 rounded bg-emerald-400/20" />
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {[0, 1].map((c) => (
          <div key={c} className="card-surface animate-pulse rounded-2xl p-5 min-h-[260px]">
            <div className="h-4 w-36 rounded bg-white/10" />
            <div className="mt-5 h-[180px] rounded-xl bg-white/[0.02]" />
          </div>
        ))}
      </div>
    </div>
  );
}
