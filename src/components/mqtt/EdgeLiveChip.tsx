"use client";

import { cn } from "@/lib/utils";
import { useFarm, useFarmStore } from "@/lib/store";
import { toast } from "sonner";

/**
 * EdgeLiveChip — header chip matching Requirement 5:
 *   SIMULATION (terra) / EDGE-LIVE (moss pulse).
 *
 * Single selector useFarm() drives live-or-sim status.
 */
export function edgeChipState(s: {
  mode?: string;
  source?: string;
  isLive?: boolean;
  liveSource?: string;
  mqttStatus?: string;
  mqttLastSeen?: number | null;
}): "sim" | "live" {
  if (s.isLive || s.source === "LIVE") return "live";
  return "sim";
}

export default function EdgeLiveChip({ className }: { className?: string }) {
  const { isLive, source, rssi, settings } = useFarm();
  const mqttStatus = useFarmStore((s) => s.mqttStatus);

  const handleToggle = async () => {
    if (!isLive) {
      const token = settings.mqttToken || "patelfarm01";
      const brokerUrl = settings.mqttBrokerUrl || "wss://broker.emqx.io:8084/mqtt";
      const { connect } = await import("@/lib/mqtt-bridge");
      connect(token, brokerUrl);
      toast.info("Connecting to wireless edge…", {
        description: `Token: ${token} · ${brokerUrl}`,
      });
    } else {
      const { disconnect } = await import("@/lib/mqtt-bridge");
      disconnect();
      const s = useFarmStore.getState();
      s.setSource("SIM");
      s.updateSettings({ mode: "simulation" });
      s.startSimulation();
      toast.info("Switched to simulation mode", {
        description: "Edge disconnected.",
      });
    }
  };

  if (isLive) {
    return (
      <button
        type="button"
        onClick={() => void handleToggle()}
        data-testid="edge-live-chip"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 font-editorial-mono text-[11px] font-bold uppercase tracking-[0.12em] border transition-all cursor-pointer select-none",
          "border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)] shadow-[0_0_12px_rgba(95,139,106,0.2)] hover:border-[var(--moss)] active:scale-95",
          className,
        )}
        title={`Wireless edge live${rssi != null ? ` · WiFi ${rssi} dBm` : ""} — click to disconnect`}
        aria-label="Wireless edge live. Click to disconnect"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#5F8B6A] shadow-[0_0_8px_rgba(95,139,106,0.9)]" />
        EDGE-LIVE
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      data-testid="edge-live-chip"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 font-editorial-mono text-[11px] font-bold uppercase tracking-[0.12em] border transition-all cursor-pointer select-none",
        "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)] hover:border-[var(--terra)] active:scale-95",
        className,
      )}
      title="Simulation mode — click to connect MQTT"
      aria-label="Simulation mode. Click to connect MQTT"
    >
      <span className="h-2 w-2 rounded-full bg-[#C4503A]" />
      SIMULATION
    </button>
  );
}
