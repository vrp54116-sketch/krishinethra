export default function CameraLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-2" aria-busy="true" aria-label="Loading leaf scanner">
      <div className="card-surface animate-pulse rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="h-6 w-48 rounded-lg bg-white/10" />
          <div className="h-5 w-28 rounded-full bg-white/10" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-12 rounded-xl bg-white/[0.04]" />
          <div className="h-12 rounded-xl bg-white/[0.04]" />
        </div>
        <div className="mx-auto aspect-square w-full max-w-sm rounded-2xl bg-white/[0.03] border border-white/10" />
      </div>
      <div className="card-surface animate-pulse rounded-2xl p-6 border border-white/10 space-y-3">
        <div className="h-5 w-32 rounded bg-white/10" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      </div>
    </div>
  );
}
