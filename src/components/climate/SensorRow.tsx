"use client";

import { useMemo } from "react";
import {
  CloudRain,
  Thermometer,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import {
  AnimatedNumber,
  Sparkline,
  StatusPill,
  type PillTone,
} from "@/components/dashboard/ui";
import {
  AQI_BANDS,
  aqiBand,
  buildTwelveHourSeries,
} from "./shared";

/* ------------------------------------------------------------------ */
/* Visual helpers                                                     */
/* ------------------------------------------------------------------ */

function ComfortBar({
  min,
  max,
  idealMin,
  idealMax,
  value,
}: {
  min: number;
  max: number;
  idealMin: number;
  idealMax: number;
  value: number;
}) {
  const pct = (v: number) =>
    Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  return (
    <div className="mt-2">
      <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="absolute inset-y-0 rounded-full bg-emerald-500/70 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
          style={{ left: `${pct(idealMin)}%`, width: `${pct(idealMax) - pct(idealMin)}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          style={{ left: `${pct(value)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-500">
        <span>{min}°</span>
        <span className="font-semibold text-emerald-300/80">
          comfort {idealMin}–{idealMax}°
        </span>
        <span>{max}°</span>
      </div>
    </div>
  );
}

function AqiScale({ value }: { value: number }) {
  return (
    <div className="mt-2">
      <div className="relative flex h-2 overflow-hidden rounded-full">
        {AQI_BANDS.map((b) => (
          <div key={b.label} className="h-full flex-1" style={{ background: b.color, opacity: 0.75 }} />
        ))}
        <div
          className="absolute top-1/2 h-3.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          style={{ left: `${Math.max(0, Math.min(100, (value / 500) * 100))}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-500">
        <span>0</span>
        <span>250</span>
        <span>500</span>
      </div>
    </div>
  );
}

function Shell({
  icon: Icon,
  tint,
  label,
  pill,
  children,
}: {
  icon: LucideIcon;
  tint: string;
  label: string;
  pill: { tone: PillTone; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="card-surface rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-[0_0_28px_rgba(34,197,94,0.22)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tint)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
      </div>
      <p className="mt-2 truncate text-xs font-medium text-zinc-400">{label}</p>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3 live climate sensor cards + Rain status chip                      */
/* ------------------------------------------------------------------ */

export default function SensorRow() {
  const snapshot = useFarmStore((s) => s.snapshot);
  const sensorHistory = useFarmStore((s) => s.sensorHistory);
  const tempHigh = useFarmStore((s) => s.settings.thresholds.tempHigh);
  const aqiHigh = useFarmStore((s) => s.settings.thresholds.aqiHigh);

  const series = useMemo(
    () => buildTwelveHourSeries(snapshot, sensorHistory, 48),
    [snapshot, sensorHistory],
  );

  const tempSeries = useMemo(() => series.map((p) => p.tempC), [series]);
  const humSeries = useMemo(() => series.map((p) => p.humidity), [series]);
  const aqiSeries = useMemo(() => series.map((p) => p.aqi), [series]);

  const band = aqiBand(snapshot.aqi);

  const tempTone: PillTone =
    snapshot.temp > tempHigh ? "warn" : snapshot.temp < 10 ? "warn" : "good";
  const humTone: PillTone =
    snapshot.hum > 80 || snapshot.hum < 30 ? "warn" : "good";

  return (
    <div className="space-y-3">
      {/* Header with Rain status boolean chip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:px-4 backdrop-blur-md">
        <div>
          <h2 className="text-sm font-extrabold text-white">Live Microclimate Telemetry</h2>
          <p className="text-xs text-zinc-400">Atmospheric readings from DHT22, MQ-135 & digital rain probe</p>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all self-start sm:self-auto",
            snapshot.rain
              ? "border-blue-400/50 bg-blue-500/20 text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.4)] animate-pulse"
              : "border-white/10 bg-white/[0.04] text-zinc-400"
          )}
        >
          <CloudRain className={cn("h-4 w-4", snapshot.rain ? "text-blue-300" : "text-zinc-500")} />
          <span>Rain Detected: <strong className="text-white">{snapshot.rain ? "Yes" : "No"}</strong></span>
        </div>
      </div>

      {/* 3 Core Sensor Cards: Temperature, Humidity, AQI */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {/* Temperature with comfort range bar */}
        <Shell
          icon={Thermometer}
          tint="bg-red-500/15 text-red-300"
          label="Temperature · 12h history"
          pill={{
            tone: tempTone,
            label:
              snapshot.temp > tempHigh
                ? "Hot"
                : snapshot.temp < 10
                  ? "Cold"
                  : "Comfort",
          }}
        >
          <p className="text-2xl font-extrabold tracking-tight text-white">
            <AnimatedNumber value={snapshot.temp} decimals={1} />
            <span className="ml-0.5 text-sm font-semibold text-zinc-400">°C</span>
          </p>
          <Sparkline data={tempSeries} color="#ef4444" />
          <ComfortBar min={0} max={45} idealMin={18} idealMax={32} value={snapshot.temp} />
        </Shell>

        {/* Humidity */}
        <Shell
          icon={Waves}
          tint="bg-cyan-500/15 text-cyan-300"
          label="Humidity · 12h history"
          pill={{
            tone: humTone,
            label:
              snapshot.hum > 80
                ? "Humid"
                : snapshot.hum < 30
                  ? "Dry"
                  : "Optimal",
          }}
        >
          <p className="text-2xl font-extrabold tracking-tight text-white">
            <AnimatedNumber value={snapshot.hum} decimals={1} />
            <span className="ml-0.5 text-sm font-semibold text-zinc-400">%</span>
          </p>
          <Sparkline data={humSeries} color="#22d3ee" />
          <p className="mt-2 text-[11px] text-zinc-500">
            Ideal 50–70% · fungus risk above 80%
          </p>
        </Shell>

        {/* AQI with 0–500 color scale */}
        <Shell
          icon={Wind}
          tint="bg-violet-500/15 text-violet-300"
          label="Air Quality Index · 12h history"
          pill={{
            tone:
              snapshot.aqi > aqiHigh ? "bad" : snapshot.aqi > 100 ? "warn" : "good",
            label: band.label,
          }}
        >
          <p className="text-2xl font-extrabold tracking-tight text-white">
            <AnimatedNumber value={snapshot.aqi} decimals={0} />
            <span className="ml-1 text-xs font-semibold" style={{ color: band.color }}>
              {band.label}
            </span>
          </p>
          <Sparkline data={aqiSeries} color="#a78bfa" />
          <AqiScale value={snapshot.aqi} />
        </Shell>
      </div>
    </div>
  );
}
