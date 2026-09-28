"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DiagnosticsCard from "@/components/settings/DiagnosticsCard";

export default function DiagnosticsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-1.5 font-mono text-xs text-[var(--text-2)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>BACK TO SETTINGS</span>
        </Link>
      </div>

      <DiagnosticsCard />
    </div>
  );
}
