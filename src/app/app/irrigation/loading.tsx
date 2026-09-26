export default function IrrigationLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading irrigation">
      {/* Pump Hero card */}
      <div className="card-surface animate-pulse rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-3 w-56 rounded bg-white/5" />
          </div>
          <div className="h-10 w-64 rounded-xl bg-black/40 border border-white/10" />
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white/[0.03] p-3" />
          ))}
        </div>
      </div>

      {/* 3 Zone soil moisture cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((z) => (
          <div key={z} className="card-surface animate-pulse rounded-2xl p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded bg-white/10" />
              <div className="h-5 w-16 rounded-full bg-emerald-500/15" />
            </div>
            <div className="h-8 w-20 rounded bg-white/15" />
            <div className="h-2 w-full rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
