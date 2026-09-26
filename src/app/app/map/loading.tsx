export default function MapLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading map">
      {/* Map header skeleton */}
      <div className="card-surface animate-pulse rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="mt-2 h-3 w-64 rounded bg-white/5" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-xl bg-white/10" />
            <div className="h-8 w-24 rounded-xl bg-emerald-500/20" />
          </div>
        </div>
      </div>

      {/* Large Canvas Viewport */}
      <div className="card-surface animate-pulse rounded-2xl p-3 min-h-[460px] sm:min-h-[520px] flex flex-col justify-between">
        <div className="flex justify-between items-center p-2">
          <div className="h-6 w-32 rounded-full bg-white/10" />
          <div className="h-6 w-20 rounded-full bg-white/10" />
        </div>
        <div className="flex-1 my-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 animate-ping" />
        </div>
        {/* 3 Zone cards preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((z) => (
            <div key={z} className="h-16 rounded-xl bg-white/[0.04] p-3" />
          ))}
        </div>
      </div>
    </div>
  );
}
