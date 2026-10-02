"use client";

import { useMemo } from "react";
import { Card, CardHeader } from "@/components/dashboard/ui";
import { useFarmStore } from "@/lib/store";
import type { SensorHistoryPoint } from "@/lib/types";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type Risk = { name: string; level: RiskLevel; evidence: string };

function closeMiss(value: number, boundary: number) {
  return Math.abs(value - boundary) / Math.max(Math.abs(boundary), 1) < 0.1;
}

function riskLevel(high: boolean, conditions: { met: boolean; near: boolean }[]) : RiskLevel {
  if (high) return "HIGH";
  const misses = conditions.filter((condition) => !condition.met);
  if (misses.length === 1 && misses[0].near) return "MEDIUM";
  return "LOW";
}

function avg(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function valueText(value: number | null, unit: string) {
  return value === null ? `no data${unit}` : `${value.toFixed(1)}${unit}`;
}

function meterValue(level: RiskLevel) {
  return level === "HIGH" ? 100 : level === "MEDIUM" ? 55 : 15;
}

function tone(level: RiskLevel) {
  if (level === "HIGH") return { text: "text-red-300", fill: "bg-red-500", track: "bg-red-500/15" };
  if (level === "MEDIUM") return { text: "text-amber-300", fill: "bg-amber-400", track: "bg-amber-400/15" };
  return { text: "text-emerald-300", fill: "bg-emerald-500", track: "bg-emerald-500/15" };
}

function buildRisks(history: SensorHistoryPoint[]): Risk[] {
  const latest = history.at(-1)?.timestamp ?? Date.now();
  const start = latest - 24 * 60 * 60 * 1000;
  const recent = history.filter((point) => point.timestamp >= start && point.timestamp <= latest);
  const avgTemp = avg(recent.map((point) => point.tempC ?? point.temp ?? NaN).filter(Number.isFinite));
  const avgHum = avg(recent.map((point) => point.humidity ?? point.hum ?? NaN).filter(Number.isFinite));
  const hasRain = recent.some((point) => Boolean(point.rain));
  const temp = avgTemp ?? 0;
  const humidity = avgHum ?? 0;
  const hasReadings = avgTemp !== null && avgHum !== null;
  const suffix = `24h history averages: ${valueText(avgHum, "%")} humidity, ${valueText(avgTemp, "°C")} temperature.`;

  const lateHigh = hasReadings && humidity > 85 && temp >= 10 && temp <= 25 && hasRain;
  const lateConditions = [
    { met: humidity > 85, near: closeMiss(humidity, 85) },
    { met: temp >= 10, near: closeMiss(temp, 10) },
    { met: temp <= 25, near: closeMiss(temp, 25) },
    { met: hasRain, near: false },
  ];
  const earlyHigh = hasReadings && temp > 24 && humidity > 70;
  const earlyConditions = [
    { met: temp > 24, near: closeMiss(temp, 24) },
    { met: humidity > 70, near: closeMiss(humidity, 70) },
  ];
  const curlHigh = hasReadings && temp > 30 && humidity < 40;
  const curlConditions = [
    { met: temp > 30, near: closeMiss(temp, 30) },
    { met: humidity < 40, near: closeMiss(humidity, 40) },
  ];
  const mildewHigh = hasReadings && temp >= 20 && temp <= 30 && humidity >= 50 && humidity <= 70;
  const mildewConditions = [
    { met: temp >= 20, near: closeMiss(temp, 20) },
    { met: temp <= 30, near: closeMiss(temp, 30) },
    { met: humidity >= 50, near: closeMiss(humidity, 50) },
    { met: humidity <= 70, near: closeMiss(humidity, 70) },
  ];

  return [
    { name: "Late Blight", level: hasReadings ? riskLevel(lateHigh, lateConditions) : "LOW", evidence: `because: avg ${valueText(avgHum, "%")} humidity, avg ${valueText(avgTemp, "°C")} temperature, rain ${hasRain ? "detected" : "not detected"} in window.` },
    { name: "Early Blight", level: hasReadings ? riskLevel(earlyHigh, earlyConditions) : "LOW", evidence: `because: ${suffix} Rule requires temperature >24°C and humidity >70%.` },
    { name: "Leaf Curl", level: hasReadings ? riskLevel(curlHigh, curlConditions) : "LOW", evidence: `because: ${suffix} Whitefly-vector climate rule requires temperature >30°C and humidity <40%.` },
    { name: "Powdery Mildew", level: hasReadings ? riskLevel(mildewHigh, mildewConditions) : "LOW", evidence: `because: ${suffix} Rule range is 20–30°C and 50–70% humidity.` },
  ];
}

export default function DiseaseRiskMatrix() {
  const history = useFarmStore((state) => state.sensorHistory);
  const risks = useMemo(() => buildRisks(history), [history]);

  return (
    <Card>
      <CardHeader title="24-hour disease risk matrix" subtitle="Hyperlocal risk rules calculated from this farm’s sensor history" />
      <div className="grid gap-2 sm:grid-cols-2">
        {risks.map((risk) => {
          const colors = tone(risk.level);
          return (
            <div key={risk.name} className="rounded-xl border border-white/5 bg-black/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-white">{risk.name}</span>
                <span className={`text-[10px] font-extrabold tracking-wider ${colors.text}`}>{risk.level}</span>
              </div>
              <div className={`h-2 overflow-hidden rounded-full ${colors.track}`} role="meter" aria-label={`${risk.name} risk`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={meterValue(risk.level)}>
                <div className={`h-full rounded-full transition-[width] duration-300 ${colors.fill}`} style={{ width: `${meterValue(risk.level)}%` }} />
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">{risk.evidence}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-zinc-600">MEDIUM means exactly one temperature or humidity condition misses its boundary by less than 10%. Rain is a stored boolean flag.</p>
    </Card>
  );
}
