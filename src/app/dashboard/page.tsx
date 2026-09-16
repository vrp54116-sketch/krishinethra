import Link from "next/link";
import { Sprout, ArrowLeft } from "lucide-react";

export default function DashboardPlaceholder() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#000000] px-4">
      <div className="card-surface max-w-md rounded-3xl p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <Sprout className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-emerald-100/60">
          Foundation ready. Full farm dashboard will be built in the next
          milestone.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 px-4 py-2.5 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-500/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to entrance
        </Link>
      </div>
    </main>
  );
}
