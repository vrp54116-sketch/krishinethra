import type { Metadata } from "next";
import Link from "next/link";
import { Leaf, WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline • KrishiNethra AI",
  description: "You are offline — your farm data is safe on this device.",
};

export default function OfflinePage() {
  return (
    <main className="flex h-full overflow-y-auto flex-col items-center justify-center bg-transparent px-4 py-12 text-center">
      <div className="card-surface w-full max-w-md rounded-[20px] p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#34D399]/15 text-[#34D399] shadow-[0_0_20px_rgba(52,211,153,0.25)]">
          <WifiOff className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
          You&apos;re offline
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">
          No internet connection — but your farm data lives on this device, so
          KrishiNethra keeps working. Reconnect anytime for live weather and
          Telegram alerts.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="btn-primary-aurora flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-black"
          >
            <Leaf className="h-4 w-4" />
            Open Dashboard offline
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-[#F3F4F6] backdrop-blur-md transition-colors hover:border-[#34D399]/40 hover:text-white"
          >
            Back to home
          </Link>
        </div>
        <p className="mt-4 text-[11px] text-[#9CA3AF]">
          Cached app shell · live data from localStorage
        </p>
      </div>
    </main>
  );
}
