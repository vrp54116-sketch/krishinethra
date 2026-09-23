"use client";

import { useMemo, useState } from "react";
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
  Calendar,
  Clock,
  Droplets,
  Gauge,
  Layers,
  Thermometer,
  Wind,
  CloudRain,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { LiquidButton, LiquidToggle } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

type SensorKey = "soil" | "temp" | "hum" | "aqi" | "rain" | "tank";

interface SensorMetric {
  key: SensorKey;
  name: string;
  unit: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  icon: any;
  getValue: (point: any) => number;
}

const METRICS: SensorMetric[] = [
  {
    key: "soil",
    name: "Soil Moisture",
    unit: "%",
    color: "#10b981",
    gradientFrom: "rgba(16, 185, 129, 0.4)",
    gradientTo: "rgba(16, 185, 129, 0.0)",
    icon: Droplets,
    getValue: (p) => p.soil ?? p.soilMoistureB ?? 45,
  },
  {
    key: "temp",
    name: "Temperature",
    unit: "°C",
    color: "#f59e0b",
    gradientFrom: "rgba(245, 158, 11, 0.4)",
    gradientTo: "rgba(245, 158, 11, 0.0)",
    icon: Thermometer,
    getValue: (p) => p.temp ?? p.tempC ?? 30,
  },
  {
    key: "hum",
    name: "Humidity",
    unit: "%",
    color: "#06b6d4",
    gradientFrom: "rgba(6, 182, 212, 0.4)",
    gradientTo: "rgba(6, 182, 212, 0.0)",
    icon: Wind,
    getValue: (p) => p.hum ?? p.humidity ?? 60,
  },
  {
    key: "aqi",
    name: "Air Quality (AQI)",
    unit: "",
    color: "#a855f7",
    gradientFrom: "rgba(168, 85, 247, 0.4)",
    gradientTo: "rgba(168, 85, 247, 0.0)",
    icon: Gauge,
    getValue: (p) => p.aqi ?? 85,
  },
  {
    key: "rain",
    name: "Rain Precipitation",
    unit: "mm",
    color: "#3b82f6",
    gradientFrom: "rgba(59, 130, 246, 0.4)",
    gradientTo: "rgba(59, 130, 246, 0.0)",
    icon: CloudRain,
    getValue: (p) => p.rainMm ?? (p.rain ? 2.5 : 0),
  },
  {
    key: "tank",
    name: "Tank Level",
    unit: "%",
    color: "#6366f1",
    gradientFrom: "rgba(99, 102, 241, 0.4)",
    gradientTo: "rgba(99, 102, 241, 0.0)",
    icon: Layers,
    getValue: (p) => p.tankLevelPercent ?? 78,
  },
];

export default function SensorsPage() {
  const sensorHistory = useFarmStore((s) => s.sensorHistory);
  const snapshot = useFarmStore((s) => s.snapshot);
  const [selectedMetric, setSelectedMetric] = useState<SensorKey>("soil");
  const [viewMode, setViewMode] = useState<"area" | "line">("area");

  // Format 1-hour dataset (last 60 data points or synthetic points)
  const chartData = useMemo(() => {
    if (sensorHistory && sensorHistory.length > 0) {
      return sensorHistory.slice(-60).map((pt, idx) => {
        const timeLabel = new Date(pt.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        return {
          time: timeLabel,
          timestamp: pt.timestamp,
          soil: Math.round(pt.soil ?? pt.soilMoistureB ?? 45),
          temp: Number((pt.temp ?? pt.tempC ?? 30).toFixed(1)),
          hum: Math.round(pt.hum ?? pt.humidity ?? 60),
          aqi: Math.round(pt.aqi ?? 85),
          rain: Number((pt.rainMm ?? (pt.rain ? 2.5 : 0)).toFixed(1)),
          tank: Math.round(pt.tankLevelPercent ?? 78),
        };
      });
    }

    // Fallback generator for smooth charts if store history is fresh
    const now = Date.now();
    return Array.from({ length: 30 }).map((_, i) => {
      const t = new Date(now - (30 - i) * 60 * 1000);
      return {
        time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: t.getTime(),
        soil: Math.round(snapshot.soil ?? 45) + Math.sin(i * 0.4) * 4,
        temp: Number(((snapshot.temp ?? 30) + Math.sin(i * 0.3) * 1.5).toFixed(1)),
        hum: Math.round(snapshot.hum ?? 60) + Math.cos(i * 0.4) * 3,
        aqi: Math.round(snapshot.aqi ?? 85) + Math.sin(i * 0.5) * 5,
        rain: snapshot.rain ? 1.8 + Math.random() * 0.6 : 0,
        tank: Math.round(snapshot.tankLevelPercent ?? 78) - (i * 0.1),
      };
    });
  }, [sensorHistory, snapshot]);

  // Calculate statistics (min, max, avg) for each metric
  const stats = useMemo(() => {
    const res: Record<SensorKey, { min: number; max: number; avg: number; current: number }> = {
      soil: { min: 0, max: 0, avg: 0, current: 0 },
      temp: { min: 0, max: 0, avg: 0, current: 0 },
      hum: { min: 0, max: 0, avg: 0, current: 0 },
      aqi: { min: 0, max: 0, avg: 0, current: 0 },
      rain: { min: 0, max: 0, avg: 0, current: 0 },
      tank: { min: 0, max: 0, avg: 0, current: 0 },
    };

    METRICS.forEach((m) => {
      const values = chartData.map((d: any) => Number(d[m.key]) || 0);
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
    const headers = ["Timestamp", "Time", "SoilMoisture_%", "Temp_C", "Humidity_%", "AQI", "Rain_mm", "TankLevel_%"];
    const rows = chartData.map((d) => [
      d.timestamp,
      `"${d.time}"`,
      d.soil,
      d.temp,
      d.hum,
      d.aqi,
      d.rain,
      d.tank,
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
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="liquid-glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-400/20 shadow-inner">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Sensor Health & 1-Hour Telemetry
              </h1>
              <p className="text-xs text-zinc-400">
                High-resolution temporal telemetry • ESP32 & Arduino UNO Edge Node
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="liquid-button inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 transition-all shadow-lg hover:shadow-emerald-500/10"
          >
            <ArrowDownToLine className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Selector Pills & Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {METRICS.map((m) => {
          const isSelected = selectedMetric === m.key;
          const stat = stats[m.key];
          const Icon = m.icon;

          return (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={cn(
                "liquid-glass-card text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 group relative overflow-hidden",
                isSelected
                  ? "border-emerald-400/40 bg-emerald-500/[0.08] shadow-[0_0_24px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/30"
                  : "border-white/10 hover:border-white/20 bg-white/[0.03]",
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className="p-2 rounded-xl border border-white/10"
                  style={{ backgroundColor: `${m.color}15` }}
                >
                  <Icon className="h-4 w-4" style={{ color: m.color }} />
                </div>
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
                )}
              </div>

              <div>
                <p className="text-[11px] font-medium text-zinc-400 truncate">
                  {m.name}
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold text-white tracking-tight">
                    {stat.current}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">{m.unit}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                <span>Avg: {stat.avg}</span>
                <span>Max: {stat.max}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main 1-Hour Chart */}
      <div className="liquid-glass-card rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl border border-white/10"
              style={{ backgroundColor: `${activeMetric.color}15` }}
            >
              <activeMetric.icon className="h-5 w-5" style={{ color: activeMetric.color }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {activeMetric.name} History
                <span className="text-xs font-normal text-zinc-400">
                  (Past 60 Minutes)
                </span>
              </h2>
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 mt-0.5">
                <span>Min: <strong className="text-white">{stats[selectedMetric].min}{activeMetric.unit}</strong></span>
                <span>Max: <strong className="text-white">{stats[selectedMetric].max}{activeMetric.unit}</strong></span>
                <span>Avg: <strong className="text-white">{stats[selectedMetric].avg}{activeMetric.unit}</strong></span>
              </div>
            </div>
          </div>

          {/* Toggle Area vs Line */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("area")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                viewMode === "area"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              Area Graph
            </button>
            <button
              onClick={() => setViewMode("line")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                viewMode === "line"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              Line Graph
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="mt-6 h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "area" ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="time"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  unit={activeMetric.unit}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(18, 20, 29, 0.85)",
                    backdropFilter: "blur(16px)",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  formatter={(val: any) => [`${val} ${activeMetric.unit}`, activeMetric.name]}
                  labelStyle={{ color: "#a1a1aa", marginBottom: "4px" }}
                />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={activeMetric.color}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#grad-${selectedMetric})`}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="time"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  unit={activeMetric.unit}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(18, 20, 29, 0.85)",
                    backdropFilter: "blur(16px)",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  formatter={(val: any) => [`${val} ${activeMetric.unit}`, activeMetric.name]}
                  labelStyle={{ color: "#a1a1aa", marginBottom: "4px" }}
                />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={activeMetric.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: activeMetric.color, stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
