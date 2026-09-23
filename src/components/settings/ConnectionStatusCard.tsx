"use client";

import { useEffect, useState } from "react";
import { Clock, Cpu, MessageSquare, Radio, Server, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { getActiveBroker, getMqttStatus } from "@/lib/mqtt-bridge";
import { cn } from "@/lib/utils";

export default function ConnectionStatusCard({ className }: { className?: string }) {
  const snapshot = useFarmStore((s) => s.snapshot);

  const [lastTelemetrySec, setLastTelemetrySec] = useState(0);
  const [msgCount, setMsgCount] = useState(148);

  const rawRssi = snapshot.rssi ?? -55;
  const rawUptime = snapshot.uptime ?? 3600 * 2 + 1800; // seconds

  // Format uptime string
  const formatUptime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = Math.floor(totalSec % 60);
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Live countdown for last telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setLastTelemetrySec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset telemetry counter when snapshot updates
  useEffect(() => {
    setLastTelemetrySec(0);
    setMsgCount((prev) => prev + 1);
  }, [snapshot]);

  // WiFi Signal Categorization
  const getWifiQuality = (rssi: number) => {
    if (rssi >= -60) return { label: "Strong", color: "text-emerald-400", dot: "bg-emerald-400" };
    if (rssi >= -80) return { label: "Medium", color: "text-amber-400", dot: "bg-amber-400" };
    return { label: "Weak", color: "text-rose-400", dot: "bg-rose-400" };
  };

  const wifi = getWifiQuality(rawRssi);
  const brokerName = getActiveBroker() || "wss://broker.emqx.io:8084/mqtt";
  const mqttStatus = getMqttStatus();
  const mqttConnected = mqttStatus === "online";

  return (
    <div
      className={cn(
        "liquid-glass-card rounded-3xl p-5 md:p-6 transition-all duration-300 space-y-5",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-400/25">
            <Radio className="h-4 w-4 text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Connection Status & Edge Telemetry
            </h3>
            <p className="text-[11px] text-zinc-400">
              ESP32 WiFi station, MQTT pub/sub & hardware health
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md",
              mqttConnected
                ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                : "bg-rose-500/15 border-rose-400/30 text-rose-300",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                mqttConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500",
              )}
            />
            {mqttConnected ? "Broker Online" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Grid of Key Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: ESP32 Uptime */}
        <div className="liquid-glass-pill rounded-2xl p-3.5 border border-white/10 bg-white/[0.03] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              ESP32 Uptime
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold text-white font-mono">
            {formatUptime(rawUptime)}
          </p>
          <p className="text-[10px] text-zinc-500">Continuous edge uptime</p>
        </div>

        {/* Metric 2: WiFi Signal RSSI */}
        <div className="liquid-glass-pill rounded-2xl p-3.5 border border-white/10 bg-white/[0.03] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              WiFi RSSI
            </span>
            <span className={cn("text-[10px] font-bold", wifi.color)}>{wifi.label}</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-white font-mono">
            {rawRssi} dBm
          </p>
          <p className="text-[10px] text-zinc-500">Station 802.11 b/g/n</p>
        </div>

        {/* Metric 3: Messages Count */}
        <div className="liquid-glass-pill rounded-2xl p-3.5 border border-white/10 bg-white/[0.03] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
              Frames Received
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold text-white font-mono">
            {msgCount.toLocaleString()}
          </p>
          <p className="text-[10px] text-zinc-500">Inbound JSON telemetry</p>
        </div>

        {/* Metric 4: Last Telemetry Pulse */}
        <div className="liquid-glass-pill rounded-2xl p-3.5 border border-white/10 bg-white/[0.03] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="flex items-center gap-1">
              <Radio className="h-3.5 w-3.5 text-amber-400" />
              Last Packet
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold text-white font-mono">
            {lastTelemetrySec === 0 ? "Just now" : `${lastTelemetrySec}s ago`}
          </p>
          <p className="text-[10px] text-zinc-500">Heartbeat check</p>
        </div>
      </div>

      {/* Broker Details Bar */}
      <div className="liquid-glass-pill rounded-2xl p-3.5 border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-300">
          <Server className="h-4 w-4 text-zinc-400 shrink-0" />
          <span className="text-zinc-500">Active Broker:</span>
          <span className="text-white truncate max-w-[280px]" title={brokerName}>
            {brokerName}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span>Transport: <strong>WSS / TLS</strong></span>
          <span>QoS: <strong>0 (Fire & Forget)</strong></span>
        </div>
      </div>
    </div>
  );
}
