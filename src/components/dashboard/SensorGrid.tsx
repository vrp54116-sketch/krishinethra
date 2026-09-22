"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CloudRain,
  Container,
  Droplets,
  Sun,
  Thermometer,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { AnimatedNumber, CardHeader, Sparkline, StatusPill, type PillTone } from "./ui";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Pad / trim a series to exactly 24 points for the sparkline. */
function to24(all: number[], current: number): number[] {
  const tail = all.slice(-24);
  if (tail.length >= 24) return tail;
  const fill = tail.length > 0 ? tail[0] : current;
  return [...Array<number>(24 - tail.length).fill(fill), ...tail];
}

/**
 * Local rolling buffer for metrics the store history doesn't track
 * (light, rain, tank). Samples the live value every 2s, keeps last 24.
 */
function useLocalSeries(value: number, n = 24): number[] {
  const [series, setSeries] = useState<number[]>(() => Array(n).fill(value));
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  useEffect(() => {
    const id = setInterval(() => {
      const v = ref.current;
      setSeries((s) => [...s.slice(-(n - 1)), v]);
    }, 2000);
    return () => clearInterval(id);
  }, [n]);
  return series;
}

interface SensorDef {
  key: string;
  label: string;
  icon: LucideIcon;
  iconTint: string;
  value: number;
  decimals: number;
  unit: string;
  pill: { tone: PillTone; label: string };
  series: number[];
  sparkColor: string;
  alertPulse?: boolean;
  custom?: "tank";
}

/* ------------------------------------------------------------------ */
/* Grid                                                                */
/* ------------------------------------------------------------------ */

export default function SensorGrid() {
  const t = useT();
  const snapshot = useFarmStore((s) => s.snapshot);
  const sensorHistory = useFarmStore((s) => s.sensorHistory);
  const thresholds = useFarmStore((s) => s.settings.thresholds);

  const lightSeries = useLocalSeries(snapshot.lightLux);
  const rainSeries = useLocalSeries(snapshot.rainMm);
  const tankSeries = useLocalSeries(snapshot.tankLevelPercent);

  const moistureTone = (m: number): PillTone =>
    m < 20 ? "bad" : m < thresholds.moistureLow ? "warn" : m > thresholds.moistureHigh ? "warn" : "good";
  const moistureLabel = (m: number): string =>
    m < 20 ? "Critical" : m < thresholds.moistureLow ? "Dry" : m > thresholds.moistureHigh ? "Wet" : "Optimal";

  const tempTone: PillTone = snapshot.tempC > thresholds.tempHigh ? "warn" : "good";
  const humidityTone: PillTone =
    snapshot.humidity < thresholds.humidityLow || snapshot.humidity > 70 ? "warn" : "good";
  const aqiTone: PillTone =
    snapshot.aqi > thresholds.aqiHigh ? "bad" : snapshot.aqi > 100 ? "warn" : "good";
  const tankTone: PillTone =
    snapshot.tankLevelPercent < 5 ? "bad" : snapshot.tankLevelPercent < thresholds.tankLow ? "warn" : "good";
  const rainTone: PillTone = snapshot.rainMm >= 2 ? "info" : snapshot.rainMm > 0 ? "info" : "good";

  const sensors: SensorDef[] = [
    {
      key: "a",
      label: `${t("dashboard.soilMoisture")} A`,
      icon: Droplets,
      iconTint: "bg-sky-500/15 text-sky-300",
      value: snapshot.soilMoistureA,
      decimals: 1,
      unit: "%",
      pill: { tone: moistureTone(snapshot.soilMoistureA), label: moistureLabel(snapshot.soilMoistureA) },
      series: to24(sensorHistory.map((p) => p.soilMoistureA), snapshot.soilMoistureA),
      sparkColor: "#38bdf8",
    },
    {
      key: "b",
      label: `${t("dashboard.soilMoisture")} B`,
      icon: Droplets,
      iconTint: "bg-amber-500/15 text-amber-300",
      value: snapshot.soilMoistureB,
      decimals: 1,
      unit: "%",
      pill: { tone: moistureTone(snapshot.soilMoistureB), label: moistureLabel(snapshot.soilMoistureB) },
      series: to24(sensorHistory.map((p) => p.soilMoistureB), snapshot.soilMoistureB),
      sparkColor: "#f59e0b",
      alertPulse: snapshot.soilMoistureB < thresholds.moistureLow,
    },
    {
      key: "temp",
      label: t("dashboard.temperature"),
      icon: Thermometer,
      iconTint: "bg-red-500/15 text-red-300",
      value: snapshot.tempC,
      decimals: 1,
      unit: "°C",
      pill: { tone: tempTone, label: snapshot.tempC > thresholds.tempHigh ? "High" : "Normal" },
      series: to24(sensorHistory.map((p) => p.tempC), snapshot.tempC),
      sparkColor: "#ef4444",
    },
    {
      key: "hum",
      label: t("dashboard.humidity"),
      icon: Waves,
      iconTint: "bg-cyan-500/15 text-cyan-300",
      value: snapshot.humidity,
      decimals: 1,
      unit: "%",
      pill: {
        tone: humidityTone,
        label: snapshot.humidity < thresholds.humidityLow ? "Low" : snapshot.humidity > 70 ? "High" : "Optimal",
      },
      series: to24(sensorHistory.map((p) => p.humidity), snapshot.humidity),
      sparkColor: "#22d3ee",
    },
    {
      key: "aqi",
      label: "AQI",
      icon: Wind,
      iconTint: "bg-violet-500/15 text-violet-300",
      value: snapshot.aqi,
      decimals: 0,
      unit: "",
      pill: {
        tone: aqiTone,
        label: snapshot.aqi > thresholds.aqiHigh ? "Poor" : snapshot.aqi > 100 ? "Moderate" : "Good",
      },
      series: to24(sensorHistory.map((p) => p.aqi), snapshot.aqi),
      sparkColor: "#a78bfa",
    },
    {
      key: "light",
      label: "Light",
      icon: Sun,
      iconTint: "bg-yellow-500/15 text-yellow-300",
      value: snapshot.lightLux,
      decimals: 0,
      unit: " lux",
      pill: { tone: snapshot.lightLux > 10 ? "good" : "info", label: snapshot.lightLux > 10 ? "Day" : "Night" },
      series: lightSeries,
      sparkColor: "#facc15",
    },
    {
      key: "tank",
      label: t("dashboard.tankLevel"),
      icon: Container,
      iconTint: "bg-emerald-500/15 text-emerald-300",
      value: snapshot.tankLevelPercent,
      decimals: 0,
      unit: "%",
      pill: {
        tone: tankTone,
        label: snapshot.tankLevelPercent < 5 ? "Empty" : snapshot.tankLevelPercent < thresholds.tankLow ? "Low" : "Full",
      },
      series: tankSeries,
      sparkColor: "#22c55e",
      custom: "tank",
    },
    {
      key: "rain",
      label: "Rain",
      icon: CloudRain,
      iconTint: "bg-blue-500/15 text-blue-300",
      value: snapshot.rainMm,
      decimals: 1,
      unit: " mm",
      pill: { tone: rainTone, label: snapshot.rainMm > 0 ? "Raining" : "Dry" },
      series: rainSeries,
      sparkColor: "#60a5fa",
    },
  ];

  return (
    <div>
      <CardHeader title={t("dashboard.liveSensors")} subtitle={t("dashboard.liveSensorsSub")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sensors.map((s) => (
          <SensorCard key={s.key} def={s} />
        ))}
      </div>
    </div>
  );
}

function SensorCard({ def }: { def: SensorDef }) {
  const Icon = def.icon;
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", def.iconTint)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <StatusPill tone={def.pill.tone} pulse={def.alertPulse}>
          {def.pill.label}
        </StatusPill>
      </div>

      <p className="mt-2 truncate text-xs font-medium text-[#9CA3AF]">{def.label}</p>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">
        <AnimatedNumber value={def.value} decimals={def.decimals} />
        <span className="ml-0.5 text-sm font-semibold text-[#9CA3AF]">{def.unit}</span>
      </p>

      {def.custom === "tank" ? (
        <div className="mt-2 flex items-end gap-3">
          {/* Vertical fill gauge */}
          <div className="relative h-20 w-8 shrink-0 overflow-hidden rounded-[10px] border border-white/10 bg-white/[0.04]">
            <motion.div
              className="absolute inset-x-0 bottom-0 rounded-b-[8px] bg-gradient-to-t from-emerald-600 to-[#34D399]"
              initial={false}
              animate={{ height: `${Math.max(0, Math.min(100, def.value))}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ boxShadow: "0 0 12px rgba(52,211,153,0.5)" }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Sparkline data={def.series} color={def.sparkColor} />
          </div>
        </div>
      ) : (
        <div className="mt-1">
          <Sparkline data={def.series} color={def.sparkColor} />
        </div>
      )}
    </>
  );

  // Zone B low-moisture: pulsing amber border (glow only, text stays steady).
  if (def.alertPulse) {
    return (
      <motion.section
        className="card-surface rounded-[20px] border-amber-400/60 p-4 transition-transform duration-300 hover:-translate-y-1 sm:p-5"
        animate={{
          boxShadow: [
            "0 0 12px rgba(245,158,11,0.25)",
            "0 0 28px rgba(245,158,11,0.55)",
            "0 0 12px rgba(245,158,11,0.25)",
          ],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        {body}
      </motion.section>
    );
  }

  return (
    <section className="card-surface rounded-[20px] p-4 transition-all duration-300 hover:-translate-y-1 sm:p-5">
      {body}
    </section>
  );
}
