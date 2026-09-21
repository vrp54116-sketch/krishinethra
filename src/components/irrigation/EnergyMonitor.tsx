"use client";

import { memo, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sun, Zap } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { PUMP_CURRENT_A } from "@/lib/simulation-engine";
import { AnimatedNumber, Card, CardHeader } from "@/components/dashboard/ui";

/* 5V DC mini-pump electrics (matches the field hardware spec). */
const PUMP_VOLTS = 5;
const PUMP_WATTS = PUMP_CURRENT_A * PUMP_VOLTS; // 1.25 W
const ENERGY_RATE = 8; // ₹/kWh

function fmtKwh(kwh: number): string {
  return kwh >= 0.01 ? kwh.toFixed(3) : kwh.toFixed(6);
}

function fmtRs(rs: number): string {
  return rs >= 0.01 ? rs.toFixed(2) : rs.toFixed(4);
}

function EnergyMonitorInner() {
  const t = useT();
  const totalRunSeconds = useFarmStore((s) => s.pump.totalRunSeconds);

  const kwhToday = (PUMP_WATTS * totalRunSeconds) / 3_600_000;
  const costToday = kwhToday * ENERGY_RATE;

  const projection = useMemo(() => {
    const daily = kwhToday; // assume today's run-rate continues
    return Array.from({ length: 30 }, (_, i) => ({
      day: `D${i + 1}`,
      kwh: Math.round(daily * (i + 1) * 1_000_000) / 1_000_000,
      cost: Math.round(daily * (i + 1) * ENERGY_RATE * 10000) / 10000,
    }));
  }, [kwhToday]);

  const monthlyKwh = projection.length > 0 ? projection[projection.length - 1].kwh : 0;
  const monthlyCost = monthlyKwh * ENERGY_RATE;

  return (
    <Card>
      <CardHeader
        title={t("irrigation.energyTitle")}
        subtitle={`${PUMP_WATTS} W pump (${PUMP_CURRENT_A} A × ${PUMP_VOLTS} V DC)`}
        action={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
            <Zap className="h-4 w-4" />
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">kWh today</p>
          <p className="mt-1 truncate text-xl font-semibold tracking-tight tabular-nums">
            <AnimatedNumber value={kwhToday} decimals={kwhToday >= 0.01 ? 3 : 6} />
            <span className="ml-1 text-xs font-semibold text-zinc-400">kWh</span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
            {PUMP_CURRENT_A}A × {PUMP_VOLTS}V × {Math.round(totalRunSeconds)}s
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Est. cost</p>
          <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
            ₹<AnimatedNumber value={costToday} decimals={costToday >= 0.01 ? 2 : 4} />
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-400">@ ₹{ENERGY_RATE}/kWh</p>
        </div>
      </div>

      <p className="mb-1 mt-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        Monthly projection — {fmtKwh(monthlyKwh)} kWh ≈ ₹{fmtRs(monthlyCost)}
      </p>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projection} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => (v >= 0.01 ? v.toFixed(2) : v.toFixed(4))} />
            <Tooltip
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
              formatter={(v, name) => [
                name === "kwh" ? `${fmtKwh(Number(v))} kWh` : `₹${fmtRs(Number(v))}`,
                name === "kwh" ? "Energy" : "Cost",
              ]}
              labelFormatter={(l) => `Day ${String(l).slice(1)}`}
            />
            <Line type="monotone" dataKey="kwh" stroke="#38BDF8" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/[0.07] px-3 py-2.5 text-[11px] font-medium text-amber-100">
        <Sun className="h-4 w-4 shrink-0 text-amber-300" />
        Solar-compatible: a 10W panel can fully power this {PUMP_WATTS}W pump — run sunshine, store sunshine.
      </div>
    </Card>
  );
}

export default memo(EnergyMonitorInner);
