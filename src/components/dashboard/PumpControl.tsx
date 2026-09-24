"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Pause, Play, Power, Square, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Card, CardHeader } from "./ui";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { playWaterDrop } from "@/lib/audio";

type Mode = "manual" | "auto" | "schedule";

const MODES: Array<{ id: Mode; labelKey: string }> = [
  { id: "manual", labelKey: "dashboard.manual" },
  { id: "auto", labelKey: "dashboard.autoAI" },
  { id: "schedule", labelKey: "dashboard.scheduleMode" },
];

export default function PumpControl() {
  const t = useT();
  const pump = useFarmStore((s) => s.pump);
  const snapshot = useFarmStore((s) => s.snapshot);
  const thresholds = useFarmStore((s) => s.settings.thresholds);
  const manualRemaining = useFarmStore((s) => s.manualPumpRemainingSec);
  const setPumpManual = useFarmStore((s) => s.setPumpManual);
  const setPumpMode = useFarmStore((s) => s.setPumpMode);
  const addAlert = useFarmStore((s) => s.addAlert);
  const alerts = useFarmStore((s) => s.alerts);

  const [pulse, setPulse] = useState(false);
  const prevRunning = useRef(pump.running);

  // Requirement 8: When pump turns ON: pulse 3x + water drop sound
  useEffect(() => {
    if (pump.running && !prevRunning.current) {
      playWaterDrop();
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(timer);
    }
    prevRunning.current = pump.running;
  }, [pump.running]);

  const logPump = (title: string, message: string) => {
    addAlert({ level: "info", title, message });
    toast.success(title, { description: message });
  };

  const handlePower = (on: boolean) => {
    setPumpManual(on);
    logPump(
      on ? "Pump turned ON (Manual)" : "Pump turned OFF (Manual)",
      on
        ? `Manual run for ${thresholds.pumpDurationSec}s — Soil at ${snapshot.soil.toFixed(1)}%.`
        : "Manual run stopped by user.",
    );
  };

  const handleQuickRun = (sec: number) => {
    if (pump.mode !== "manual") {
      toast.info("Switched to Manual mode", {
        description: `Quick run needs Manual — Auto AI paused for ${sec}s.`,
      });
    }
    setPumpManual(true, sec);
    logPump(
      `Pump ON for ${sec}s`,
      `Quick manual run — Soil at ${snapshot.soil.toFixed(1)}%.`,
    );
  };

  const handleMode = (mode: Mode) => {
    if (pump.mode === mode) return;
    setPumpMode(mode);
    const label = mode === "auto" ? "Auto AI" : mode === "manual" ? "Manual" : "Schedule";
    const title = `Pump mode → ${label}`;
    const recentDuplicate = alerts.some(
      (a) => a.title === title && Date.now() - a.timestamp < 10 * 60 * 1000,
    );
    if (!recentDuplicate) {
      logPump(title, `Mode changed to ${label} by user.`);
    } else {
      toast.success(title, { description: `Mode changed to ${label} by user.` });
    }
  };

  // Live Jal Agent Auto-AI reasoning lines.
  const autoLines = (): Array<{ text: string; hot: boolean }> => {
    const soil = snapshot.soil;
    const rain = snapshot.rain;
    const low = thresholds.moistureLow;
    const high = thresholds.moistureHigh;

    if (pump.running) {
      if (rain) {
        return [
          { text: `Rain detected! Auto-stop triggered to prevent over-watering`, hot: true },
          { text: `Soil moisture: ${soil.toFixed(1)}%`, hot: false },
        ];
      }
      return [
        { text: `Soil moisture ${soil.toFixed(1)}% — pump RUNNING, lifting toward ${high}%`, hot: true },
        { text: `Rain sensor: Dry (No rain detected)`, hot: false },
      ];
    }

    if (rain) {
      return [
        { text: `Rain detected — pump held OFF (rain irrigation active)`, hot: true },
        { text: `Soil moisture: ${soil.toFixed(1)}% (Threshold: <${low}%)`, hot: false },
      ];
    }

    if (soil < low) {
      return [
        { text: `Soil moisture ${soil.toFixed(1)}% < ${low}% & dry → pump will start`, hot: true },
        { text: `Jal Agent: Irrigation triggered`, hot: false },
      ];
    }

    return [
      { text: `Soil moisture ${soil.toFixed(1)}% ≥ ${low}% — holding OFF`, hot: false },
      { text: `Will restart if moisture drops below ${low}% and no rain is detected`, hot: false },
    ];
  };

  const isManual = pump.mode === "manual";

  return (
    <Card className={cn("relative overflow-hidden", pulse && "pump-card-pulse border-emerald-400/80")}>
      {/* 3 staggered falling water droplets inside card when pump is ON */}
      {pump.running && (
        <div className="pointer-events-none absolute right-4 top-3 h-14 w-12 overflow-hidden z-10" aria-hidden>
          <div className="absolute left-1 top-0 h-2 w-2 rounded-full bg-sky-400 pump-droplet-item shadow-[0_0_8px_rgba(56,189,248,0.8)]" style={{ animationDelay: "0s" }} />
          <div className="absolute left-5 top-0 h-2 w-2 rounded-full bg-sky-300 pump-droplet-item shadow-[0_0_8px_rgba(56,189,248,0.8)]" style={{ animationDelay: "0.5s" }} />
          <div className="absolute left-9 top-0 h-2 w-2 rounded-full bg-cyan-400 pump-droplet-item shadow-[0_0_8px_rgba(56,189,248,0.8)]" style={{ animationDelay: "1.0s" }} />
        </div>
      )}

      <CardHeader
        title={t("dashboard.pumpStatus")}
        subtitle={`Mode: ${pump.mode === "auto" ? "Auto AI" : pump.mode === "manual" ? "Manual" : "Schedule"}`}
        action={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-widest transition-all",
              pump.running
                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                : "border-white/10 bg-white/[0.03] text-zinc-400",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", pump.running ? "animate-pulse bg-emerald-400" : "bg-zinc-600")} />
            {pump.running ? "ON" : "OFF"}
          </span>
        }
      />

      {/* Status visual */}
      <div className="relative flex items-center gap-3 rounded-[16px] border border-white/10 bg-[rgba(18,26,22,0.66)] px-4 py-3 backdrop-blur-md overflow-hidden">
        {/* Play/Pause icon with rotation */}
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 overflow-hidden",
            pump.running ? "bg-sky-500/20 text-sky-300 shadow-[0_0_16px_rgba(56,189,248,0.5)]" : "bg-white/[0.04] text-[#9CA3AF]",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {pump.running ? (
              <motion.div
                key="running-play"
                initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <Play className="h-5 w-5 fill-current" />
              </motion.div>
            ) : (
              <motion.div
                key="idle-pause"
                initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <Pause className="h-5 w-5 fill-current" />
              </motion.div>
            )}
          </AnimatePresence>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            {pump.running ? t("dashboard.pumping") : t("dashboard.pumpIdle")}
            {pump.running && isManual && manualRemaining != null && (
              <span className="ml-2 font-mono text-xs font-medium text-[#34D399]">
                {Math.max(0, Math.ceil(manualRemaining))}s left
              </span>
            )}
          </p>
          <p className="truncate text-xs text-[#9CA3AF]">
            Soil Moisture: {snapshot.soil.toFixed(1)}% · Rain: {snapshot.rain ? "Yes" : "No"}
          </p>
        </div>
      </div>

      {/* Mode segmented control */}
      <div className="mt-3">
        <SegmentedControl
          options={MODES.map((m) => ({ id: m.id, label: t(m.labelKey) }))}
          value={pump.mode}
          onChange={handleMode}
          layoutId="pump-mode-dashboard"
          aria-label="Pump mode"
        />
      </div>

      {/* Big ON/OFF (Manual mode) */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handlePower(true)}
          disabled={!isManual || pump.running}
          className={cn(
            "flex items-center justify-center gap-2 rounded-[16px] px-4 py-3.5 text-sm font-bold transition-all",
            isManual && !pump.running
              ? "btn-primary-aurora text-black"
              : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-[#9CA3AF]/60",
          )}
        >
          <Power className="h-4 w-4" /> ON
        </button>
        <button
          type="button"
          onClick={() => handlePower(false)}
          disabled={!isManual || !pump.running}
          className={cn(
            "flex items-center justify-center gap-2 rounded-[16px] px-4 py-3.5 text-sm font-bold transition-all",
            isManual && pump.running
              ? "border border-rose-500/40 bg-rose-500/15 text-rose-200 shadow-[0_0_20px_rgba(251,113,133,0.3)] hover:bg-rose-500/25 active:scale-[0.98]"
              : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-[#9CA3AF]/60",
          )}
        >
          <Square className="h-4 w-4" /> OFF
        </button>
      </div>
      {!isManual && (
        <p className="mt-1.5 text-center text-[11px] text-[#9CA3AF]">
          Switch to Manual mode to use ON / OFF directly.
        </p>
      )}

      {/* Quick run buttons */}
      <div className="mt-3 flex items-center gap-2">
        <Timer className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
        <div className="grid flex-1 grid-cols-3 gap-2">
          {[5, 10, 30].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => handleQuickRun(sec)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-2 text-xs font-bold text-[#F3F4F6] transition-all hover:border-[#34D399]/40 hover:text-[#34D399] active:scale-[0.97]"
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* Live Auto-AI explanation */}
      {pump.mode === "auto" && (
        <div className="mt-3 space-y-1.5 rounded-[16px] border border-[#34D399]/20 bg-[#34D399]/[0.05] p-3 backdrop-blur-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#34D399]">
            Auto AI reasoning · live
          </p>
          {autoLines().map((l, i) => (
            <p key={i} className={cn("font-mono text-[11px] leading-relaxed", l.hot ? "text-amber-300" : "text-[#9CA3AF]")}>
              {l.hot ? "● " : "○ "}{l.text}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
