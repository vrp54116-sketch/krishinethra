import Link from "next/link";
import { Leaf, MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-transparent px-4 py-12 text-center">
      <div className="card-surface w-full max-w-md rounded-[20px] p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#34D399]/15 text-[#34D399] shadow-[0_0_20px_rgba(52,211,153,0.25)]">
          <MapPinOff className="h-8 w-8" />
        </div>
        <p className="mt-6 font-mono text-sm font-bold text-[#34D399]">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          This plot doesn&apos;t exist
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">
          The page you&apos;re looking for wandered off the farm. Let&apos;s get
          you back to familiar soil.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="btn-primary-aurora flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-black"
          >
            <Leaf className="h-4 w-4" />
            Open dashboard
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-[#F3F4F6] backdrop-blur-md transition-colors hover:border-[#34D399]/40 hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
