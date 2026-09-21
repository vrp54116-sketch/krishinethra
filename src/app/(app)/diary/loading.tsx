export default function DiaryLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading farm diary">
      {/* Top Banner & Stats */}
      <div className="card-surface animate-pulse rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-44 rounded bg-white/10" />
            <div className="h-3 w-56 rounded bg-white/5" />
          </div>
          <div className="h-9 w-36 rounded-xl bg-emerald-500/20" />
        </div>
      </div>

      {/* Diary Timeline list */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map((d) => (
          <div key={d} className="card-surface animate-pulse rounded-2xl p-4 flex gap-4 items-start">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white/[0.04]" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 w-36 rounded bg-white/10" />
                <div className="h-3 w-20 rounded bg-white/5" />
              </div>
              <div className="h-3 w-full rounded bg-white/5" />
              <div className="h-3 w-2/3 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
