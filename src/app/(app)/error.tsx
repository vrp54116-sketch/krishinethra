"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert, Home } from "lucide-react";

export default function AppRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("KrishiNethra app route error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[420px] w-full max-w-lg items-center justify-center p-4">
      <div className="card-surface w-full rounded-3xl border border-red-500/20 bg-red-950/20 p-8 text-center backdrop-blur-xl shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <TriangleAlert className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-xl font-extrabold tracking-tight text-white">
          Something went wrong
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          This section had trouble loading, but your live farm sensors and data are safe.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-[10px] text-zinc-600">
            ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-black transition-all hover:bg-emerald-400 active:scale-95 shadow-[0_0_16px_rgba(34,197,94,0.4)] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
            Retry
          </button>
          <Link
            href="/dashboard"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-white active:scale-95"
          >
            <Home className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
