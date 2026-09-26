export default function AlertsLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading alerts">
      {/* Header & Controls */}
      <div className="card-surface animate-pulse rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-3 w-52 rounded bg-white/5" />
          </div>
          <div className="h-9 w-32 rounded-xl bg-white/10" />
        </div>
      </div>

      {/* Alert Card List */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((a) => (
          <div key={a} className="card-surface animate-pulse rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="h-3 w-3 mt-1 rounded-full bg-amber-400/50 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 w-48 rounded bg-white/10" />
                <div className="h-3 w-20 rounded bg-white/5" />
              </div>
              <div className="h-3.5 w-full rounded bg-white/5" />
              <div className="h-3 w-2/3 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
