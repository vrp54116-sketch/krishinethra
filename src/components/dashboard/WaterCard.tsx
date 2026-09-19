"use client";

import { memo, useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Droplets, IndianRupee, Zap } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { AnimatedNumber, Card, CardHeader, useMounted } from "./ui";

/** Deterministic pseudo-history (0.25–1.09 L) so the 7-day chart is stable. */
function seededLitres(dateISO: string): number {
  let h = 0;
  for (let i = 0; i < dateISO.length; i++) h = (h * 31 + dateISO.charCodeAt(i)) >>> 0;
  return 0.25 + ((h % 85) + 85) % 85 / 100;
}

function isoDaysAgo(n: number): { iso: string; label: string } {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const iso = d.toISOString().slice(0, 10);
  const label = d.toLocaleDateString("en-IN", { weekday: "short" });
  return { iso, label };
}

// Pump electrics: 230 V mains × 0.25 A ≈ 57.5 W.
const PUMP_WATTS = 230 * 0.25;
const WATER_RATE = 0.02; // ₹/L
const ENERGY_RATE = 8; // ₹/kWh

function WaterCardInner() {
  const t = useT();
  const totalWaterUsedL = useFarmStore((s) => s.totalWaterUsedL);
  const totalRunSeconds = useFarmStore((s) => s.pump.totalRunSeconds);
  // Weekday names also differ between Node (SSR) and Chrome — swap in the
  // real labels only after mount so chart hydration always matches.
  const mounted = useMounted();

  const week = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 1; i--) {
      const { iso, label } = isoDaysAgo(i);
      days.push({
        day: mounted ? label : `D-${i}`,
        litres: Math.round(seededLitres(iso) * 100) / 100,
        today: false,
      });
    }
    days.push({
      day: "Today",
      litres: Math.round(totalWaterUsedL * 100) / 100,
      today: true,
    });
    return days;
  }, [totalWaterUsedL, mounted]);

  const waterCost = totalWaterUsedL * WATER_RATE;
  const kwh = (PUMP_WATTS * totalRunSeconds) / 3_600_000;
  const energyCost = kwh * ENERGY_RATE;

  return (
    <Card>
      <CardHeader title={t("dashboard.waterToday")} subtitle={t("dashboard.waterUsed")} />

      <div className="flex items-end gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
          <Droplets className="h-5 w-5" />
        </span>
        <p className="text-3xl font-extrabold tracking-tight text-white">
          <AnimatedNumber value={totalWaterUsedL} decimals={2} />
          <span className="ml-1 text-sm font-semibold text-zinc-400">L</span>
        </p>
      </div>

      {/* Last 7 days mini bar chart */}
      <div className="mt-2 h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={week} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
            <XAxis
              dataKey="day"
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fill: "#52525b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              cursor={{ fill: "rgba(34,197,94,0.08)" }}
              contentStyle={{
                background: "#0a120c",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 12,
                fontSize: 12,
                color: "#e7f5ec",
              }}
              formatter={(v) => [`${Number(v).toFixed(2)} L`, "Water"]}
            />
            <Bar dataKey="litres" radius={[5, 5, 2, 2]} isAnimationActive={false}>
              {week.map((d) => (
                <Cell key={d.day} fill={d.today ? "#22c55e" : "rgba(34,197,94,0.35)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Estimated cost */}
      <div className="mt-3 space-y-1.5 rounded-xl border border-white/5 bg-black/40 p-3 text-xs">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-sky-300" />
            Water {totalWaterUsedL.toFixed(2)} L × ₹{WATER_RATE}/L
          </span>
          <span className="font-bold tabular-nums text-white">₹{waterCost.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            Energy {kwh.toFixed(3)} kWh × ₹{ENERGY_RATE}
          </span>
          <span className="font-bold tabular-nums text-white">₹{energyCost.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-1.5 font-bold">
          <span className="flex items-center gap-1.5 text-white">
            <IndianRupee className="h-3.5 w-3.5 text-emerald-300" />
            Est. cost today
          </span>
          <span className="tabular-nums text-emerald-300">
            ₹{(waterCost + energyCost).toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default memo(WaterCardInner);
