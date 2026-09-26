export default function VoiceLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading voice interface">
      {/* Header */}
      <div className="card-surface animate-pulse rounded-2xl p-5 text-center space-y-2">
        <div className="h-5 w-48 mx-auto rounded bg-white/10" />
        <div className="h-3 w-64 mx-auto rounded bg-white/5" />
      </div>

      {/* Voice Orb Area */}
      <div className="card-surface animate-pulse rounded-2xl p-10 flex flex-col items-center justify-center min-h-[300px] space-y-6">
        <div className="h-28 w-28 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-emerald-400/20 animate-ping" />
        </div>
        <div className="h-4 w-40 rounded bg-white/10" />
      </div>

      {/* Suggestions / Recent transcript */}
      <div className="card-surface animate-pulse rounded-2xl p-5 space-y-3">
        <div className="h-4 w-36 rounded bg-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((s) => (
            <div key={s} className="h-12 rounded-xl bg-white/[0.03] p-3" />
          ))}
        </div>
      </div>
    </div>
  );
}
