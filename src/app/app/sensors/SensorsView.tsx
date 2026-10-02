"use client";

import { memo, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  ArrowDownToLine,
  Droplets,
  Gauge,
  Thermometer,
  Wind,
  CloudRain,
  type LucideIcon,
} from "lucide-react";
import { useFarm, useFarmStore } from "@/lib/store";
import type { SensorHistoryPoint } from "@/lib/types";
import { cn } from "@/lib/utils";
import { resampleChartPoints } from "@/components/dashboard/ui";

type SensorKey = "soil" | "temp" | "hum" | "aqi" | "rain";

interface SensorMetric {
  key: SensorKey;
  name: string;
  unit: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  icon: LucideIcon;
  getValue: (point: SensorHistoryPoint) => number;
}

interface ChartPoint {
  time: string;
  timestamp: number;
  soil: number;
  temp: number;
  hum: number;
  aqi: number;
  rain: number;
}

const METRICS: SensorMetric[] = [
  {
    key: "soil",
    name: "Soil Moisture",
    unit: "%",
    color: "#5F8B6A", // moss
    gradientFrom: "rgba(95, 139, 106, 0.4)",
    gradientTo: "rgba(95, 139, 106, 0.0)",
    icon: Droplets,
    getValue: (p) => p.soil ?? p.soilMoistureB ?? 45,
  },
  {
    key: "temp",
    name: "Temperature",
    unit: "°C",
    color: "#C4503A", // terra
    gradientFrom: "rgba(196, 80, 58, 0.4)",
    gradientTo: "rgba(196, 80, 58, 0.0)",
    icon: Thermometer,
    getValue: (p) => p.temp ?? p.tempC ?? 30,
  },
  {
    key: "hum",
    name: "Humidity",
    unit: "%",
    color: "#5F8B6A", // moss
    gradientFrom: "rgba(95, 139, 106, 0.4)",
    gradientTo: "rgba(95, 139, 106, 0.0)",
    icon: Wind,
    getValue: (p) => p.hum ?? p.humidity ?? 60,
  },
  {
    key: "aqi",
    name: "Air Quality (AQI)",
    unit: "",
    color: "#D4A359", // gold
    gradientFrom: "rgba(212, 163, 89, 0.4)",
    gradientTo: "rgba(212, 163, 89, 0.0)",
    icon: Gauge,
    getValue: (p) => p.aqi ?? 85,
  },
  {
    key: "rain",
    name: "Rain Status",
    unit: "DETECT",
    color: "#38BDF8", // sky
    gradientFrom: "rgba(56, 189, 248, 0.4)",
    gradientTo: "rgba(56, 189, 248, 0.0)",
    icon: CloudRain,
    getValue: (p) => (p.rain ? 1 : 0),
  },
];

const tooltipStyle = {
  backgroundColor: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 0,
  boxShadow: "none",
  fontSize: "11px",
  fontFamily: "var(--font-editorial-mono), monospace",
  color: "var(--ink)",
  padding: "4px 8px",
};

export const SensorsChart = memo(function SensorsChart({
  viewMode,
  chartData,
  selectedMetric,
  activeMetric,
}: {
  viewMode: "area" | "line";
  chartData: ChartPoint[];
  selectedMetric: SensorKey;
  activeMetric: SensorMetric;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {viewMode === "area" ? (
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="var(--ink-2)"
            fontSize={10}
            fontFamily="var(--font-editorial-mono), monospace"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--ink-2)"
            fontSize={10}
            fontFamily="var(--font-editorial-mono), monospace"
            tickLine={false}
            axisLine={false}
            unit={activeMetric.unit}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(val: unknown) => [`${String(val)} ${activeMetric.unit}`, activeMetric.name]}
            labelStyle={{ color: "var(--ink-2)", marginBottom: "4px" }}
          />
          <Area
            type="monotone"
            dataKey={selectedMetric}
            stroke={activeMetric.color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#grad-${selectedMetric})`}
            isAnimationActive={false}
          />
        </AreaChart>
      ) : (
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="var(--ink-2)"
            fontSize={10}
            fontFamily="var(--font-editorial-mono), monospace"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--ink-2)"
            fontSize={10}
            fontFamily="var(--font-editorial-mono), monospace"
            tickLine={false}
            axisLine={false}
            unit={activeMetric.unit}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(val: unknown) => [`${String(val)} ${activeMetric.unit}`, activeMetric.name]}
            labelStyle={{ color: "var(--ink-2)", marginBottom: "4px" }}
          />
          <Line
            type="monotone"
            dataKey={selectedMetric}
            stroke={activeMetric.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: activeMetric.color, stroke: "var(--panel)", strokeWidth: 1 }}
            isAnimationActive={false}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
});

export default function SensorsView() {
  const sensorHistory = useFarmStore((s) => s.sensorHistory);
  const farm = useFarm();
  const [selectedMetric, setSelectedMetric] = useState<SensorKey>("soil");
  const [viewMode, setViewMode] = useState<"area" | "line">("area");

  // Format 1-hour dataset (resampled to max 60 points / 1 pt/s)
  const chartData = useMemo<ChartPoint[]>(() => {
    if (sensorHistory && sensorHistory.length > 0) {
      const mapped = sensorHistory.map((pt) => {
        const timeLabel = new Date(pt.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        return {
          time: timeLabel,
          timestamp: pt.timestamp,
          soil: Math.round(pt.soil ?? pt.soilMoistureB ?? 45),
          temp: Number((pt.temp ?? pt.tempC ?? 30).toFixed(1)),
          hum: Math.round(pt.hum ?? pt.humidity ?? 60),
          aqi: Math.round(pt.aqi ?? 85),
          rain: pt.rain ? 1 : 0,
        };
      });
      return resampleChartPoints(mapped, 60);
    }

    // Deterministic fallback for smooth charts if store history is fresh
    const baseTime = farm.snapshot?.timestamp && farm.snapshot.timestamp > 0 ? farm.snapshot.timestamp : 1774000000000;
    const fallback = Array.from({ length: 30 }).map((_, i) => {
      const t = new Date(baseTime - (30 - i) * 60 * 1000);
      return {
        time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
        timestamp: t.getTime(),
        soil: Math.round(farm.soil) + Math.sin(i * 0.4) * 4,
        temp: Number((farm.temp + Math.sin(i * 0.3) * 1.5).toFixed(1)),
        hum: Math.round(farm.hum) + Math.cos(i * 0.4) * 3,
        aqi: Math.round(farm.aqi) + Math.sin(i * 0.5) * 5,
        rain: farm.rain ? 1 : 0,
      };
    });
    return resampleChartPoints(fallback, 60);
  }, [sensorHistory, farm.soil, farm.temp, farm.hum, farm.aqi, farm.rain, farm.snapshot?.timestamp]);

  // Calculate statistics (min, max, avg) for each metric
  const stats = useMemo(() => {
    const res: Record<SensorKey, { min: number; max: number; avg: number; current: number }> = {
      soil: { min: 0, max: 0, avg: 0, current: 0 },
      temp: { min: 0, max: 0, avg: 0, current: 0 },
      hum: { min: 0, max: 0, avg: 0, current: 0 },
      aqi: { min: 0, max: 0, avg: 0, current: 0 },
      rain: { min: 0, max: 0, avg: 0, current: 0 },
    };

    METRICS.forEach((m) => {
      const values = chartData.map((d) => Number(d[m.key]) || 0);
      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const current = values[values.length - 1];
        res[m.key] = {
          min: Number(min.toFixed(1)),
          max: Number(max.toFixed(1)),
          avg: Number(avg.toFixed(1)),
          current: Number(current.toFixed(1)),
        };
      }
    });

    return res;
  }, [chartData]);

  const activeMetric = METRICS.find((m) => m.key === selectedMetric) || METRICS[0];

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Time", "SoilMoisture_%", "Temp_C", "Humidity_%", "AQI", "RainDetected"];
    const rows = chartData.map((d) => [
      d.timestamp,
      `"${d.time}"`,
      d.soil,
      d.temp,
      d.hum,
      d.aqi,
      d.rain,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `krishinethra_sensors_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-16 font-editorial-mono">
      {/* Header */}
      <div className="rounded-none border border-[var(--line)] bg-[var(--panel)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-none border border-[var(--line)] bg-[var(--panel-2)] text-[var(--terra)]">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                SENSOR TELEMETRY & HEALTH
              </h1>
              <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wide">
                HIGH-RESOLUTION 1-HOUR EDGE TELEMETRY • ESP32 EDGE NODE
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider text-[var(--ink)] bg-[var(--panel-2)] hover:bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--ink-2)] transition-all cursor-pointer"
          >
            <ArrowDownToLine className="h-3.5 w-3.5 text-[var(--terra)]" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Selector Pills & Stat Cards (Bordered square cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {METRICS.map((m) => {
          const isSelected = selectedMetric === m.key;
          const stat = stats[m.key];
          const Icon = m.icon;

          return (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={cn(
                "text-left p-3 rounded-none border transition-colors flex flex-col justify-between gap-2.5 select-none cursor-pointer",
                isSelected
                  ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--ink)]"
                  : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:border-[var(--ink-3)] hover:text-[var(--ink)]",
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className="p-1.5 rounded-none border border-[var(--line)] bg-[var(--panel-2)]"
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                </div>
                {isSelected && (
                  <span className="h-2 w-2 rounded-none bg-[var(--terra)]" />
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)] truncate">
                  {m.name}
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black tabular-nums text-[var(--ink)]">
                    {stat.current}
                  </span>
                  <span className="text-xs text-[var(--ink-3)]">{m.unit}</span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-[var(--line)] flex items-center justify-between text-[9px] text-[var(--ink-3)] tabular-nums uppercase">
                <span>AVG: {stat.avg}</span>
                <span>MAX: {stat.max}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main 1-Hour Chart */}
      <div className="rounded-none border border-[var(--line)] bg-[var(--panel)] p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-none border border-[var(--line)] bg-[var(--panel-2)]"
            >
              <activeMetric.icon className="h-4 w-4" style={{ color: activeMetric.color }} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                {activeMetric.name} HISTORY
                <span className="text-[10px] font-normal text-[var(--ink-3)]">
                  (PAST 60 MINUTES)
                </span>
              </h2>
              <div className="flex items-center gap-3 text-[10px] text-[var(--ink-3)] tabular-nums mt-0.5">
                <span>MIN: <strong className="text-[var(--ink)]">{stats[selectedMetric].min}{activeMetric.unit}</strong></span>
                <span>MAX: <strong className="text-[var(--ink)]">{stats[selectedMetric].max}{activeMetric.unit}</strong></span>
                <span>AVG: <strong className="text-[var(--ink)]">{stats[selectedMetric].avg}{activeMetric.unit}</strong></span>
              </div>
            </div>
          </div>

          {/* Toggle Area vs Line */}
          <div className="flex items-center border border-[var(--line)] bg-[var(--panel-2)] self-start sm:self-auto rounded-none">
            <button
              onClick={() => setViewMode("area")}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none",
                viewMode === "area"
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "text-[var(--ink-2)] hover:text-[var(--ink)]",
              )}
            >
              AREA
            </button>
            <button
              onClick={() => setViewMode("line")}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none",
                viewMode === "line"
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "text-[var(--ink-2)] hover:text-[var(--ink)]",
              )}
            >
              LINE
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="mt-4 h-[320px] w-full">
          <SensorsChart
            viewMode={viewMode}
            chartData={chartData}
            selectedMetric={selectedMetric}
            activeMetric={activeMetric}
          />
        </div>
      </div>
    </div>
  );
}
