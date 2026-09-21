"use client";

import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";

/**
 * EdgeLiveChip — header mode chip with three states:
 *   SIMULATION (amber) / EDGE-LIVE (emerald pulse) / EDGE-LIVE·STALE (rose).
 *
 * EDGE-LIVE = settings.mode live + mqtt online + telemetry fresh <5s.
 * STALE     = mqtt-live but no fresh frame (watchdog is about to fall back).
 */
export function edgeChipState(s: {
  mode: string;
  liveSource: string;
  mqttStatus: string;
  mqttLastSeen: number | null;
}): "sim" | "live" | "stale" {
  if (s.mode !== "live" || s.liveSource !== "mqtt") return "sim";
  if (s.mqttStatus !== "online") return "stale";
  const age = s.mqttLastSeen != null ? Date.now() - s.mqttLastSeen : Infinity;
  return age < 5000 ? "live" : "stale";
}

export default function EdgeLiveChip({ className }: { className?: string }) {
  const mode = useFarmStore((s) => s.settings.mode);
  const liveSource = useFarmStore((s) => s.liveSource);
  const mqttStatus = useFarmStore((s) => s.mqttStatus);
  const mqttLastSeen = useFarmStore((s) => s.mqttLastSeen);
  const mqttRssi = useFarmStore((s) => s.mqttRssi);

  const state = edgeChipState({ mode, liveSource, mqttStatus, mqttLastSeen });

  if (state === "live") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-bold tracking-wider text-emerald-200",
          className,
        )}
        title={`Wireless edge live${mqttRssi != null ? ` · WiFi ${mqttRssi} dBm` : ""}`}
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        EDGE-LIVE
      </span>
    );
  }
  if (state === "stale") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-rose-400/50 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-bold tracking-wider text-rose-200",
          className,
        )}
        title="Edge telemetry stale — falling back to simulation"
      >
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        EDGE-LIVE·STALE
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-bold tracking-wider text-amber-300",
        className,
      )}
      title="Simulation mode — connect the wireless edge in Settings"
    >
      <span className="h-2 w-2 rounded-full bg-amber-400" />
      SIMULATION
    </span>
  );
}
