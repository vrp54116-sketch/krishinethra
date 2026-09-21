export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading dashboard">
      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card-surface animate-pulse rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 rounded bg-white/10" />
              <div className="h-6 w-16 rounded-full bg-emerald-500/20" />
            </div>
            <div className="mt-4 h-9 w-24 rounded-lg bg-white/15" />
            <div className="mt-3 h-2.5 w-full rounded bg-white/[0.07]" />
            <div className="mt-2 h-2.5 w-2/3 rounded bg-white/[0.07]" />
          </div>
        ))}
      </div>

      {/* Main Grid: Farm map & quick controls */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="card-surface animate-pulse rounded-2xl p-5 lg:col-span-2 min-h-[340px]">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-6 w-24 rounded-full bg-white/10" />
          </div>
          <div className="mt-5 h-[260px] rounded-xl bg-white/[0.03]" />
        </div>
        <div className="card-surface animate-pulse rounded-2xl p-5 lg:col-span-1 min-h-[340px]">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((j) => (
              <div key={j} className="h-16 rounded-xl bg-white/[0.04] p-3" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="card-surface animate-pulse rounded-2xl p-5">
        <div className="h-4 w-40 rounded bg-white/10" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="h-20 rounded-xl bg-white/[0.03] p-3" />
          ))}
        </div>
      </div>
    </div>
  );
}
