"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, Cpu, Droplets, Thermometer, Wind, CloudRain } from "lucide-react";
import { useFarm } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function SensorHealthCard({ className }: { className?: string }) {
  const farm = useFarm();
  const settings = farm.settings;

  const stale = farm.stale;
  const soilRaw = farm.snapshot?.soilRaw ?? (farm.soil ? Math.round(1023 - (farm.soil * 6.5)) : 540);
  const mqRaw = farm.snapshot?.mqRaw ?? 230;
  const showRaw = farm.source === "LIVE" && Boolean(settings?.showRawCalibrationValues);

  // Simulate MQ-135 preheat (60 seconds after boot)
  const uptimeSec = farm.uptime ? (typeof farm.uptime === "number" ? farm.uptime : 120) : 120;
  const isMqPreheating = uptimeSec < 60;
  const mqPreheatRemain = Math.max(0, 60 - uptimeSec);

  const isRaining = Boolean(farm.rain);

  const sensors = [
    {
      id: "soil",
      name: "Soil Moisture",
      icon: <Droplets className="h-4 w-4 text-emerald-400" />,
      status: stale ? "stale" : "healthy",
      statusLabel: stale ? "Stale" : "Connected",
      value: `${Math.round(farm.soil)}%`,
      raw: `raw: ${soilRaw}`,
      subtext: "Capacitive / Resistive A0",
    },
    {
      id: "dht22",
      name: "DHT22 Climate",
      icon: <Thermometer className="h-4 w-4 text-sky-400" />,
      status: stale ? "stale" : "healthy",
      statusLabel: stale ? "Stale" : `${Math.round(farm.temp)}°C / ${Math.round(farm.hum)}%`,
      value: `${Math.round(farm.temp)}°C`,
      raw: `Hum: ${Math.round(farm.hum)}%`,
      subtext: "Digital D4 Bus",
    },
    {
      id: "mq135",
      name: "MQ-135 Gas / Air",
      icon: <Wind className="h-4 w-4 text-purple-400" />,
      status: stale ? "stale" : isMqPreheating ? "preheat" : "healthy",
      statusLabel: stale
        ? "Stale"
        : isMqPreheating
          ? `Preheating ${mqPreheatRemain}s`
          : `AQI ${farm.aqi}`,
      value: isMqPreheating ? "Warming" : `AQI ${farm.aqi}`,
      raw: `raw: ${mqRaw}`,
      subtext: isMqPreheating ? "Heater cycle 45/60s" : "SnO2 Metal Oxide A1",
    },
    {
      id: "rain",
      name: "Rain Detector",
      icon: <CloudRain className="h-4 w-4 text-blue-400" />,
      status: stale ? "stale" : isRaining ? "alert" : "healthy",
      statusLabel: stale ? "Stale" : isRaining ? "RAIN: DETECTED" : "RAIN: NONE",
      value: isRaining ? "RAIN: DETECTED" : "RAIN: NONE",
      raw: isRaining ? "DETECTED" : "NONE",
      subtext: "Digital Comparator D2",
    },
    {
      id: "edgelink",
      name: "ESP32 Edge Link",
      icon: <Cpu className="h-4 w-4 text-emerald-400" />,
      status: stale ? "stale" : farm.isLive ? "healthy" : "preheat",
      statusLabel: stale ? "Stale (5s+)" : farm.isLive ? "Active (Live)" : "Simulated",
      value: stale ? "Offline" : farm.isLive ? "MQTT / WiFi" : "Sim Mode",
      raw: `RSSI: ${farm.rssi ?? -55} dBm`,
      subtext: "ESP32 WSS Bridge",
    },
  ];

  return (
    <div
      className={cn(
        "liquid-glass-card rounded-[20px] transition-all duration-300",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 border border-white/15">
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              🔌 Sensor Health
            </h3>
            <p className="text-[11px] text-zinc-400">
              Edge node telemetry & hardware buses
            </p>
          </div>
        </div>

        <Link
          href="/app/sensors"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/25 transition-all duration-200"
        >
          <span>Full Telemetry</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Grid of status pills */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sensors.map((sensor) => {
          const isStale = sensor.status === "stale";
          const isPreheat = sensor.status === "preheat";
          const isAlert = sensor.status === "alert";

          const dotColor = isStale
            ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
            : isPreheat
              ? "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.7)]"
              : isAlert
                ? "bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.7)]"
                : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]";

          return (
            <div
              key={sensor.id}
              className={cn(
                "liquid-glass-pill rounded-2xl p-3 border transition-all flex flex-col justify-between gap-2",
                isStale
                  ? "border-rose-500/30 bg-rose-500/[0.05]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                    {sensor.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white/90">
                      {sensor.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      {sensor.subtext}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={cn("inline-block h-2 w-2 rounded-full", dotColor)} />
                  <span className="text-[11px] font-medium text-white/80">
                    {sensor.statusLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-white/5">
                <span className="text-zinc-300 font-semibold">{sensor.value}</span>
                <span className={cn("text-[11px]", showRaw ? "text-amber-400 font-bold" : "text-zinc-400")}>
                  {sensor.raw}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
