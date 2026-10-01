"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useFarmStore } from "@/lib/store";

/**
 * MqttManager — single ESP32 edge supervisor:
 * - Auto-connect on load if settings.autoConnect !== false
 * - LIVE flip: when mqttStatus === "online" AND last msg <5s → source = "LIVE"
 * - SIM fallback: when disconnected OR last msg >=5s → fallback source = "SIM"
 * - Single ESP32 edge telemetry supervisor.
 */
export default function MqttManager() {
  const fallbackToastAt = useRef(0);
  const liveToastAt = useRef(0);
  const initialConnected = useRef(false);

  // Auto-connect on load
  useEffect(() => {
    if (typeof window === "undefined" || initialConnected.current) return;
    initialConnected.current = true;

    const s = useFarmStore.getState();
    const autoConnect = s.settings.autoConnect ?? true;
    if (autoConnect) {
      const token = s.settings.mqttToken || "patelfarm01";
      const brokerUrl = s.settings.mqttBrokerUrl || "wss://broker.emqx.io:8084/mqtt";
      void import("@/lib/mqtt-bridge").then((m) => {
        m.connect(token, brokerUrl);
      });
    }
  }, []);

  // Watchdog supervisor: LIVE when online & last msg <5s, else fallback SIM
  useEffect(() => {
    if (typeof window === "undefined") return;

    const id = setInterval(() => {
      const s = useFarmStore.getState();
      const online = s.mqttStatus === "online";
      const lastSeen = s.live.lastSeenAt ?? s.mqttLastSeen;
      const age = lastSeen != null ? Date.now() - lastSeen : Infinity;
      const fresh = online && age < 5000;
      const inLive = s.source === "LIVE";

      if (fresh && !inLive) {
        // Telemetry fresh (<5s) and online → Go LIVE
        s.setSource("LIVE");
        s.updateSettings({ mode: "live" });
        s.stopSimulation();
        s.stopLivePolling();

        if (Date.now() - liveToastAt.current > 30000) {
          liveToastAt.current = Date.now();
          toast.success("EDGE-LIVE — streaming telemetry", {
            description: "ESP32 edge node connected over MQTT.",
          });
        }
      } else if (inLive && !fresh && s.settings.mode !== "live") {
        // Disconnected or stale (>=5s) and not manually set to live → Fallback to SIMULATION
        s.setSource("SIM");
        s.updateSettings({ mode: "simulation" });
        s.stopLivePolling();
        s.startSimulation();

        if (Date.now() - fallbackToastAt.current > 10000) {
          fallbackToastAt.current = Date.now();
          toast.warning("Edge node offline — simulation resumed");
        }
      }
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return null;
}
