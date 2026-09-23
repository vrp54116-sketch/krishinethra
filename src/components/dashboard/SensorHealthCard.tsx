"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, Cpu, Droplets, Thermometer, Wind, CloudRain, Clock } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function SensorHealthCard({ className }: { className?: string }) {
  const snapshot = useFarmStore((s) => s.snapshot);
  const settings = useFarmStore((s) => s.settings);

  const stale = snapshot.stale;
  const soilRaw = snapshot.soilRaw ?? (snapshot.soil ? Math.round(1023 - (snapshot.soil * 6.5)) : 540);
  const mqRaw = snapshot.mqRaw ?? 230;
  const showRaw = settings.showRawCalibrationValues ?? false;

  // Simulate MQ-135 preheat (60 seconds after boot)
  const uptimeSec = snapshot.uptime ? (typeof snapshot.uptime === "number" ? snapshot.uptime : 120) : 120;
  const isMqPreheating = uptimeSec < 60;
  const mqPreheatRemain = Math.max(0, 60 - uptimeSec);

  const sensors = [
    {
      id: "soil",
      name: "Soil Moisture",
      icon: <Droplets className="h-4 w-4 text-emerald-400" />,
      status: stale ? "stale" : "healthy",
      statusLabel: stale ? "Stale" : "Connected",
      value: `${Math.round(snapshot.soil ?? 45)}%`,
      raw: `raw: ${soilRaw}`,
      subtext: "Capacitive / Resistive A0",
    },
    {
      id: "dht22",
      name: "DHT22 Climate",
      icon: <Thermometer className="h-4 w-4 text-sky-400" />,
      status: stale ? "stale" : "healthy",
      statusLabel: stale ? "Stale" : `${Math.round(snapshot.temp ?? 30)}°C / ${Math.round(snapshot.hum ?? 60)}%`,
      value: `${Math.round(snapshot.temp ?? 30)}°C`,
      raw: `Hum: ${Math.round(snapshot.hum ?? 60)}%`,
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
          : `AQI ${snapshot.aqi ?? 85}`,
      value: isMqPreheating ? "Warming" : `AQI ${snapshot.aqi ?? 85}`,
      raw: `raw: ${mqRaw}`,
      subtext: isMqPreheating ? "Heater cycle 45/60s" : "SnO2 Metal Oxide A1",
    },
    {
      id: "rain",
      name: "Rain Detector",
      icon: <CloudRain className="h-4 w-4 text-blue-400" />,
      status: stale ? "stale" : snapshot.rain ? "alert" : "healthy",
      statusLabel: stale ? "Stale" : snapshot.rain ? "Rain Detected" : "No Rain",
      value: snapshot.rain ? "Wet" : "Dry",
      raw: `Precip: ${snapshot.rainMm.toFixed(1)}mm`,
      subtext: "Digital Comparator D2",
    },
    {
      id: "unolink",
      name: "UNO Edge Link",
      icon: <Cpu className="h-4 w-4 text-amber-400" />,
      status: stale ? "stale" : "healthy",
      statusLabel: stale ? "Dead (5s+)" : "Active (1s ago)",
      value: stale ? "Offline" : "UART 9600",
      raw: `RSSI: ${snapshot.rssi ?? -55} dBm`,
      subtext: "Serial Hardware UART",
    },
  ];

  return (
    <div
      className={cn(
        "liquid-glass-card rounded-3xl p-5 md:p-6 transition-all duration-300",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
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
          href="/sensors"
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
