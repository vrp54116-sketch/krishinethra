export default function SchemesLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading government schemes">
      {/* Header & Filter pills */}
      <div className="card-surface animate-pulse rounded-2xl p-5 space-y-4">
        <div className="h-5 w-52 rounded bg-white/10" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[0, 1, 2, 3, 4].map((f) => (
            <div key={f} className="h-8 w-24 shrink-0 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>

      {/* Scheme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {[0, 1, 2, 3].map((s) => (
          <div key={s} className="card-surface animate-pulse rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-48 rounded bg-white/10" />
              <div className="h-5 w-20 rounded-full bg-emerald-500/15" />
            </div>
            <div className="h-3 w-full rounded bg-white/5" />
            <div className="h-3 w-3/4 rounded bg-white/5" />
            <div className="pt-2 flex justify-between items-center">
              <div className="h-4 w-28 rounded bg-white/10" />
              <div className="h-8 w-24 rounded-lg bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
