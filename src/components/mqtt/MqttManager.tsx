"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useFarmStore } from "@/lib/store";

/**
 * MqttManager — invisible supervisor for TRUE WIRELESS live mode.
 *
 * - LIVE flip: when mqttStatus === "online" AND a telemetry frame arrived
 *   <5s ago → settings.mode = "live", liveSource = "mqtt" (sim halts).
 * - SIM fallback: when the link drops or telemetry goes stale >5s while we
 *   are in mqtt-live → settings.mode = "simulation", liveSource = "sim"
 *   with toast "Edge node offline — simulation resumed".
 * - LCD mirror: every 3s in EDGE-LIVE, push LCD1/LCD2 status strings so the
 *   field display tracks the app (fire-and-forget).
 *
 * Kill ESP32 power → graceful SIMULATION fallback in <6s; restore → auto LIVE.
 */
export default function MqttManager() {
  const fallbackToastAt = useRef(0);
  const liveToastAt = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = setInterval(() => {
      const s = useFarmStore.getState();
      const online = s.mqttStatus === "online";
      const age =
        s.mqttLastSeen != null ? Date.now() - s.mqttLastSeen : Infinity;
      const fresh = online && age < 5000;
      const inMqttLive = s.settings.mode === "live" && s.liveSource === "mqtt";

      if (fresh && !inMqttLive) {
        // Edge proved fresh → go LIVE automatically.
        s.setLiveSource("mqtt");
        s.updateSettings({ mode: "live" });
        s.stopSimulation();
        s.stopLivePolling();
        if (Date.now() - liveToastAt.current > 30000) {
          liveToastAt.current = Date.now();
          toast.success("EDGE-LIVE — wireless telemetry streaming", {
            description: "ESP32 edge node connected over MQTT.",
          });
        }
      } else if (inMqttLive && !fresh) {
        // Stale or dropped → graceful fallback in <6s.
        s.setLiveSource("sim");
        s.updateSettings({ mode: "simulation" });
        s.stopLivePolling();
        s.startSimulation();
        if (Date.now() - fallbackToastAt.current > 10000) {
          fallbackToastAt.current = Date.now();
          toast.warning("Edge node offline — simulation resumed", {
            description: "No telemetry for 5s. Showing simulated farm.",
          });
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // LCD mirror every 3s in EDGE-LIVE.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = setInterval(() => {
      const s = useFarmStore.getState();
      if (
        s.settings.mode !== "live" ||
        s.liveSource !== "mqtt" ||
        s.mqttStatus !== "online"
      )
        return;
      const t = s.snapshot.tempC.toFixed(1);
      const h = Math.round(s.snapshot.humidity);
      const soil = Math.round(s.snapshot.soilMoistureB);
      const tank = Math.round(s.snapshot.tankLevelPercent);
      const pump = s.pump.running ? "PUMP ON" : "PUMP OFF";
      const l1 = `T${t} H${h}% S${soil}%`.slice(0, 16);
      const l2 = `Tank${tank}% ${pump}`.slice(0, 16);
      void import("@/lib/mqtt-bridge").then((m) => m.cmdLcd(l1, l2));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return null;
}
