export default function SprayLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading spray advisory">
      {/* Suitability Banner */}
      <div className="card-surface animate-pulse rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-44 rounded bg-white/10" />
            <div className="h-3 w-64 rounded bg-white/5" />
          </div>
          <div className="h-8 w-28 rounded-full bg-emerald-500/20" />
        </div>
      </div>

      {/* Active Plans & Treatments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {[0, 1].map((p) => (
          <div key={p} className="card-surface animate-pulse rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="h-6 w-16 rounded-full bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-xl bg-white/[0.03]" />
              <div className="h-12 rounded-xl bg-white/[0.03]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
