"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Leaf, RotateCcw, TriangleAlert } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log once — never surface stack traces to farmers.
    console.error("KrishiNethra route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-transparent px-4 py-12 text-center">
      <div className="card-surface w-full max-w-md rounded-[20px] p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300 shadow-[0_0_20px_rgba(251,113,133,0.25)]">
          <TriangleAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
          Something wilted
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">
          This page hit an unexpected error — your farm data is safe on this
          device. Try again, or head back to the dashboard.
        </p>
        {error?.digest && (
          <p className="mt-3 font-mono text-[11px] text-[#9CA3AF]">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={reset}
            className="btn-primary-aurora flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-black"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-[#F3F4F6] backdrop-blur-md transition-colors hover:border-[#34D399]/40 hover:text-white"
          >
            <Leaf className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
