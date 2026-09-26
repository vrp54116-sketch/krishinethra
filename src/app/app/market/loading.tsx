export default function MarketLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading mandi market rates">
      {/* Header & Search */}
      <div className="card-surface animate-pulse rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-44 rounded bg-white/10" />
            <div className="h-3 w-56 rounded bg-white/5" />
          </div>
          <div className="h-10 w-full sm:w-64 rounded-xl bg-black/40 border border-white/10" />
        </div>
      </div>

      {/* Commodity Price Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((m) => (
          <div key={m} className="card-surface animate-pulse rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 rounded bg-white/10" />
              <div className="h-4 w-12 rounded bg-emerald-500/20" />
            </div>
            <div className="h-8 w-28 rounded bg-white/15" />
            <div className="h-3 w-32 rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Market Chart */}
      <div className="card-surface animate-pulse rounded-2xl p-5 min-h-[280px]">
        <div className="h-4 w-40 rounded bg-white/10" />
        <div className="mt-5 h-[200px] rounded-xl bg-white/[0.02]" />
      </div>
    </div>
  );
}
