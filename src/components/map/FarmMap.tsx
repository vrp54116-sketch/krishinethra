"use client";

import { motion } from "framer-motion";
import {
  CloudRain,
  Compass,
  Cpu,
  Droplets,
  Power,
  RotateCcw,
  Sparkles,
  Thermometer,
  Volume2,
  Waves,
  Wind,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";

export const ZONE_PAN: Record<string, number> = {
  A: 45,
  B: 90,
  C: 135,
};

export function zoneStatusTone(status: string): "good" | "warning" | "critical" | "info" {
  if (status === "healthy") return "good";
  if (status === "warning") return "warning";
  if (status === "critical") return "critical";
  return "info";
}

export default function FarmMap() {
  const snapshot = useFarmStore((s) => s.snapshot);
  const pump = useFarmStore((s) => s.pump);
  const thresholds = useFarmStore((s) => s.settings.thresholds);
  const setPumpManual = useFarmStore((s) => s.setPumpManual);
  const setPumpMode = useFarmStore((s) => s.setPumpMode);
  const sendEdgeBuzz = useFarmStore((s) => s.sendEdgeBuzz);
  const sendEdgeSweep = useFarmStore((s) => s.sendEdgeSweep);

  const isAuto = pump.mode === "auto";
  const isPumping = pump.running;

  const togglePump = () => {
    if (isAuto) {
      toast.info("Switched to Manual mode to toggle pump");
      setPumpMode("manual");
    }
    const next = !isPumping;
    setPumpManual(next);
    toast.success(next ? "Pump started (Manual)" : "Pump stopped (Manual)");
  };

  const toggleMode = () => {
    const nextMode = isAuto ? "manual" : "auto";
    setPumpMode(nextMode);
    toast.success(`Mode changed to ${nextMode === "auto" ? "Auto AI" : "Manual"}`);
  };

  const triggerBuzz = () => {
    sendEdgeBuzz();
    toast.success("Buzzer alert sent (BUZZ:2:150)");
  };

  const triggerSweep = () => {
    sendEdgeSweep();
    toast.success("Servo 180° pan sweep initiated");
  };

  const soilStatus =
    snapshot.soil < 20
      ? { label: "Critical Low", color: "text-red-400 border-red-500/30 bg-red-500/10" }
      : snapshot.soil < thresholds.moistureLow
      ? { label: "Needs Water", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" }
      : snapshot.soil > thresholds.moistureHigh
      ? { label: "Saturated", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" }
      : { label: "Optimal", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" };

  return (
    <div className="space-y-4">
      {/* Large Liquid Glass Card: Your Farm */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[rgba(15,23,20,0.7)] p-5 sm:p-8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Background Ambient Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />

        {/* Card Header */}
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Your Farm</h1>
                <p className="text-xs sm:text-sm text-zinc-400">Single Zone Real-time Telemetry & Hardware Control</p>
              </div>
            </div>
          </div>

          {/* Quick Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide backdrop-blur-md",
                soilStatus.color
              )}
            >
              <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
              Soil: {soilStatus.label}
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide backdrop-blur-md",
                isPumping
                  ? "border-sky-400/50 bg-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                  : "border-white/10 bg-white/[0.04] text-zinc-400"
              )}
            >
              <Droplets className="h-3.5 w-3.5" />
              Pump: {isPumping ? "RUNNING" : "IDLE"}
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide backdrop-blur-md",
                isAuto
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                  : "border-amber-400/40 bg-amber-500/15 text-amber-300"
              )}
            >
              <Cpu className="h-3.5 w-3.5" />
              Mode: {isAuto ? "AUTO AI" : "MANUAL"}
            </span>
          </div>
        </div>

        {/* Circular Map Visualization with Orbiting Sensor Pills */}
        <div className="relative my-6 flex min-h-[420px] sm:min-h-[480px] w-full items-center justify-center">
          {/* Circular Stage / Radar Ground */}
          <div className="relative flex h-[340px] w-[340px] sm:h-[420px] sm:w-[420px] items-center justify-center">
            {/* Outer Glow Ring */}
            <div className="absolute inset-0 rounded-full border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent shadow-[inset_0_0_40px_rgba(16,185,129,0.06)]" />

            {/* Mid Radar Ring */}
            <div className="absolute inset-10 sm:inset-12 rounded-full border border-dashed border-emerald-400/25" />

            {/* Inner Radar Ring */}
            <div className="absolute inset-24 sm:inset-28 rounded-full border border-white/10" />

            {/* Rotating Radar Sweep Line */}
            <motion.div
              className="absolute inset-0 origin-center rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
              <div className="h-1/2 w-0.5 bg-gradient-to-t from-emerald-400/40 to-transparent mx-auto" />
            </motion.div>

            {/* Central Farm Core Hub */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative z-10 flex flex-col items-center justify-center rounded-full border border-emerald-400/40 bg-[rgba(10,25,18,0.85)] p-6 shadow-[0_0_30px_rgba(16,185,129,0.25)] backdrop-blur-xl w-32 h-32 sm:w-36 sm:h-36"
            >
              <span className="text-3xl sm:text-4xl mb-1 select-none">🌾</span>
              <p className="text-xs sm:text-sm font-extrabold text-white text-center">Krishi Farm</p>
              <span className="text-[10px] font-semibold text-emerald-300">Hub Active</span>
            </motion.div>

            {/* Orbiting Sensor Pills */}
            {/* 1. Soil Moisture (Top) */}
            <div className="absolute -top-1 sm:top-2 left-1/2 -translate-x-1/2 z-20">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="flex items-center gap-2 rounded-2xl border border-sky-400/40 bg-[rgba(12,25,35,0.8)] px-3 py-1.5 shadow-[0_0_15px_rgba(56,189,248,0.25)] backdrop-blur-md"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
                  <Droplets className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-sky-200/70">Soil Moisture</p>
                  <p className="text-xs sm:text-sm font-black text-white">{snapshot.soil.toFixed(1)}%</p>
                </div>
              </motion.div>
            </div>

            {/* 2. Temperature (Top Right) */}
            <div className="absolute top-8 sm:top-12 -right-3 sm:right-2 z-20">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="flex items-center gap-2 rounded-2xl border border-red-400/40 bg-[rgba(35,16,16,0.8)] px-3 py-1.5 shadow-[0_0_15px_rgba(239,68,68,0.2)] backdrop-blur-md"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-500/20 text-red-300">
                  <Thermometer className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-red-200/70">Temperature</p>
                  <p className="text-xs sm:text-sm font-black text-white">{snapshot.temp.toFixed(1)}°C</p>
                </div>
              </motion.div>
            </div>

            {/* 3. Humidity (Bottom Right) */}
            <div className="absolute bottom-8 sm:bottom-12 -right-3 sm:right-2 z-20">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="flex items-center gap-2 rounded-2xl border border-cyan-400/40 bg-[rgba(10,30,35,0.8)] px-3 py-1.5 shadow-[0_0_15px_rgba(34,211,238,0.2)] backdrop-blur-md"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Waves className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-cyan-200/70">Humidity</p>
                  <p className="text-xs sm:text-sm font-black text-white">{snapshot.hum.toFixed(1)}%</p>
                </div>
              </motion.div>
            </div>

            {/* 4. Air Quality AQI (Bottom) */}
            <div className="absolute -bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 z-20">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="flex items-center gap-2 rounded-2xl border border-violet-400/40 bg-[rgba(25,18,35,0.8)] px-3 py-1.5 shadow-[0_0_15px_rgba(167,139,250,0.2)] backdrop-blur-md"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                  <Wind className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-violet-200/70">Air Quality</p>
                  <p className="text-xs sm:text-sm font-black text-white">{snapshot.aqi} AQI</p>
                </div>
              </motion.div>
            </div>

            {/* 5. Rain Sensor (Bottom Left) */}
            <div className="absolute bottom-8 sm:bottom-12 -left-3 sm:left-2 z-20">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-3 py-1.5 backdrop-blur-md shadow-md",
                  snapshot.rain
                    ? "border-blue-400/60 bg-[rgba(16,28,48,0.9)] text-blue-200 shadow-[0_0_18px_rgba(59,130,246,0.35)]"
                    : "border-white/10 bg-[rgba(20,25,22,0.8)] text-zinc-300"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-xl",
                    snapshot.rain ? "bg-blue-500/30 text-blue-300" : "bg-white/[0.06] text-zinc-400"
                  )}
                >
                  <CloudRain className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-medium opacity-80">Rain Sensor</p>
                  <p className="text-xs sm:text-sm font-black text-white">{snapshot.rain ? "Rain Detected" : "Dry"}</p>
                </div>
              </motion.div>
            </div>

            {/* 6. Servo Pan Angle (Top Left) */}
            <div className="absolute top-8 sm:top-12 -left-3 sm:left-2 z-20">
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-[rgba(35,26,12,0.8)] px-3 py-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-md"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-amber-200/70">Pan Servo</p>
                  <p className="text-xs sm:text-sm font-black text-white">{Math.round(snapshot.servo)}°</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons Section */}
        <div className="relative z-10 border-t border-white/10 pt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Hardware Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {/* Pump Toggle */}
            <button
              type="button"
              onClick={togglePump}
              className={cn(
                "flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs sm:text-sm font-extrabold transition-all active:scale-[0.98]",
                isPumping
                  ? "border border-rose-500/40 bg-rose-500/20 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.3)] hover:bg-rose-500/30"
                  : "border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.3)] hover:bg-emerald-500/30"
              )}
            >
              <Power className="h-4 w-4" />
              Pump: {isPumping ? "Stop" : "Start"}
            </button>

            {/* Mode Toggle */}
            <button
              type="button"
              onClick={toggleMode}
              className={cn(
                "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs sm:text-sm font-extrabold transition-all active:scale-[0.98]",
                isAuto
                  ? "border-sky-500/40 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
              )}
            >
              <Cpu className="h-4 w-4" />
              Mode: {isAuto ? "Auto AI" : "Manual"}
            </button>

            {/* Buzzer Test */}
            <button
              type="button"
              onClick={triggerBuzz}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3 text-xs sm:text-sm font-extrabold text-white transition-all hover:border-emerald-400/40 hover:bg-white/[0.09] active:scale-[0.98]"
            >
              <Volume2 className="h-4 w-4 text-emerald-400" />
              Buzzer Beep
            </button>

            {/* Servo Sweep */}
            <button
              type="button"
              onClick={triggerSweep}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3 text-xs sm:text-sm font-extrabold text-white transition-all hover:border-amber-400/40 hover:bg-white/[0.09] active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4 text-amber-400" />
              Servo Sweep
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
