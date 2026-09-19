"use client";

import { useMemo } from "react";
import {
  CloudRain,
  Droplets,
  Gauge,
  Moon,
  Sun,
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
  currentPressure,
} from "./shared";

/* ------------------------------------------------------------------ */
/* Small visual helpers                                                */
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
/* 6 live climate sensor cards                                         */
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
  const lightSeries = useMemo(() => series.map((p) => p.lightLux), [series]);
  const rainSeries = useMemo(() => series.map((p) => p.rainMm), [series]);
  const pressSeries = useMemo(
    () => series.map((p) => p.pressureHpa),
    [series],
  );

  const pressure = currentPressure(snapshot);
  const band = aqiBand(snapshot.aqi);
  const isDay = snapshot.lightLux > 10;
  const raining = snapshot.rainMm >= 0.3;
  const drizzle = !raining && snapshot.rainMm > 0;

  const tempTone: PillTone =
    snapshot.tempC > tempHigh ? "warn" : snapshot.tempC < 10 ? "warn" : "good";
  const humTone: PillTone =
    snapshot.humidity > 80 || snapshot.humidity < 30 ? "warn" : "good";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {/* Temperature with comfort range bar */}
      <Shell
        icon={Thermometer}
        tint="bg-red-500/15 text-red-300"
        label="Temperature · 12h history"
        pill={{
          tone: tempTone,
          label:
            snapshot.tempC > tempHigh
              ? "Hot"
              : snapshot.tempC < 10
                ? "Cold"
                : "Comfort",
        }}
      >
        <p className="text-2xl font-extrabold tracking-tight text-white">
          <AnimatedNumber value={snapshot.tempC} decimals={1} />
          <span className="ml-0.5 text-sm font-semibold text-zinc-400">°C</span>
        </p>
        <Sparkline data={tempSeries} color="#ef4444" />
        <ComfortBar min={0} max={45} idealMin={18} idealMax={32} value={snapshot.tempC} />
      </Shell>

      {/* Humidity */}
      <Shell
        icon={Waves}
        tint="bg-cyan-500/15 text-cyan-300"
        label="Humidity · 12h history"
        pill={{
          tone: humTone,
          label:
            snapshot.humidity > 80
              ? "Humid"
              : snapshot.humidity < 30
                ? "Dry"
                : "Optimal",
        }}
      >
        <p className="text-2xl font-extrabold tracking-tight text-white">
          <AnimatedNumber value={snapshot.humidity} decimals={1} />
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

      {/* Light with day/night icon */}
      <Shell
        icon={isDay ? Sun : Moon}
        tint={isDay ? "bg-yellow-500/15 text-yellow-300" : "bg-indigo-500/15 text-indigo-300"}
        label="Light intensity · 12h history"
        pill={{ tone: isDay ? "good" : "info", label: isDay ? "Day" : "Night" }}
      >
        <p className="text-2xl font-extrabold tracking-tight text-white">
          <AnimatedNumber value={snapshot.lightLux} decimals={0} />
          <span className="ml-0.5 text-sm font-semibold text-zinc-400">lux</span>
        </p>
        <Sparkline data={lightSeries} color="#facc15" />
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
          {isDay ? (
            <Sun className="h-3.5 w-3.5 text-yellow-300" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-indigo-300" />
          )}
          {isDay ? "Photosynthesis active" : "Night — lights out, stomata closed"}
        </p>
      </Shell>

      {/* Rain sensor status */}
      <Shell
        icon={CloudRain}
        tint="bg-blue-500/15 text-blue-300"
        label="Rain sensor · 12h history"
        pill={{
          tone: raining ? "info" : drizzle ? "info" : "good",
          label: raining ? "Raining" : drizzle ? "Drizzle" : "Dry",
        }}
      >
        <p className="text-2xl font-extrabold tracking-tight text-white">
          <AnimatedNumber value={snapshot.rainMm} decimals={1} />
          <span className="ml-0.5 text-sm font-semibold text-zinc-400">mm</span>
        </p>
        <Sparkline data={rainSeries} color="#60a5fa" />
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
          <Droplets className="h-3.5 w-3.5 text-blue-300" />
          {raining
            ? "Rain watering the field — skip irrigation"
            : drizzle
              ? "Trace moisture on the sensor"
              : "Sensor dry — no rainfall"}
        </p>
      </Shell>

      {/* Pressure */}
      <Shell
        icon={Gauge}
        tint="bg-emerald-500/15 text-emerald-300"
        label="Atmospheric pressure · 12h history"
        pill={{
          tone: pressure < 1005 || pressure > 1020 ? "warn" : "good",
          label:
            pressure < 1005 ? "Low" : pressure > 1020 ? "High" : "Normal",
        }}
      >
        <p className="text-2xl font-extrabold tracking-tight text-white">
          <AnimatedNumber value={pressure} decimals={1} />
          <span className="ml-0.5 text-sm font-semibold text-zinc-400">hPa</span>
        </p>
        <Sparkline data={pressSeries} color="#34d399" />
        <p className="mt-2 text-[11px] text-zinc-500">
          Falling pressure often precedes rain — watch the trend
        </p>
      </Shell>
    </div>
  );
}
