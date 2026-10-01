"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Pause, Play, Power, Square, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarm, useFarmStore } from "@/lib/store";
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

export const PumpControl = memo(function PumpControl() {
  const t = useT();
  const farm = useFarm();
  const pump = farm.pumpState;
  const thresholds = farm.thresholds;
  const manualRemaining = farm.manualRemainingSec;
  const setPumpManual = farm.setPumpManual;
  const setPumpMode = farm.setPumpMode;
  const addAlert = useFarmStore((s) => s.addAlert);
  const alerts = farm.alerts;

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
    const soilStr = farm.soil.toFixed(1);
    logPump(
      on ? "Pump turned ON (Manual)" : "Pump turned OFF (Manual)",
      on
        ? `Manual run for ${thresholds?.pumpDurationSec ?? 30}s — Soil at ${soilStr}%.`
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
    const soilStr = farm.soil.toFixed(1);
    logPump(
      `Pump ON for ${sec}s`,
      `Quick manual run — Soil at ${soilStr}%.`,
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
    const soil = farm.soil;
    const rain = farm.rain;
    const low = thresholds?.moistureLow ?? 30;
    const high = thresholds?.moistureHigh ?? 75;

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

  const nowStamp = new Date().toLocaleTimeString("en-GB", { hour12: false });
  const isSafetyLocked = Boolean(farm.rain || farm.stale);

  return (
    <Card className={cn("relative rounded-none border border-[var(--line)] bg-[var(--panel)] p-5", pulse && "border-[var(--terra)]")}>
      {/* Rule 9: pump-ON = orange pulse ring */}
      {pump.running && (
        <span aria-hidden className="pump-pulse-ring" />
      )}

      {/* Header row = mono uppercase label left + status stamp right */}
      <CardHeader
        title={t("dashboard.pumpStatus")}
        subtitle={`MODE: ${pump.mode === "auto" ? "AUTO AI" : pump.mode === "manual" ? "MANUAL" : "SCHEDULE"}`}
        action={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-none border px-2.5 py-0.5 text-[10px] font-editorial-mono font-bold tracking-widest uppercase transition-all",
              pump.running
                ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]"
                : "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)]",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-none", pump.running ? "animate-pulse bg-[var(--terra)]" : "bg-[var(--ink-3)]")} />
            {pump.running ? "RUNNING" : "STANDBY"}
          </span>
        }
      />

      {/* Status visual - Editorial Panel */}
      <div className="relative flex items-center gap-3 rounded-none border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-none border transition-all",
            pump.running
              ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]"
              : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-3)]",
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
                <Play className="h-4 w-4 fill-current" />
              </motion.div>
            ) : (
              <motion.div
                key="idle-pause"
                initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <Pause className="h-4 w-4 fill-current" />
              </motion.div>
            )}
          </AnimatePresence>
        </span>
        <div className="min-w-0 flex-1 font-editorial-mono">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            {pump.running ? t("dashboard.pumping") : t("dashboard.pumpIdle")}
            {pump.running && isManual && manualRemaining != null && (
              <span className="ml-2 text-[var(--terra)] font-semibold">
                {Math.max(0, Math.ceil(manualRemaining))}S LEFT
              </span>
            )}
          </p>
          <p className="truncate text-[10px] uppercase text-[var(--ink-3)]">
            SOIL: {farm.soil.toFixed(1)}% · RAIN: {farm.rain ? "DETECTED" : "NONE"}
          </p>
        </div>
      </div>

      {/* Mode segmented control as bordered square tabs */}
      <div className="mt-3">
        <SegmentedControl
          options={MODES.map((m) => ({ id: m.id, label: t(m.labelKey) }))}
          value={pump.mode}
          onChange={handleMode}
          layoutId="pump-mode-dashboard"
          aria-label="Pump mode"
        />
      </div>

      {/* Big ON/OFF square switch */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handlePower(true)}
          disabled={!isManual || pump.running}
          className={cn(
            "flex h-14 items-center justify-center gap-2 rounded-none border text-xs font-editorial-mono font-bold uppercase tracking-widest transition-all select-none",
            isManual && pump.running
              ? "border-[var(--terra)] bg-[var(--terra)] text-white ring-2 ring-[var(--terra)]/60 animate-pulse shadow-[0_0_16px_rgba(196,80,58,0.5)]"
              : isManual && !pump.running
                ? "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink)] hover:border-[var(--ink-2)] hover:bg-[var(--panel)] cursor-pointer"
                : "border-[var(--line)] bg-[var(--panel-2)]/30 text-[var(--ink-3)] cursor-not-allowed opacity-40",
          )}
        >
          <Power className="h-4 w-4" /> ON
        </button>
        <button
          type="button"
          onClick={() => handlePower(false)}
          disabled={!isManual || !pump.running}
          className={cn(
            "flex h-14 items-center justify-center gap-2 rounded-none border text-xs font-editorial-mono font-bold uppercase tracking-widest transition-all select-none",
            isManual && pump.running
              ? "border-[var(--terra)] bg-[var(--panel-2)] text-[var(--terra)] hover:bg-[var(--terra-soft)] cursor-pointer"
              : isManual && !pump.running
                ? "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)]"
                : "border-[var(--line)] bg-[var(--panel-2)]/30 text-[var(--ink-3)] cursor-not-allowed opacity-40",
          )}
        >
          <Square className="h-4 w-4" /> OFF
        </button>
      </div>
      {!isManual && (
        <p className="mt-1 text-center font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
          Switch to Manual mode to toggle ON / OFF directly.
        </p>
      )}

      {/* Quick run timers as square ghost buttons */}
      <div className="mt-3 flex items-center gap-2">
        <Timer className="h-4 w-4 shrink-0 text-[var(--ink-3)]" />
        <div className="grid flex-1 grid-cols-3 gap-2">
          {[5, 10, 30].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => handleQuickRun(sec)}
              className="rounded-none border border-[var(--line)] bg-[var(--panel-2)] px-2 py-2 text-xs font-editorial-mono font-bold text-[var(--ink-2)] uppercase transition-all hover:border-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--panel)] cursor-pointer"
            >
              {sec}S
            </button>
          ))}
        </div>
      </div>

      {/* Agent reasoning = mono log lines with timestamps, LOCKED stamps where safety fired */}
      {pump.mode === "auto" && (
        <div className="mt-3 space-y-1.5 rounded-none border border-[var(--line)] bg-[var(--panel-2)] p-3 font-editorial-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5 mb-2">
            <span className="font-bold uppercase tracking-wider text-[var(--ink-2)]">
              AGENT REASONING // JAL-AI
            </span>
            {isSafetyLocked && (
              <span className="px-1.5 py-0.5 border border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)] font-bold text-[10px] uppercase tracking-wider">
                LOCKED
              </span>
            )}
          </div>
          {autoLines().map((l, i) => (
            <div key={i} className="flex items-start gap-1.5 leading-relaxed text-[var(--ink-2)]">
              <span className="text-[var(--ink-3)] shrink-0 font-mono">[{nowStamp}]</span>
              {isSafetyLocked && i === 0 && (
                <span className="shrink-0 px-1 py-0.2 border border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)] font-bold text-[9px] uppercase">
                  LOCKED
                </span>
              )}
              <span className={cn(l.hot && "text-[var(--terra)] font-semibold")}>
                {l.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
});

export default PumpControl;
export const PumpCard = PumpControl;
