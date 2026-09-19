import Link from "next/link";
import { Leaf, MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12 text-center">
      <div className="card-surface w-full max-w-md rounded-3xl p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.25)]">
          <MapPinOff className="h-8 w-8" />
        </div>
        <p className="mt-6 font-mono text-sm font-bold text-emerald-400">404</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
          This plot doesn&apos;t exist
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          The page you&apos;re looking for wandered off the farm. Let&apos;s get
          you back to familiar soil.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-black transition-colors hover:bg-emerald-400"
          >
            <Leaf className="h-4 w-4" />
            Open dashboard
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-emerald-500/40 hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
