"use client";

import { TriangleAlert } from "lucide-react";
import { useFarmStore } from "@/lib/store";

/**
 * EdgeStaleBanner — hardware-safety banner shown on dashboard + irrigation
 * when telemetry.stale === 1 (the sensor node went silent; edge AI has
 * locked auto-irrigation as a hardware safety measure).
 */
export default function EdgeStaleBanner() {
  const edgeStale = useFarmStore((s) => s.edgeStale);
  const liveSource = useFarmStore((s) => s.liveSource);
  if (!edgeStale || liveSource !== "mqtt") return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
        <TriangleAlert className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-rose-200">
          Sensor node silent — edge AI has locked auto-irrigation (hardware safety).
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-rose-200/70">
          The ESP32 reports stale sensors. Manual pump commands still work, but
          auto-irrigation stays locked until fresh readings resume.
        </p>
      </div>
    </div>
  );
}
