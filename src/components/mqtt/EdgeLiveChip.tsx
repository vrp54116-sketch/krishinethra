"use client";

import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { toast } from "sonner";

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
  const settings = useFarmStore((s) => s.settings);

  const state = edgeChipState({ mode, liveSource, mqttStatus, mqttLastSeen });

  const handleToggle = async () => {
    if (state === "sim") {
      const token = settings.mqttToken || "patelfarm01";
      const brokerUrl = settings.mqttBrokerUrl || "wss://broker.emqx.io:8084/mqtt";
      const { connect } = await import("@/lib/mqtt-bridge");
      connect(brokerUrl, token);
      toast.info("Connecting to wireless edge…", {
        description: `Token: ${token} · ${brokerUrl}`,
      });
    } else {
      const { disconnect } = await import("@/lib/mqtt-bridge");
      disconnect();
      const s = useFarmStore.getState();
      s.setLiveSource("sim");
      s.updateSettings({ mode: "simulation" });
      s.startSimulation();
      toast.info("Switched to simulation mode", {
        description: "Edge disconnected.",
      });
    }
  };

  if (state === "live") {
    return (
      <button
        type="button"
        onClick={() => void handleToggle()}
        data-testid="edge-live-chip"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold tracking-wider text-[var(--text)] transition-all hover:border-emerald-500/40 cursor-pointer active:scale-95",
          className,
        )}
        title={`Wireless edge live${mqttRssi != null ? ` · WiFi ${mqttRssi} dBm` : ""} — click to disconnect`}
        aria-label="Wireless edge live. Click to disconnect"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.9)]" />
        EDGE-LIVE
      </button>
    );
  }
  if (state === "stale") {
    return (
      <button
        type="button"
        onClick={() => void handleToggle()}
        data-testid="edge-live-chip"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold tracking-wider text-[var(--text)] transition-all hover:border-rose-500/40 cursor-pointer active:scale-95",
          className,
        )}
        title="Edge telemetry stale — click to disconnect"
        aria-label="Edge telemetry stale — click to disconnect"
      >
        <span className="h-2 w-2 rounded-full bg-[#FF453A] shadow-[0_0_8px_rgba(255,69,58,0.7)]" />
        EDGE-LIVE·STALE
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      data-testid="edge-live-chip"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold tracking-wider text-[var(--text-2)] transition-all hover:border-amber-500/40 hover:text-[var(--text)] cursor-pointer active:scale-95",
        className,
      )}
      title="Simulation mode — click to connect MQTT (patelfarm01)"
      aria-label="Simulation mode. Click to connect MQTT token patelfarm01"
    >
      <span className="h-2 w-2 rounded-full bg-[#FBBF24]" />
      SIMULATION
    </button>
  );
}
