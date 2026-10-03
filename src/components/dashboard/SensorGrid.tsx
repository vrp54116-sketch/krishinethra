"use client";

import { memo, useMemo } from "react";
import {
  CloudRain,
  Droplets,
  Thermometer,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarm } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { AnimatedNumber, Sparkline, StatusPill, type PillTone } from "./ui";

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
  const farm = useFarm();
  const soilVal = farm.soil;
  const tempVal = farm.temp;
  const humVal = farm.hum;
  const aqiVal = farm.aqi;
  const isRaining = farm.rain;

  const soilRawVal = farm.snapshot?.soilRaw;
  const mqRawVal = farm.snapshot?.mqRaw;
  const sensorHistory = farm.sensorHistory ?? [];

  const thresholds = farm.thresholds ?? {
    moistureLow: 30,
    moistureHigh: 75,
    tempHigh: 35,
    humidityLow: 40,
    aqiHigh: 150,
  };
  const showRaw = farm.settings?.showRawCalibrationValues;

  const soilRaw = soilRawVal ?? Math.round(1023 - (soilVal * 6.5));
  const mqRaw = mqRawVal ?? 230;

  const moistureTone = (m: number): PillTone =>
    m < 20 ? "bad" : m < thresholds.moistureLow ? "warn" : m > thresholds.moistureHigh ? "warn" : "good";
  const moistureLabel = (m: number): string =>
    m < 20 ? "Critical" : m < thresholds.moistureLow ? "Dry" : m > thresholds.moistureHigh ? "Wet" : "Optimal";

  const tempTone: PillTone = tempVal > thresholds.tempHigh ? "warn" : "good";
  const humidityTone: PillTone =
    humVal < thresholds.humidityLow || humVal > 70 ? "warn" : "good";
  const aqiTone: PillTone =
    aqiVal > thresholds.aqiHigh ? "bad" : aqiVal > 100 ? "warn" : "good";

  const soilSeries = useMemo(() => to24(sensorHistory.map((p) => p.soil ?? p.soilMoistureA ?? 45), soilVal), [sensorHistory, soilVal]);
  const tempSeries = useMemo(() => to24(sensorHistory.map((p) => p.temp ?? p.tempC ?? 28), tempVal), [sensorHistory, tempVal]);
  const humSeries = useMemo(() => to24(sensorHistory.map((p) => p.hum ?? p.humidity ?? 60), humVal), [sensorHistory, humVal]);
  const aqiSeries = useMemo(() => to24(sensorHistory.map((p) => p.aqi ?? 50), aqiVal), [sensorHistory, aqiVal]);

  const sensors: SensorDef[] = [
    {
      key: "soil",
      label: t("dashboard.soilMoisture"),
      icon: Droplets,
      iconTint: "text-[var(--moss)] bg-[var(--moss-soft)] border border-[var(--moss)]",
      value: soilVal,
      decimals: 1,
      unit: "%",
      pill: { tone: moistureTone(soilVal), label: t(moistureLabel(soilVal)) },
      series: soilSeries,
      sparkColor: "var(--moss)",
      alertPulse: soilVal < thresholds.moistureLow,
    },
    {
      key: "temp",
      label: t("dashboard.temperature"),
      icon: Thermometer,
      iconTint: "text-[var(--terra)] bg-[var(--terra-soft)] border border-[var(--terra)]",
      value: tempVal,
      decimals: 1,
      unit: "°C",
      pill: { tone: tempTone, label: t(tempVal > thresholds.tempHigh ? "High" : "Normal") },
      series: tempSeries,
      sparkColor: "var(--terra)",
    },
    {
      key: "hum",
      label: t("dashboard.humidity"),
      icon: Waves,
      iconTint: "text-[var(--moss)] bg-[var(--moss-soft)] border border-[var(--moss)]",
      value: humVal,
      decimals: 1,
      unit: "%",
      pill: {
        tone: humidityTone,
        label: t(humVal < thresholds.humidityLow ? "Low" : humVal > 70 ? "High" : "Optimal"),
      },
      series: humSeries,
      sparkColor: "var(--moss)",
    },
    {
      key: "aqi",
      label: t("dashboard.airQuality"),
      icon: Wind,
      iconTint: "text-[var(--terra)] bg-[var(--terra-soft)] border border-[var(--terra)]",
      value: aqiVal,
      decimals: 0,
      unit: "AQI",
      pill: {
        tone: aqiTone,
        label: t(aqiVal > thresholds.aqiHigh ? "Poor" : aqiVal > 100 ? "Moderate" : "Good"),
      },
      series: aqiSeries,
      sparkColor: "var(--terra)",
    },
  ];

  return (
    <>
      {sensors.map((s) => (
        <div key={s.key} className="col-span-12 md:col-span-3 h-full">
          <SensorCard
            def={s}
            rawText={
              showRaw && (s.key === "soil" || s.key === "aqi")
                ? `RAW ${s.key === "soil" ? soilRaw : mqRaw}`
                : undefined
            }
          />
        </div>
      ))}
    </>
  );
}

export function RainChip({ isRaining }: { isRaining: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-[12px] text-xs font-editorial-mono font-bold uppercase tracking-wider border transition-all",
        isRaining
          ? "bg-sky-500/20 border-sky-400/40 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.2)] animate-pulse"
          : "bg-zinc-800/40 border-zinc-700/50 text-zinc-400"
      )}
    >
      <CloudRain className={cn("w-3.5 h-3.5", isRaining ? "text-sky-300" : "text-zinc-400")} />
      <span>RAIN: {isRaining ? "DETECTED" : "NONE"}</span>
    </div>
  );
}

export const SensorCard = memo(function SensorCard({ def, rawText }: { def: SensorDef; rawText?: string }) {
  const Icon = def.icon;
  const body = (
    <>
      {/* Header row = mono uppercase label left + status stamp right */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px]",
              def.iconTint,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <p className="truncate font-editorial-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-2)]">
            {def.label}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {rawText && (
            <span className="font-editorial-mono text-[9px] text-[#E4C57E] font-bold bg-[#B98A3E]/10 px-1.5 py-0.5 border border-[#B98A3E]/30 rounded-none uppercase tracking-wider">
              {rawText}
            </span>
          )}
          <StatusPill tone={def.pill.tone} pulse={def.alertPulse}>
            {def.pill.label}
          </StatusPill>
        </div>
      </div>

      {/* Metrics 40px 800 ink tabular */}
      <div className="flex items-baseline gap-1.5">
        <AnimatedNumber value={def.value} decimals={def.decimals} />
        {def.unit && (
          <span className="font-editorial-mono text-xs uppercase tracking-wider text-[var(--ink-3)] font-semibold">
            {def.unit}
          </span>
        )}
      </div>

      {/* Sparkline terra or moss stroke, square dots */}
      <div className="mt-3 pt-2 border-t border-[var(--line)]">
        <Sparkline data={def.series} color={def.sparkColor} />
      </div>
    </>
  );

  return (
    <section
      className={cn(
        "rounded-[12px] p-6 bg-[var(--panel)] border border-[var(--line)] transition-all h-full flex flex-col justify-between",
        def.alertPulse && "border-[var(--terra)] bg-[var(--terra-soft)]/20"
      )}
    >
      <div className="w-full">{body}</div>
    </section>
  );
});
