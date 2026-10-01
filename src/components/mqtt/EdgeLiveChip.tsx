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
  if (s.isLive || s.source === "LIVE" || s.mode === "live") return "live";
  return "sim";
}

export default function EdgeLiveChip({ className }: { className?: string }) {
  const { isLive, rssi, settings } = useFarm();

  const handleToggle = async () => {
    const s = useFarmStore.getState();
    if (!isLive) {
      s.setSource("LIVE");
      s.updateSettings({ mode: "live" });
      s.stopSimulation();
      const token = settings.mqttToken || "patelfarm01";
      const brokerUrl = settings.mqttBrokerUrl || "wss://broker.emqx.io:8084/mqtt";
      try {
        const { connect } = await import("@/lib/mqtt-bridge");
        connect(token, brokerUrl);
      } catch {
        /* ignore */
      }
      toast.success("Switched to LIVE mode", {
        description: `Connected to edge · Token: ${token}`,
      });
    } else {
      try {
        const { disconnect } = await import("@/lib/mqtt-bridge");
        disconnect();
      } catch {
        /* ignore */
      }
      s.setSource("SIM");
      s.updateSettings({ mode: "simulation" });
      s.startSimulation();
      toast.info("Switched to SIMULATION mode", {
        description: "Virtual farm simulation running.",
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
          "inline-flex items-center justify-center gap-1.5 px-3 py-1 min-w-[108px] font-editorial-mono text-[11px] font-bold uppercase tracking-[0.12em] border transition-all cursor-pointer select-none shrink-0",
          "border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)] shadow-[0_0_12px_rgba(95,139,106,0.2)] hover:border-[var(--moss)] active:scale-95",
          className,
        )}
        title={`Wireless edge live${rssi != null ? ` · WiFi ${rssi} dBm` : ""} — click to switch to simulation`}
        aria-label="Wireless edge live. Click to switch to simulation"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#5F8B6A] shadow-[0_0_8px_rgba(95,139,106,0.9)] shrink-0" />
        <span className="truncate">LIVE</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      data-testid="edge-live-chip"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 px-3 py-1 min-w-[108px] font-editorial-mono text-[11px] font-bold uppercase tracking-[0.12em] border transition-all cursor-pointer select-none shrink-0",
        "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)] hover:border-[var(--terra)] active:scale-95",
        className,
      )}
      title="Simulation mode — click to switch to live"
      aria-label="Simulation mode. Click to switch to live"
    >
      <span className="h-2 w-2 rounded-full bg-[#C4503A] shrink-0" />
      <span className="truncate">SIMULATION</span>
    </button>
  );
}
