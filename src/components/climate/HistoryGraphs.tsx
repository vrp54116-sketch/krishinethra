"use client";

import { memo, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { Card, CardHeader } from "@/components/dashboard/ui";
import { buildTwelveHourSeries } from "./shared";

type TabId = "temp" | "humidity" | "aqi" | "light";

const TABS: Array<{
  id: TabId;
  label: string;
  unit: string;
  color: string;
  fill: string;
  dataKey: "tempC" | "humidity" | "aqi" | "lightLux";
  decimals: number;
}> = [
  {
    id: "temp",
    label: "Temperature",
    unit: "°C",
    color: "#ef4444",
    fill: "rgba(239,68,68,0.22)",
    dataKey: "tempC",
    decimals: 1,
  },
  {
    id: "humidity",
    label: "Humidity",
    unit: "%",
    color: "#22d3ee",
    fill: "rgba(34,211,238,0.18)",
    dataKey: "humidity",
    decimals: 1,
  },
  {
    id: "aqi",
    label: "AQI",
    unit: "",
    color: "#a78bfa",
    fill: "rgba(167,139,250,0.2)",
    dataKey: "aqi",
    decimals: 0,
  },
  {
    id: "light",
    label: "Light",
    unit: " lux",
    color: "#facc15",
    fill: "rgba(250,204,21,0.16)",
    dataKey: "lightLux",
    decimals: 0,
  },
];

/**
 * Heavy 48-point climate chart — memoized and throttled.
 * The store ticks every 1s but history only pushes every 5s, and this
 * series rebuilds at most every 5s (timestamp bucketed), so rapid sensor
 * ticks never re-render the chart more than 1/sec.
 */
function HistoryGraphsInner() {
  const snapshot = useFarmStore((s) => s.snapshot);
  const sensorHistory = useFarmStore((s) => s.sensorHistory);
  const [tab, setTab] = useState<TabId>("temp");

  // 5s bucket: snapshot ticks every 1s, chart rebuilds at most 0.2Hz.
  const bucket = Math.floor(snapshot.timestamp / 5000) * 5000;
  const series = useMemo(
    () => buildTwelveHourSeries(snapshot, sensorHistory, 48),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bucket, sensorHistory],
  );

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  // Thin the x labels so 48 points stay readable.
  const data = useMemo(
    () =>
      series.map((p, i) => ({
        ...p,
        tick: i % 8 === 0 || i === series.length - 1 ? p.label : "",
      })),
    [series],
  );

  return (
    <Card>
      <CardHeader
        title="Climate History"
        subtitle="Last 12 simulated hours · live from sensors"
        action={
          <div className="flex gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all sm:px-3",
                  tab === t.id
                    ? "text-black shadow-[0_0_14px_rgba(34,197,94,0.4)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white",
                )}
                style={tab === t.id ? { background: t.color } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id={`climate-${active.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={active.color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={active.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="tick"
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={44}
              domain={["auto", "auto"]}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.2)", strokeDasharray: "4 4" }}
              contentStyle={{
                background: "rgba(18,26,22,0.85)",
                backdropFilter: "blur(20px) saturate(170%)",
                WebkitBackdropFilter: "blur(20px) saturate(170%)",
                border: `1px solid ${active.color}60`,
                borderRadius: 999,
                fontSize: 12,
                color: "#F3F4F6",
                padding: "6px 14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { label?: string } | undefined;
                return p?.label ?? "";
              }}
              formatter={(v) => [
                `${Number(v).toFixed(active.decimals)}${active.unit}`,
                active.label,
              ]}
            />
            <Area
              type="monotone"
              dataKey={active.dataKey}
              stroke={active.color}
              strokeWidth={2.2}
              fill={`url(#climate-${active.id})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-zinc-400">
        Hover any point for the exact reading — the curve ends at the current live
        sensor value.
      </p>
    </Card>
  );
}

export default memo(HistoryGraphsInner);
