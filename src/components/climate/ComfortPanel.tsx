"use client";

import { useMemo } from "react";
import { Sprout } from "lucide-react";
import { Card, CardHeader } from "@/components/dashboard/ui";
import { useFarm, useFarmStore } from "@/lib/store";

type Factor = {
  key: string;
  label: string;
  value: number;
  unit: string;
  optimal: [number, number];
  tolerable: [number, number];
  weight: number;
};

function outsideDistance(value: number, [low, high]: [number, number]) {
  return value < low ? low - value : value > high ? value - high : 0;
}

function factorDistance(factor: Factor) {
  if (factor.key === "aqi" && factor.value >= 150) return factor.value - 149;
  return outsideDistance(factor.value, factor.optimal);
}

function penalty(factor: Factor) {
  const distance = factorDistance(factor);
  const [tolLow, tolHigh] = factor.tolerable;
  const [idealLow, idealHigh] = factor.optimal;
  const scale = Math.max(idealLow - tolLow, tolHigh - idealHigh, 1);
  if (factor.key === "aqi") return factor.weight * Math.min(1, distance / 150);
  return factor.weight * Math.min(1, distance / scale);
}

export default function ComfortPanel() {
  const farm = useFarm();
  const mode = useFarmStore((s) => s.settings.mode);
  const factors: Factor[] = [
    { key: "temp", label: "Temperature", value: farm.temp, unit: "°C", optimal: [18, 27], tolerable: [10, 35], weight: 35 },
    { key: "humidity", label: "Humidity", value: farm.hum, unit: "%", optimal: [60, 80], tolerable: [40, 90], weight: 25 },
    { key: "soil", label: "Soil moisture", value: farm.soil, unit: "%", optimal: [30, 75], tolerable: [0, 100], weight: 25 },
    { key: "aqi", label: "Air quality", value: farm.aqi, unit: " AQI", optimal: [0, 149.999], tolerable: [0, 300], weight: 15 },
  ];

  const { score, worst } = useMemo(() => {
    const scored = factors.map((factor) => ({ factor, penalty: penalty(factor) }));
    return {
      score: Math.round(100 - scored.reduce((sum, item) => sum + item.penalty, 0)),
      worst: scored.reduce((a, b) => (b.penalty > a.penalty ? b : a)),
    };
  }, [farm.temp, farm.hum, farm.soil, farm.aqi]);

  const outside = factorDistance(worst.factor);
  const delta = outside.toFixed(worst.factor.key === "aqi" ? 0 : 1);
  const reason = outside === 0
    ? "All measured factors are inside their optimal bands."
    : worst.factor.key === "temp" && farm.temp > 35
      ? `${delta}°C above happy zone → blossom-drop risk`
      : worst.factor.key === "temp" && farm.temp < 10
        ? `${delta}°C below happy zone → cold stress risk`
        : `${delta}${worst.factor.unit} ${worst.factor.value < worst.factor.optimal[0] ? "below" : "above"} happy zone → ${worst.factor.label.toLowerCase()} stress risk`;

  return (
    <Card className="h-full">
      <CardHeader
        title="Crop Comfort"
        subtitle="Temperature comfort zone plus a weighted score from four live factors"
        action={<span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-extrabold tracking-wider text-emerald-200">SCIENCE-RULES • LIVE DATA</span>}
      />
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300"><Sprout className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-white">Tomato · {mode === "live" ? "LIVE telemetry" : "SIMULATION"}</p>
          <p className="text-[11px] text-zinc-500">{reason}</p>
        </div>
        <strong className="text-2xl tabular-nums text-white">{score}<span className="text-sm text-zinc-500">/100</span></strong>
      </div>

      <div className="mb-4">
        <div
          className="relative h-4 rounded-full border border-white/10"
          style={{ background: "linear-gradient(90deg, #ef4444 0%, #ef4444 40%, #22c55e 40%, #22c55e 60%, #ef4444 60%, #ef4444 100%)" }}
          role="meter"
          aria-label="Tomato temperature comfort zone"
          aria-valuemin={0}
          aria-valuemax={45}
          aria-valuenow={farm.temp}
        >
          <span className="absolute -top-1.5 h-7 w-1.5 rounded-full border border-white bg-white shadow-[0_0_10px_rgba(255,255,255,0.85)]" style={{ left: `${Math.max(0, Math.min(100, (farm.temp / 45) * 100))}%`, transform: "translateX(-50%)" }} />
        </div>
        <div className="mt-1 flex justify-between text-[9px] font-bold tabular-nums text-zinc-500"><span>0°C · cold stress</span><span>18–27°C · optimal</span><span>45°C · heat stress</span></div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {factors.map((factor) => {
          const value = factor.value;
          const distance = factorDistance(factor);
          return (
            <div key={factor.key} className="rounded-xl border border-white/5 bg-black/30 px-3 py-2">
              <p className="text-[10px] font-bold text-zinc-500">{factor.label}</p>
              <p className="mt-0.5 text-sm font-extrabold tabular-nums text-white">{value.toFixed(factor.key === "aqi" ? 0 : 1)}{factor.unit}</p>
              <p className="text-[9px] text-zinc-600">Optimal {factor.key === "aqi" ? "<150" : `${factor.optimal[0]}–${factor.optimal[1]}${factor.unit}`}{distance > 0 ? ` · −${penalty(factor).toFixed(1)} pts` : " · in zone"}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-zinc-500">Thresholds: FAO tomato agro-requirements; ICAR-IIHR guidelines</p>
    </Card>
  );
}
