"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Sprout, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { Card, CardHeader, StatusPill } from "@/components/dashboard/ui";
import { CROP_PROFILES, currentPressure, type CropId } from "./shared";

function ComfortBar({
  min,
  max,
  idealMin,
  idealMax,
  value,
  unit,
  invert,
}: {
  min: number;
  max: number;
  idealMin: number;
  idealMax: number;
  value: number;
  unit: string;
  /** For AQI: ideal zone starts at min (lower is better). */
  invert?: boolean;
}) {
  const pct = (v: number) =>
    Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  const inside = value >= idealMin && value <= idealMax;
  return (
    <div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={cn(
            "absolute inset-y-0 rounded-full",
            inside
              ? "bg-emerald-500/70 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
              : "bg-emerald-500/30",
          )}
          style={{
            left: `${pct(idealMin)}%`,
            width: `${Math.max(2, pct(idealMax) - pct(idealMin))}%`,
          }}
        />
        <div
          className={cn(
            "absolute top-1/2 h-4 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black",
            inside
              ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
              : "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.9)]",
          )}
          style={{ left: `${pct(value)}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums">
        <span className="text-zinc-600">
          {min}
          {unit}
        </span>
        <span className={cn("font-semibold", inside ? "text-emerald-300" : "text-amber-300")}>
          ideal {idealMin}–{idealMax}
          {unit} · now {value.toFixed(invert ? 0 : 1)}
          {unit}
        </span>
        <span className="text-zinc-600">
          {max}
          {unit}+
        </span>
      </div>
    </div>
  );
}

export default function ComfortPanel() {
  const snapshot = useFarmStore((s) => s.snapshot);
  const [cropId, setCropId] = useState<CropId>("tomato");

  const profile =
    CROP_PROFILES.find((c) => c.id === cropId) ?? CROP_PROFILES[0];
  const pressure = currentPressure(snapshot);

  const rows = [
    {
      key: "temp",
      label: "Temperature",
      min: 0,
      max: 45,
      idealMin: profile.temp[0],
      idealMax: profile.temp[1],
      value: snapshot.tempC,
      unit: "°C",
      decimals: 1,
    },
    {
      key: "humidity",
      label: "Humidity",
      min: 0,
      max: 100,
      idealMin: profile.humidity[0],
      idealMax: profile.humidity[1],
      value: snapshot.humidity,
      unit: "%",
      decimals: 1,
    },
    {
      key: "light",
      label: "Light",
      min: 0,
      max: 900,
      idealMin: profile.light[0],
      idealMax: profile.light[1],
      value: snapshot.lightLux,
      unit: " lux",
      decimals: 0,
    },
    {
      key: "aqi",
      label: "Air quality",
      min: 0,
      max: 300,
      idealMin: 0,
      idealMax: profile.aqiMax,
      value: snapshot.aqi,
      unit: "",
      decimals: 0,
      invert: true,
    },
  ];

  const insideCount = rows.filter(
    (r) => snapshotFor(r.key) >= r.idealMin && snapshotFor(r.key) <= r.idealMax,
  ).length;

  function snapshotFor(key: string): number {
    if (key === "temp") return snapshot.tempC;
    if (key === "humidity") return snapshot.humidity;
    if (key === "light") return snapshot.lightLux;
    return snapshot.aqi;
  }

  const allGood = insideCount === rows.length;

  return (
    <Card className="h-full">
      <CardHeader
        title="Crop Comfort Panel"
        subtitle="Is the live climate inside your crop's happy zone?"
        action={
          <div className="relative">
            <select
              value={cropId}
              onChange={(e) => setCropId(e.target.value as CropId)}
              className="appearance-none rounded-xl border border-emerald-500/30 bg-black/60 py-2 pl-3 pr-9 text-xs font-bold text-white outline-none transition-colors focus:border-emerald-400/60"
              aria-label="Select crop"
            >
              {CROP_PROFILES.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a120c]">
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
          </div>
        }
      />

      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
          <Sprout className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-white">{profile.label}</p>
          <p className="truncate text-[11px] text-zinc-500">
            Pressure {pressure.toFixed(1)} hPa · live field readings
          </p>
        </div>
        <StatusPill tone={allGood ? "good" : "warn"}>
          {insideCount}/{rows.length} ideal
        </StatusPill>
      </div>

      <div className="space-y-4">
        {rows.map((r) => {
          const inside =
            snapshotFor(r.key) >= r.idealMin && snapshotFor(r.key) <= r.idealMax;
          return (
            <div
              key={r.key}
              className="rounded-xl border border-white/5 bg-black/30 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-zinc-200">{r.label}</p>
                {inside ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> In zone
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                    <TriangleAlert className="h-3.5 w-3.5" /> Outside
                  </span>
                )}
              </div>
              <ComfortBar
                min={r.min}
                max={r.max}
                idealMin={r.idealMin}
                idealMax={r.idealMax}
                value={Math.max(r.min, Math.min(r.max, snapshotFor(r.key)))}
                unit={r.unit}
                invert={r.invert}
              />
            </div>
          );
        })}
      </div>

      <p className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-xs leading-relaxed text-zinc-300">
        <span className="font-bold text-emerald-200">Agronomist note — </span>
        {profile.note}
      </p>
    </Card>
  );
}
