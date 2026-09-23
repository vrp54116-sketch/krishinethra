"use client";

import { motion } from "framer-motion";
import {
  CloudRain,
  Droplets,
  Thermometer,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { AnimatedNumber, CardHeader, Sparkline, StatusPill, type PillTone } from "./ui";

/** Pad / trim a series to exactly 24 points for the sparkline. */
function to24(all: number[], current: number): number[] {
  const tail = all.slice(-24);
  if (tail.length >= 24) return tail;
  const fill = tail.length > 0 ? tail[0] : current;
  return [...Array<number>(24 - tail.length).fill(fill), ...tail];
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
}

export default function SensorGrid() {
  const t = useT();
  const snapshot = useFarmStore((s) => s.snapshot);
  const sensorHistory = useFarmStore((s) => s.sensorHistory);
  const thresholds = useFarmStore((s) => s.settings.thresholds);
  const showRaw = useFarmStore((s) => s.settings.showRawCalibrationValues);
  const soilRaw = snapshot.soilRaw ?? Math.round(1023 - (snapshot.soil * 6.5));
  const mqRaw = snapshot.mqRaw ?? 230;

  const moistureTone = (m: number): PillTone =>
    m < 20 ? "bad" : m < thresholds.moistureLow ? "warn" : m > thresholds.moistureHigh ? "warn" : "good";
  const moistureLabel = (m: number): string =>
    m < 20 ? "Critical" : m < thresholds.moistureLow ? "Dry" : m > thresholds.moistureHigh ? "Wet" : "Optimal";

  const tempTone: PillTone = snapshot.temp > thresholds.tempHigh ? "warn" : "good";
  const humidityTone: PillTone =
    snapshot.hum < thresholds.humidityLow || snapshot.hum > 70 ? "warn" : "good";
  const aqiTone: PillTone =
    snapshot.aqi > thresholds.aqiHigh ? "bad" : snapshot.aqi > 100 ? "warn" : "good";

  const sensors: SensorDef[] = [
    {
      key: "soil",
      label: t("dashboard.soilMoisture"),
      icon: Droplets,
      iconTint: "bg-sky-500/15 text-sky-300",
      value: snapshot.soil,
      decimals: 1,
      unit: "%",
      pill: { tone: moistureTone(snapshot.soil), label: moistureLabel(snapshot.soil) },
      series: to24(sensorHistory.map((p) => p.soil ?? p.soilMoistureA), snapshot.soil),
      sparkColor: "#38bdf8",
      alertPulse: snapshot.soil < thresholds.moistureLow,
    },
    {
      key: "temp",
      label: t("dashboard.temperature"),
      icon: Thermometer,
      iconTint: "bg-red-500/15 text-red-300",
      value: snapshot.temp,
      decimals: 1,
      unit: "°C",
      pill: { tone: tempTone, label: snapshot.temp > thresholds.tempHigh ? "High" : "Normal" },
      series: to24(sensorHistory.map((p) => p.temp ?? p.tempC), snapshot.temp),
      sparkColor: "#ef4444",
    },
    {
      key: "hum",
      label: t("dashboard.humidity"),
      icon: Waves,
      iconTint: "bg-cyan-500/15 text-cyan-300",
      value: snapshot.hum,
      decimals: 1,
      unit: "%",
      pill: {
        tone: humidityTone,
        label: snapshot.hum < thresholds.humidityLow ? "Low" : snapshot.hum > 70 ? "High" : "Optimal",
      },
      series: to24(sensorHistory.map((p) => p.hum ?? p.humidity), snapshot.hum),
      sparkColor: "#22d3ee",
    },
    {
      key: "aqi",
      label: "Air Quality (AQI)",
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
  ];

  return (
    <div>
      <div className="flex items-center justify-between pb-3">
        <CardHeader title={t("dashboard.liveSensors")} subtitle={t("dashboard.liveSensorsSub")} />
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all shadow-sm",
            snapshot.rain
              ? "bg-blue-500/20 border-blue-400/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.4)] animate-pulse"
              : "bg-white/[0.04] border-white/10 text-white/60"
          )}
        >
          <CloudRain className={cn("w-3.5 h-3.5", snapshot.rain ? "text-blue-300" : "text-white/40")} />
          <span>Rain: {snapshot.rain ? "Yes" : "No"}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {sensors.map((s) => (
          <SensorCard
            key={s.key}
            def={s}
            rawText={
              showRaw && (s.key === "soil" || s.key === "aqi")
                ? `(raw: ${s.key === "soil" ? soilRaw : mqRaw})`
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function SensorCard({ def, rawText }: { def: SensorDef; rawText?: string }) {
  const Icon = def.icon;
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "liquid-icon-circle flex h-11 w-11 shrink-0 items-center justify-center",
            def.iconTint,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex items-center gap-1.5">
          {rawText && (
            <span className="font-mono text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-400/20">
              {rawText}
            </span>
          )}
          <StatusPill tone={def.pill.tone} pulse={def.alertPulse}>
            {def.pill.label}
          </StatusPill>
        </div>
      </div>

      <p className="mt-3 truncate text-xs font-medium text-[#9CA3AF]">{def.label}</p>
      <p className="mt-0.5 flex items-baseline">
        <span className="liquid-metric">
          <AnimatedNumber value={def.value} decimals={def.decimals} />
        </span>
        <span className="ml-0.5 text-sm font-semibold text-[#9CA3AF]">{def.unit}</span>
      </p>

      <div className="mt-2">
        <Sparkline data={def.series} color={def.sparkColor} />
      </div>
    </>
  );

  if (def.alertPulse) {
    return (
      <motion.section
        className="liquid-glass liquid-glass-card liquid-card-hover liquid-card-amber"
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
    <section className="liquid-glass liquid-glass-card liquid-card-hover">
      {body}
    </section>
  );
}
