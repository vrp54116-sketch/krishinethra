"use client";

import { memo, useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Droplets } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { AnimatedNumber, Card, CardHeader, useMounted } from "@/components/dashboard/ui";
import { isoDaysAgo, seededLitres } from "./shared";

const MANUAL_BASELINE_L_PER_DAY = 6;

function UsageTrackerInner() {
  const t = useT();
  const totalWaterUsedL = useFarmStore((s) => s.totalWaterUsedL);
  const mounted = useMounted();

  const week = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 1; i--) {
      const iso = isoDaysAgo(i);
      const label = mounted
        ? new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short" })
        : `D-${i}`;
      days.push({ day: label, litres: Math.round(seededLitres(iso) * 100) / 100, today: false });
    }
    days.push({
      day: "Today",
      litres: Math.round(totalWaterUsedL * 100) / 100,
      today: true,
    });
    return days;
  }, [totalWaterUsedL, mounted]);

  const monthlyTotal = useMemo(() => {
    let sum = 0;
    for (let i = 29; i >= 1; i--) sum += seededLitres(isoDaysAgo(i));
    return Math.round((sum + totalWaterUsedL) * 100) / 100;
  }, [totalWaterUsedL]);

  const weekActual = week.reduce((s, d) => s + d.litres, 0);
  const weekBaseline = MANUAL_BASELINE_L_PER_DAY * 7;
  const savedL = Math.round((weekBaseline - weekActual) * 100) / 100;
  const savedPct = weekBaseline > 0 ? Math.round((savedL / weekBaseline) * 1000) / 10 : 0;

  return (
    <Card>
      <CardHeader title={t("irrigation.usageTitle")} subtitle={t("dashboard.waterUsed")} />

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Today</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            <AnimatedNumber value={totalWaterUsedL} decimals={2} />
            <span className="ml-1 text-xs font-semibold text-zinc-400">L</span>
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Last 30 days</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            <AnimatedNumber value={monthlyTotal} decimals={1} />
            <span className="ml-1 text-xs font-semibold text-zinc-400">L</span>
          </p>
        </div>
      </div>

      {/* 7-day bar chart */}
      <div className="mt-2 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={week} margin={{ top: 8, right: 4, bottom: 0, left: -14 }}>
            <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
            <Tooltip
              cursor={{ fill: "rgba(56,189,248,0.08)" }}
              contentStyle={{
                background: "rgba(18,26,22,0.85)",
                backdropFilter: "blur(20px) saturate(170%)",
                WebkitBackdropFilter: "blur(20px) saturate(170%)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 999,
                fontSize: 12,
                color: "#F3F4F6",
                padding: "6px 14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              formatter={(v) => [`${Number(v).toFixed(2)} L`, "Water"]}
            />
            <Bar
              dataKey="litres"
              radius={[5, 5, 2, 2]}
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-in-out"
            >
              {week.map((d) => (
                <Cell key={d.day} fill={d.today ? "#38BDF8" : "rgba(56,189,248,0.35)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Water saved vs 6L/day manual baseline */}
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-sky-400/30 bg-sky-500/[0.07] p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-2xl shadow-[0_0_18px_rgba(56,189,248,0.35)]">
          💧
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-300">
            <Droplets className="h-3.5 w-3.5" /> Water saved this week
          </p>
          <p className="mt-0.5 text-xl font-extrabold text-white">
            {savedL.toFixed(2)} L <span className="text-sm font-bold text-emerald-300">({savedPct}% less)</span>
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            {weekActual.toFixed(2)} L used vs {weekBaseline.toFixed(0)} L manual baseline (6 L/day)
          </p>
        </div>
      </div>
    </Card>
  );
}

export default memo(UsageTrackerInner);
