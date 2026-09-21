"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bug,
  CalendarCheck2,
  DatabaseBackup,
  Download,
  Droplets,
  FileSpreadsheet,
  IndianRupee,
  Leaf,
  Printer,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { useFarmStore } from "@/lib/store";
import {
  REPORT_ENERGY_RATE_RS_PER_KWH,
  REPORT_KG_CO2_PER_KWH,
  REPORT_KWH_PER_LITRE,
  REPORT_MANUAL_BASELINE_L_PER_DAY,
  REPORT_PUMP_WATTS,
  REPORT_WATER_RATE_RS_PER_L,
} from "@/lib/store";
import { generatePeriodReport } from "@/lib/ai-engine";
import type { DailySummary, ReportRange } from "@/lib/types";
import { AnimatedNumber, Card, CardHeader } from "@/components/dashboard/ui";
import {
  exportDailyCSV,
  exportFarmBackup,
} from "@/lib/report-export";

function Rise({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

const RANGE_OPTIONS: Array<{ id: ReportRange; label: string }> = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
];

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function shortLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_SHORT[(m || 1) - 1]}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function stampToISODate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

const DISEASE_COLORS: Record<string, string> = {
  Healthy: "#22c55e",
  "Leaf Spot (fungal)": "#f59e0b",
  "Leaf Rust": "#ef4444",
  "Aphids (pest)": "#a855f7",
  "Nutrient Deficiency / Water Stress": "#38bdf8",
};

function diseaseColor(name: string, idx: number): string {
  if (DISEASE_COLORS[name]) return DISEASE_COLORS[name];
  const fallback = ["#2dd4bf", "#f472b6", "#a3e635", "#94a3b8"];
  let h = idx;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return fallback[h % fallback.length];
}

const tooltipStyle = {
  background: "rgba(18,26,22,0.85)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 999,
  fontSize: 12,
  color: "#F3F4F6",
  padding: "6px 14px",
  backdropFilter: "blur(12px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
} as const;

export default function ReportsPage() {
  const [range, setRange] = useState<ReportRange>("7d");

  const dailySummaries = useFarmStore((s) => s.dailySummaries);
  const ensureDailySummaries = useFarmStore((s) => s.ensureDailySummaries);
  const totalWaterUsedL = useFarmStore((s) => s.totalWaterUsedL);
  const farmHealthScore = useFarmStore((s) => s.farmHealthScore);
  const pump = useFarmStore((s) => s.pump);
  const scans = useFarmStore((s) => s.scans);
  const diary = useFarmStore((s) => s.diary);
  const tasks = useFarmStore((s) => s.tasks);
  const snapshot = useFarmStore((s) => s.snapshot);

  // Backfill 30 days of plausible history on first load so monthly views look full.
  useEffect(() => {
    ensureDailySummaries();
  }, [ensureDailySummaries]);

  const today = todayISO();

  // Live today row (merged over the stored row so KPIs match the dashboard).
  const liveToday: DailySummary = useMemo(() => {
    const scansToday = scans.filter((x) => stampToISODate(x.timestamp) === today);
    const diseaseCounts: Record<string, number> = {};
    for (const scan of scansToday) {
      const key = scan.disease || "Unknown";
      diseaseCounts[key] = (diseaseCounts[key] ?? 0) + 1;
    }
    const diaryToday = diary.filter((d) => d.date === today);
    const irrigationFromDiary = diaryToday.filter((d) => d.type === "irrigation").length;
    const irrigationEvents =
      irrigationFromDiary > 0
        ? irrigationFromDiary
        : totalWaterUsedL > 0.05 || pump.totalRunSeconds > 5
          ? 1
          : 0;
    const scope = tasks.filter((t) => t.dueDate <= today);
    const tasksScope = scope.length > 0 ? scope : tasks.filter((t) => t.dueDate === today);
    const energyKwh =
      Math.round(((REPORT_PUMP_WATTS * pump.totalRunSeconds) / 3_600_000) * 1_000_000) /
      1_000_000;
    return {
      date: today,
      healthScore: Math.round(farmHealthScore),
      waterUsedL: Math.round(totalWaterUsedL * 100) / 100,
      energyKwh,
      energyCostRs: Math.round(energyKwh * REPORT_ENERGY_RATE_RS_PER_KWH * 100) / 100,
      scans: scansToday.length,
      scansResolved: scansToday.filter((x) => x.resolved).length,
      diseaseCounts,
      irrigationEvents,
      tasksDone: tasksScope.filter((t) => t.done).length,
      tasksTotal: tasksScope.length,
      avgTempC: Math.round(snapshot.tempC * 10) / 10,
      avgHumidity: Math.round(snapshot.humidity * 10) / 10,
      diaryCount: diaryToday.length,
    };
  }, [
    scans,
    diary,
    tasks,
    totalWaterUsedL,
    farmHealthScore,
    pump.totalRunSeconds,
    snapshot.tempC,
    snapshot.humidity,
    today,
  ]);

  const allDays: DailySummary[] = useMemo(() => {
    const history = (dailySummaries ?? []).filter((r) => r && r.date < today);
    return [...history, liveToday]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [dailySummaries, liveToday, today]);

  const daysCount = range === "today" ? 1 : range === "7d" ? 7 : 30;
  const period: DailySummary[] = useMemo(
    () => allDays.slice(-daysCount),
    [allDays, daysCount],
  );

  const prevAvgHealth = useMemo(() => {
    if (range === "today") {
      const y = allDays.find((r) => r.date < today);
      const prev = [...allDays].reverse().find((r) => r.date < today);
      void y;
      return prev ? prev.healthScore : null;
    }
    if (range === "7d") {
      const prev = allDays.slice(-14, -7);
      if (prev.length === 0) return null;
      return prev.reduce((s, r) => s + r.healthScore, 0) / prev.length;
    }
    // 30d: first half vs second half (no older history available).
    if (period.length >= 4) {
      const half = Math.floor(period.length / 2);
      const first = period.slice(0, half);
      return first.reduce((s, r) => s + r.healthScore, 0) / first.length;
    }
    return null;
  }, [allDays, period, range, today]);

  const kpis = useMemo(() => {
    const n = Math.max(1, period.length);
    const avgHealth = period.reduce((s, r) => s + r.healthScore, 0) / n;
    const totalWater = period.reduce((s, r) => s + r.waterUsedL, 0);
    const totalEnergy = period.reduce((s, r) => s + r.energyKwh, 0);
    const totalEnergyRs = period.reduce((s, r) => s + r.energyCostRs, 0);
    const totalScans = period.reduce((s, r) => s + r.scans, 0);
    const totalResolved = period.reduce((s, r) => s + r.scansResolved, 0);
    const totalIrrigation = period.reduce((s, r) => s + r.irrigationEvents, 0);
    const doneTasks = period.reduce((s, r) => s + r.tasksDone, 0);
    const totalTasks = period.reduce((s, r) => s + r.tasksTotal, 0);
    return {
      avgHealth,
      totalWater,
      totalEnergy,
      totalEnergyRs,
      totalScans,
      resolutionPct: totalScans === 0 ? null : (totalResolved / totalScans) * 100,
      totalIrrigation,
      doneTasks,
      totalTasks,
      tasksPct: totalTasks === 0 ? null : (doneTasks / totalTasks) * 100,
    };
  }, [period]);

  const savings = useMemo(() => {
    const days = period.length;
    const baselineWater = days * REPORT_MANUAL_BASELINE_L_PER_DAY;
    const savedL = baselineWater - kpis.totalWater;
    const savedPct = baselineWater > 0 ? (savedL / baselineWater) * 100 : 0;
    const waterSavedRs = Math.max(0, savedL) * REPORT_WATER_RATE_RS_PER_L;
    const baselineEnergy = baselineWater * REPORT_KWH_PER_LITRE;
    const savedKwh = baselineEnergy - kpis.totalEnergy;
    const energySavedRs = Math.max(0, savedKwh) * REPORT_ENERGY_RATE_RS_PER_KWH;
    const totalSavedRs = waterSavedRs + energySavedRs;
    const co2Kg = Math.max(0, savedKwh) * REPORT_KG_CO2_PER_KWH;
    return {
      days,
      baselineWater,
      savedL,
      savedPct,
      waterSavedRs,
      baselineEnergy,
      savedKwh: Math.max(0, savedKwh),
      energySavedRs,
      totalSavedRs,
      co2Kg,
    };
  }, [period.length, kpis.totalWater, kpis.totalEnergy]);

  const healthData = useMemo(
    () =>
      period.map((r) => ({
        date: shortLabel(r.date),
        full: r.date,
        score: r.healthScore,
      })),
    [period],
  );

  const waterData = useMemo(
    () =>
      period.map((r) => {
        const actual = Math.round(r.waterUsedL * 100) / 100;
        const baseline = REPORT_MANUAL_BASELINE_L_PER_DAY;
        return {
          date: shortLabel(r.date),
          full: r.date,
          actual,
          baseline,
          saved: Math.round(Math.max(0, baseline - actual) * 100) / 100,
        };
      }),
    [period],
  );

  const climateData = useMemo(
    () =>
      period.map((r) => ({
        date: shortLabel(r.date),
        full: r.date,
        temp: r.avgTempC,
        humidity: r.avgHumidity,
      })),
    [period],
  );

  const diseaseData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const r of period) {
      for (const [k, v] of Object.entries(r.diseaseCounts ?? {})) {
        totals.set(k, (totals.get(k) ?? 0) + v);
      }
    }
    const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return [{ name: "No scans", value: 1, hex: "#3f3f46" }];
    return entries.map(([name, value], i) => ({
      name,
      value,
      hex: diseaseColor(name, i),
    }));
  }, [period]);

  const aiSummary = useMemo(
    () => generatePeriodReport(period, range),
    [period, range],
  );

  const trendDelta =
    prevAvgHealth == null ? null : kpis.avgHealth - prevAvgHealth;
  const trendUp = trendDelta != null && trendDelta >= 0;

  const rangeTitle =
    range === "today" ? "Today" : range === "7d" ? "Last 7 days" : "Last 30 days";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* Screen UI (hidden when printing) */}
      <div className="no-print space-y-4 sm:space-y-5">
        {/* Period selector + exports */}
        <Rise>
          <Card>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-extrabold text-white sm:text-lg">
                  <Activity className="h-5 w-5 text-emerald-300" /> Farm Reports
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {rangeTitle} · {period.length} day{period.length === 1 ? "" : "s"} · 30-day history backfilled on first visit
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <SegmentedControl
                  options={RANGE_OPTIONS}
                  value={range}
                  onChange={(v) => setRange(v as ReportRange)}
                  layoutId="reports-range"
                  aria-label="Report period"
                  className="sm:w-72"
                />
                <div className="grid grid-cols-3 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-primary-aurora flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-black"
                  >
                    <Printer className="h-3.5 w-3.5" strokeWidth={2.75} /> Report
                  </button>
                  <button
                    type="button"
                    onClick={() => exportDailyCSV(period, range)}
                    className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-bold text-[#F3F4F6] backdrop-blur-md transition-all hover:bg-white/[0.1] hover:border-[#818CF8]/40 active:scale-[0.98]"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#818CF8]" /> CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportFarmBackup}
                    className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-bold text-[#F3F4F6] backdrop-blur-md transition-all hover:bg-white/[0.1] hover:border-[#818CF8]/40 active:scale-[0.98]"
                  >
                    <DatabaseBackup className="h-3.5 w-3.5 text-[#818CF8]" /> Backup
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </Rise>

        {/* Water / money saved hero */}
        <Rise delay={0.04}>
          <section className="relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br from-[#818CF8]/15 via-[rgba(18,26,22,0.75)] to-[rgba(18,26,22,0.85)] p-4 backdrop-blur-xl sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#818CF8]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#34D399]/10 blur-3xl" />
            <div className="relative">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#818CF8]">
                <Waves className="h-3.5 w-3.5" /> Water saved · Money saved · {rangeTitle.toLowerCase()}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] border border-white/10 bg-[rgba(18,26,22,0.66)] p-4 backdrop-blur-md">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    <Droplets className="h-3.5 w-3.5 text-sky-400" /> Litres saved
                  </p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent sm:text-4xl">
                    <AnimatedNumber value={Math.max(0, savings.savedL)} decimals={1} />
                    <span className="ml-1 text-sm font-bold text-[#9CA3AF]">L</span>
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#9CA3AF]">
                    {kpis.totalWater.toFixed(1)} L used vs {savings.baselineWater.toFixed(0)} L manual habit ({REPORT_MANUAL_BASELINE_L_PER_DAY} L/day) ·{" "}
                    <span className="font-bold text-[#34D399]">{savings.savedPct.toFixed(0)}% less</span>
                  </p>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-[rgba(18,26,22,0.66)] p-4 backdrop-blur-md">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    <IndianRupee className="h-3.5 w-3.5 text-emerald-400" /> Rupees saved
                  </p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent sm:text-4xl">
                    ₹<AnimatedNumber value={savings.totalSavedRs} decimals={2} />
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#9CA3AF]">
                    Water ₹{savings.waterSavedRs.toFixed(2)} + energy ₹{savings.energySavedRs.toFixed(2)} · @ ₹{REPORT_WATER_RATE_RS_PER_L}/L & ₹{REPORT_ENERGY_RATE_RS_PER_KWH}/kWh
                  </p>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-[rgba(18,26,22,0.66)] p-4 backdrop-blur-md">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    <Leaf className="h-3.5 w-3.5 text-emerald-400" /> Climate bonus
                  </p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent sm:text-4xl">
                    <AnimatedNumber value={savings.co2Kg} decimals={2} />
                    <span className="ml-1 text-sm font-bold text-[#9CA3AF]">kg CO₂</span>
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#9CA3AF]">
                    ≈ avoided by pumping {savings.savedKwh.toFixed(3)} kWh less — like planting{" "}
                    <span className="font-bold text-[#34D399]">
                      {(savings.co2Kg / 21).toFixed(1)} saplings
                    </span>{" "}
                    for a year.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </Rise>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Rise delay={0.05}>
            <Card className="h-full">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <Activity className="h-3.5 w-3.5 text-emerald-300" /> Avg health
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">
                <AnimatedNumber value={kpis.avgHealth} decimals={0} />
              </p>
              <p className={cn("mt-1 flex items-center gap-1 text-[11px] font-bold", trendUp ? "text-emerald-300" : "text-red-300")}>
                {trendDelta == null ? (
                  <span className="text-zinc-500">no prior period</span>
                ) : (
                  <>
                    {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {trendUp ? "+" : ""}{trendDelta.toFixed(1)} vs prev
                  </>
                )}
              </p>
            </Card>
          </Rise>
          <Rise delay={0.07}>
            <Card className="h-full">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <Droplets className="h-3.5 w-3.5 text-sky-300" /> Water used
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">
                <AnimatedNumber value={kpis.totalWater} decimals={1} />
                <span className="ml-1 text-xs font-bold text-zinc-400">L</span>
              </p>
              <p className="mt-1 text-[11px] font-semibold text-zinc-500">
                {(kpis.totalWater / Math.max(1, period.length)).toFixed(2)} L/day avg
              </p>
            </Card>
          </Rise>
          <Rise delay={0.09}>
            <Card className="h-full">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <Zap className="h-3.5 w-3.5 text-amber-300" /> Energy
              </p>
              <p className="mt-1 truncate text-2xl font-black tabular-nums text-white">
                <AnimatedNumber value={kpis.totalEnergy} decimals={3} />
                <span className="ml-1 text-xs font-bold text-zinc-400">kWh</span>
              </p>
              <p className="mt-1 text-[11px] font-bold tabular-nums text-emerald-300">
                ₹{kpis.totalEnergyRs.toFixed(2)}
              </p>
            </Card>
          </Rise>
          <Rise delay={0.11}>
            <Card className="h-full">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <Bug className="h-3.5 w-3.5 text-red-300" /> Disease scans
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">
                <AnimatedNumber value={kpis.totalScans} decimals={0} />
              </p>
              <p className="mt-1 text-[11px] font-semibold text-zinc-500">
                {kpis.resolutionPct == null ? "no scans" : `${kpis.resolutionPct.toFixed(0)}% resolved`}
              </p>
            </Card>
          </Rise>
          <Rise delay={0.13}>
            <Card className="h-full">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <Waves className="h-3.5 w-3.5 text-sky-300" /> Irrigation
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">
                <AnimatedNumber value={kpis.totalIrrigation} decimals={0} />
                <span className="ml-1 text-xs font-bold text-zinc-400">runs</span>
              </p>
              <p className="mt-1 text-[11px] font-semibold text-zinc-500">
                {(kpis.totalIrrigation / Math.max(1, period.length)).toFixed(1)}/day avg
              </p>
            </Card>
          </Rise>
          <Rise delay={0.15}>
            <Card className="h-full">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <CalendarCheck2 className="h-3.5 w-3.5 text-emerald-300" /> Tasks done
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-white">
                {kpis.tasksPct == null ? "—" : <><AnimatedNumber value={kpis.tasksPct} decimals={0} /><span className="ml-0.5 text-sm">%</span></>}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-zinc-500">
                {kpis.doneTasks}/{kpis.totalTasks} completed
              </p>
            </Card>
          </Rise>
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
          <Rise delay={0.16}>
            <Card>
              <CardHeader title="Farm health score" subtitle={`${rangeTitle} · 0–100`} />
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#9CA3AF", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={range === "30d" ? 4 : 0}
                    />
                    <YAxis
                      tick={{ fill: "#9CA3AF", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      domain={[40, 100]}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(_, payload) => {
                        const p = payload?.[0]?.payload as { full?: string } | undefined;
                        return p?.full ? shortLabel(p.full) : "";
                      }}
                      formatter={(v) => [`${Number(v).toFixed(0)} / 100`, "Health"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#818CF8"
                      strokeWidth={2.5}
                      dot={period.length <= 8 ? { r: 3.5, fill: "#818CF8", strokeWidth: 0 } : false}
                      activeDot={{ r: 5, fill: "#818CF8" }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[11px] text-[#9CA3AF]">
                Best {period.length > 0 ? shortLabel([...period].sort((a, b) => b.healthScore - a.healthScore)[0].date) : "—"} · Worst{" "}
                {period.length > 0 ? shortLabel([...period].sort((a, b) => a.healthScore - b.healthScore)[0].date) : "—"}
              </p>
            </Card>
          </Rise>

          <Rise delay={0.18}>
            <Card>
              <CardHeader
                title="Daily water vs 6 L baseline"
                subtitle="Stacked green = litres saved that day"
              />
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={waterData} margin={{ top: 8, right: 12, bottom: 0, left: -14 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#9CA3AF", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={range === "30d" ? 4 : 0}
                    />
                    <YAxis
                      tick={{ fill: "#9CA3AF", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(_, payload) => {
                        const p = payload?.[0]?.payload as { full?: string } | undefined;
                        return p?.full ? shortLabel(p.full) : "";
                      }}
                      formatter={(v, name) => [
                        `${Number(v).toFixed(2)} L`,
                        name === "actual" ? "Smart use" : name === "saved" ? "Saved" : "Manual baseline",
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
                    <Bar dataKey="actual" stackId="w" fill="#34D399" radius={[0, 0, 0, 0]} name="Smart use" isAnimationActive={false} />
                    <Bar dataKey="saved" stackId="w" fill="rgba(52,211,153,0.22)" radius={[5, 5, 0, 0]} name="Saved" isAnimationActive={false} />
                    <Line type="monotone" dataKey="baseline" stroke="#FBBF24" strokeWidth={1.8} strokeDasharray="6 4" dot={false} name="Manual 6 L" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[11px] text-[#9CA3AF]">
                Green cap above each bar is water NOT pumped — the gap to the dashed manual habit.
              </p>
            </Card>
          </Rise>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
          <Rise delay={0.2}>
            <Card>
              <CardHeader title="Temperature / humidity" subtitle="Dual-axis daily averages" />
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={climateData} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
                    <defs>
                      <linearGradient id="rep-temp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fb9235" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#fb9235" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="rep-hum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#9CA3AF", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={range === "30d" ? 4 : 0}
                    />
                    <YAxis
                      yAxisId="t"
                      tick={{ fill: "#9CA3AF", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                      domain={["auto", "auto"]}
                    />
                    <YAxis
                      yAxisId="h"
                      orientation="right"
                      tick={{ fill: "#9CA3AF", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                      domain={[30, 90]}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(_, payload) => {
                        const p = payload?.[0]?.payload as { full?: string } | undefined;
                        return p?.full ? shortLabel(p.full) : "";
                      }}
                      formatter={(v, name) => [
                        name === "temp" ? `${Number(v).toFixed(1)}°C` : `${Number(v).toFixed(0)}%`,
                        name === "temp" ? "Temp" : "Humidity",
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
                    <Area yAxisId="t" type="monotone" dataKey="temp" stroke="#fb9235" strokeWidth={2.2} fill="url(#rep-temp)" dot={false} name="Temp °C" isAnimationActive={false} />
                    <Area yAxisId="h" type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={2.2} fill="url(#rep-hum)" dot={false} name="Humidity %" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Rise>

          <Rise delay={0.22}>
            <Card>
              <CardHeader title="Disease breakdown" subtitle={`${kpis.totalScans} scans in period`} />
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <div className="h-52 w-full max-w-64 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={diseaseData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={3}
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {diseaseData.map((d) => (
                          <Cell key={d.name} fill={d.hex} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="w-full min-w-0 space-y-1.5">
                  {diseaseData.map((d) => (
                    <li key={d.name} className="flex items-center gap-2 text-xs font-semibold text-[#F3F4F6]">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.hex, boxShadow: `0 0 8px ${d.hex}` }} />
                      <span className="min-w-0 flex-1 truncate">{d.name}</span>
                      <span className="font-mono tabular-nums text-[#9CA3AF]">{d.value}</span>
                    </li>
                  ))}
                  <li className="pt-1 text-[11px] text-[#9CA3AF]">
                    {kpis.resolutionPct == null
                      ? "Log a leaf scan from /camera to populate this donut."
                      : `${kpis.resolutionPct.toFixed(0)}% of findings marked resolved.`}
                  </li>
                </ul>
              </div>
            </Card>
          </Rise>
        </div>

        {/* AI summary */}
        <Rise delay={0.24}>
          <Card className="border-emerald-500/30">
            <CardHeader
              title="AI Period Summary"
              subtitle="Auto-written from this period's data"
              action={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <Sparkles className="h-4 w-4" />
                </span>
              }
            />
            <p className="text-[13px] leading-relaxed text-zinc-100">{aiSummary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary-aurora flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-black"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.75} /> Download Report
              </button>
              <button
                type="button"
                onClick={() => exportDailyCSV(period, range)}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-bold text-[#F3F4F6] backdrop-blur-md transition-all hover:bg-white/[0.1] hover:border-[#818CF8]/40 active:scale-[0.98]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#818CF8]" /> Export CSV
              </button>
              <button
                type="button"
                onClick={exportFarmBackup}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-bold text-[#F3F4F6] backdrop-blur-md transition-all hover:bg-white/[0.1] hover:border-[#818CF8]/40 active:scale-[0.98]"
              >
                <DatabaseBackup className="h-3.5 w-3.5 text-[#818CF8]" /> Backup JSON
              </button>
            </div>
          </Card>
        </Rise>
      </div>

      {/* Print-only report (white, printer friendly) */}
      <div className="print-area">
        <div style={{ fontFamily: "Arial, sans-serif", color: "#000" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
            KrishiNethra AI — Farm Report ({rangeTitle})
          </h1>
          <p style={{ fontSize: 12, color: "#333", margin: "4px 0 12px" }}>
            Generated {new Date().toLocaleString("en-IN")} · {period.length} day{period.length === 1 ? "" : "s"} ·{" "}
            {period.length > 0 ? `${period[0].date} → ${period[period.length - 1].date}` : ""}
          </p>

          <h2 style={{ fontSize: 14, fontWeight: 800, margin: "12px 0 6px" }}>Key numbers</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>
              {[
                ["Avg farm health", `${kpis.avgHealth.toFixed(0)} / 100${trendDelta != null ? ` (${trendDelta >= 0 ? "+" : ""}${trendDelta.toFixed(1)} vs prev)` : ""}`],
                ["Total water used", `${kpis.totalWater.toFixed(2)} L (baseline ${(savings.baselineWater).toFixed(0)} L)`],
                ["Water saved", `${Math.max(0, savings.savedL).toFixed(1)} L (${savings.savedPct.toFixed(0)}% less)`],
                ["Total energy", `${kpis.totalEnergy.toFixed(4)} kWh (₹${kpis.totalEnergyRs.toFixed(2)})`],
                ["Money saved (water + energy)", `₹${savings.totalSavedRs.toFixed(2)}`],
                ["CO₂ avoided (pumping)", `${savings.co2Kg.toFixed(2)} kg`],
                ["Disease scans", `${kpis.totalScans}${kpis.resolutionPct != null ? ` (${kpis.resolutionPct.toFixed(0)}% resolved)` : ""}`],
                ["Irrigation events", `${kpis.totalIrrigation}`],
                ["Tasks completed", kpis.totalTasks === 0 ? "—" : `${kpis.doneTasks}/${kpis.totalTasks} (${kpis.tasksPct?.toFixed(0)}%)`],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ border: "1px solid #999", padding: "6px 8px", fontWeight: 700, width: "45%" }}>{k}</td>
                  <td style={{ border: "1px solid #999", padding: "6px 8px" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ fontSize: 14, fontWeight: 800, margin: "14px 0 6px" }}>AI period summary</h2>
          <p style={{ fontSize: 12, lineHeight: 1.6 }}>{aiSummary}</p>

          <h2 style={{ fontSize: 14, fontWeight: 800, margin: "14px 0 6px" }}>Daily breakdown</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr>
                {["Date", "Health", "Water (L)", "Energy (kWh)", "Scans", "Irrig.", "Tasks", "Temp °C", "Hum %"].map((h) => (
                  <th key={h} style={{ border: "1px solid #999", padding: "5px 6px", background: "#eee", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {period.map((r) => (
                <tr key={r.date}>
                  <td style={{ border: "1px solid #999", padding: "5px 6px" }}>{r.date}</td>
                  <td style={{ border: "1px solid #999", padding: "5px 6px" }}>{r.healthScore}</td>
                  <td style={{ border: "1px solid #999", padding: "5px 6px" }}>{r.waterUsedL.toFixed(2)}</td>
                  <td style={{ border: "1px solid #999", padding: "5px 6px" }}>{r.energyKwh.toFixed(4)}</td>
                  <td style={{ border: "1px solid #999", padding: "5px 6px" }}>{r.scans} ({r.scansResolved}✓)</td>
                  <td style={{ border: "1px solid #999", padding: "5px 6px" }}>{r.irrigationEvents}</td>
                  <td style={{ border: "1px solid #999", padding: "5px 6px" }}>{r.tasksDone}/{r.tasksTotal}</td>
                  <td style={{ border: "1px solid #999", padding: "5px 6px" }}>{r.avgTempC.toFixed(1)}</td>
                  <td style={{ border: "1px solid #999", padding: "5px 6px" }}>{r.avgHumidity.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 10, color: "#555", marginTop: 10 }}>
            Baseline: {REPORT_MANUAL_BASELINE_L_PER_DAY} L/day manual habit · Water ₹{REPORT_WATER_RATE_RS_PER_L}/L · Energy ₹{REPORT_ENERGY_RATE_RS_PER_KWH}/kWh · Pump {(REPORT_PUMP_WATTS).toFixed(1)} W.
            Past days are plausible simulated history; today is live from your farm store.
          </p>
        </div>
      </div>

      <style>{`
        .print-area { display: none; }
        @media print {
          @page { margin: 14mm; }
          body { background: #fff !important; color: #000 !important; }
          header, aside, nav { display: none !important; }
          main { padding: 0 !important; }
          .no-print { display: none !important; }
          .print-area { display: block !important; background: #fff !important; color: #000 !important; }
        }
      `}      </style>
    </div>
  );
}
