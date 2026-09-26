export default function CameraLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading camera">
      {/* Top Bar: Segmented control */}
      <div className="card-surface animate-pulse rounded-2xl p-4">
        <div className="mx-auto max-w-md h-10 rounded-xl bg-black/40 border border-white/10" />
      </div>

      {/* Main Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="card-surface animate-pulse rounded-2xl p-4 lg:col-span-2">
          <div className="aspect-video w-full rounded-xl bg-white/[0.03] flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10" />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-4 w-20 rounded bg-white/10" />
          </div>
        </div>

        {/* Pan-Tilt & Presets */}
        <div className="card-surface animate-pulse rounded-2xl p-5 lg:col-span-1 space-y-4">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="mx-auto h-40 w-40 rounded-full bg-white/[0.04] border border-white/5" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
