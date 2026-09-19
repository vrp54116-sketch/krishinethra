"use client";

import { useEffect } from "react";
import { useFarmStore } from "@/lib/store";

/**
 * First-run demo seeding: if the persisted store is empty (fresh install),
 * backfill a rich exhibition state so a first-time visitor immediately
 * sees a full, alive app. Never overwrites existing user data.
 */
export default function DemoSeedBoot() {
  useEffect(() => {
    try {
      useFarmStore.getState().ensureDemoSeed?.();
      useFarmStore.getState().ensureDailySummaries?.();
    } catch {
      /* seeding must never crash the app */
    }
  }, []);
  return null;
}
