export default function TasksLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading tasks">
      {/* Progress & Add Task header */}
      <div className="card-surface animate-pulse rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-3 w-48 rounded bg-white/5" />
          </div>
          <div className="h-9 w-32 rounded-xl bg-emerald-500/20" />
        </div>
        <div className="mt-4 h-2.5 w-full rounded-full bg-white/5" />
      </div>

      {/* Task Rows */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((t) => (
          <div key={t} className="card-surface animate-pulse rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-5 w-5 shrink-0 rounded-md bg-white/10" />
              <div className="space-y-1.5 min-w-0">
                <div className="h-4 w-48 rounded bg-white/10" />
                <div className="h-3 w-28 rounded bg-white/5" />
              </div>
            </div>
            <div className="h-6 w-16 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
