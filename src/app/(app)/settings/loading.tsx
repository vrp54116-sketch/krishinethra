export default function SettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading settings">
      {/* Profile Card */}
      <div className="card-surface animate-pulse rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/10 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 rounded bg-white/10" />
            <div className="h-3.5 w-36 rounded bg-white/5" />
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      {[0, 1, 2].map((s) => (
        <div key={s} className="card-surface animate-pulse rounded-2xl p-5 space-y-4">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="space-y-3">
            {[0, 1].map((r) => (
              <div key={r} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-40 rounded bg-white/10" />
                  <div className="h-2.5 w-56 rounded bg-white/5" />
                </div>
                <div className="h-6 w-11 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
