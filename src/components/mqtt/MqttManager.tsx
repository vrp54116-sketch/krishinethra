"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useFarmStore } from "@/lib/store";

/**
 * MqttManager — ESP8266/ESP32 edge supervisor:
 * - Auto-connect on load if settings.autoConnect !== false
 * - Feeds live slice from onTelemetry
 * - LIVE flip: when mqttStatus === "online" AND lastSeen < 5s → source = "LIVE"
 * - SIM fallback: when disconnected OR lastSeen >= 5s → fallback source = "SIM" with toast
 */
export default function MqttManager() {
  const fallbackToastAt = useRef(0);
  const liveToastAt = useRef(0);
  const initialConnected = useRef(false);

  // Auto-connect on load and hook onTelemetry into store live slice
  useEffect(() => {
    let unhookTelemetry: (() => void) | undefined;

    void import("@/lib/mqtt-bridge").then((m) => {
      unhookTelemetry = m.onTelemetry((telemetry) => {
        useFarmStore.getState().setLiveTelemetry(telemetry);
      });

      if (!initialConnected.current) {
        initialConnected.current = true;
        const s = useFarmStore.getState();
        const autoConnect = s.settings.autoConnect ?? true;
        if (autoConnect) {
          const token = s.settings.mqttToken || "patelfarm01";
          const brokerUrl = s.settings.mqttBrokerUrl || "wss://broker.emqx.io:8084/mqtt";
          m.connect(token, brokerUrl);
        }
      }
    });

    return () => {
      unhookTelemetry?.();
    };
  }, []);

  // Watchdog supervisor: LIVE when online & lastSeen < 5s, else fallback SIM
  useEffect(() => {
    if (typeof window === "undefined") return;

    const id = setInterval(() => {
      const s = useFarmStore.getState();
      const online = s.mqttStatus === "online";
      const lastSeen = s.live?.lastSeenAt ?? s.mqttLastSeen;
      const age = lastSeen != null ? Date.now() - lastSeen : Infinity;
      const fresh = online && age < 5000;
      const inLive = s.source === "LIVE";

      if (fresh && !inLive) {
        // Telemetry fresh (<5s) and online → Go LIVE
        s.setSource("LIVE");
        s.updateSettings({ mode: "live" });
        s.stopSimulation();
        s.stopLivePolling();

        if (Date.now() - liveToastAt.current > 15000) {
          liveToastAt.current = Date.now();
          toast.success("EDGE-LIVE — streaming telemetry", {
            description: "ESP8266 edge node connected over MQTT.",
          });
        }
      } else if (inLive && !fresh) {
        // Disconnected or stale (>=5s) → Fallback to SIMULATION with toast
        s.setSource("SIM");
        s.updateSettings({ mode: "simulation" });
        s.stopLivePolling();
        s.startSimulation();

        if (Date.now() - fallbackToastAt.current > 5000) {
          fallbackToastAt.current = Date.now();
          toast.warning("Edge node offline — simulation resumed");
        }
      }
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return null;
}
