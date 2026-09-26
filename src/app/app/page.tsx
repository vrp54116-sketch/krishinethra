"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFarmStore } from "@/lib/store";
import { useMounted } from "@/components/dashboard/ui";

export default function AppEntryPage() {
  const router = useRouter();
  const mounted = useMounted();
  const onboardingDone = useFarmStore((s) => s.onboardingDone);
  const appPinHash = useFarmStore((s) => s.appPinHash);
  const isAuthenticated = useFarmStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!mounted) return;
    if (onboardingDone && (!appPinHash || isAuthenticated)) {
      router.replace("/app/dashboard");
    } else {
      router.replace("/app/onboarding");
    }
  }, [mounted, onboardingDone, appPinHash, isAuthenticated, router]);

  return (
    <main className="relative flex h-full min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
    </main>
  );
}
