export default function AssistantLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading KrishiGPT assistant">
      {/* Header card */}
      <div className="card-surface animate-pulse rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/20" />
          <div className="space-y-1">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-2.5 w-24 rounded bg-emerald-400/30" />
          </div>
        </div>
        <div className="h-8 w-24 rounded-xl bg-white/5" />
      </div>

      {/* Chat messages viewport */}
      <div className="card-surface animate-pulse rounded-2xl p-5 min-h-[440px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 flex-1">
          {/* Bot bubble */}
          <div className="flex gap-3 max-w-[80%]">
            <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-500/20" />
            <div className="rounded-2xl rounded-tl-none bg-white/[0.04] p-3 space-y-2 flex-1">
              <div className="h-3 w-full rounded bg-white/10" />
              <div className="h-3 w-4/5 rounded bg-white/10" />
            </div>
          </div>
          {/* User bubble */}
          <div className="flex justify-end">
            <div className="rounded-2xl rounded-tr-none bg-emerald-500/15 p-3 space-y-2 max-w-[70%] w-56">
              <div className="h-3 w-full rounded bg-emerald-200/20" />
            </div>
          </div>
        </div>

        {/* Input box */}
        <div className="h-12 w-full rounded-2xl bg-black/40 border border-white/10 p-2 flex items-center justify-between">
          <div className="h-4 w-40 rounded bg-white/10 ml-2" />
          <div className="h-8 w-8 rounded-full bg-emerald-500/20" />
        </div>
      </div>
    </div>
  );
}
