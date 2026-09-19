"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { Droplets, Power, Square, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Card, CardHeader } from "./ui";

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

  const logPump = (title: string, message: string) => {
    addAlert({ level: "info", title, message });
    toast.success(title, { description: message });
  };

  const handlePower = (on: boolean) => {
    setPumpManual(on);
    logPump(
      on ? "Pump turned ON (Manual)" : "Pump turned OFF (Manual)",
      on
        ? `Manual run for ${thresholds.pumpDurationSec}s — Zone B at ${snapshot.soilMoistureB.toFixed(1)}%.`
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
      `Quick manual run — Zone B at ${snapshot.soilMoistureB.toFixed(1)}%, tank ${snapshot.tankLevelPercent.toFixed(0)}%.`,
    );
  };

  const handleMode = (mode: Mode) => {
    setPumpMode(mode);
    const label = mode === "auto" ? "Auto AI" : mode === "manual" ? "Manual" : "Schedule";
    logPump(`Pump mode → ${label}`, `Mode changed to ${label} by user.`);
  };

  // Live Auto-AI reasoning lines.
  const autoLines = (): Array<{ text: string; hot: boolean }> => {
    const m = snapshot.soilMoistureB;
    const low = thresholds.moistureLow;
    const high = thresholds.moistureHigh;
    const tank = snapshot.tankLevelPercent;
    if (pump.running) {
      return [
        {
          text: `Zone B moisture ${m.toFixed(1)}% — pump RUNNING, lifting toward ${high}%`,
          hot: true,
        },
        {
          text:
            tank < 10
              ? `Tank ${tank.toFixed(0)}% < 10% — auto-stop imminent, refill soon`
              : `Tank ${tank.toFixed(0)}% healthy — irrigation continues`,
          hot: tank < 10,
        },
      ];
    }
    if (tank <= 15) {
      return [
        {
          text: `Tank ${tank.toFixed(0)}% ≤ 15% — auto-start blocked until refill`,
          hot: true,
        },
        {
          text: `Zone B moisture ${m.toFixed(1)}% vs threshold ${low}% — waiting on water supply`,
          hot: false,
        },
      ];
    }
    if (m < low) {
      return [
        {
          text: `Zone B moisture ${m.toFixed(1)}% < threshold ${low}% → pump will start`,
          hot: true,
        },
        {
          text: `Tank ${tank.toFixed(0)}% OK — auto-start conditions met`,
          hot: false,
        },
      ];
    }
    return [
      {
        text: `Zone B moisture ${m.toFixed(1)}% ≥ threshold ${low}% — holding OFF`,
        hot: false,
      },
      {
        text: `Will restart if moisture drops below ${low}% or tank refills above 15%`,
        hot: false,
      },
    ];
  };

  const isManual = pump.mode === "manual";

  return (
    <Card>
      <CardHeader
        title={t("dashboard.pumpStatus")}
        subtitle={`Mode: ${pump.mode === "auto" ? "Auto AI" : pump.mode === "manual" ? "Manual" : "Schedule"}`}
        action={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-widest",
              pump.running
                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                : "border-white/10 bg-white/[0.03] text-zinc-400",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", pump.running ? "animate-pulse bg-emerald-400" : "bg-zinc-600")} />
            {pump.running ? "ON" : "OFF"}
          </span>
        }
      />

      {/* Status visual */}
      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/40 px-4 py-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            pump.running ? "bg-sky-500/15 text-sky-300" : "bg-white/[0.04] text-zinc-500",
          )}
        >
          <Droplets className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            {pump.running ? t("dashboard.pumping") : t("dashboard.pumpIdle")}
            {pump.running && isManual && manualRemaining != null && (
              <span className="ml-2 font-mono text-xs font-medium text-emerald-300">
                {Math.max(0, Math.ceil(manualRemaining))}s left
              </span>
            )}
          </p>
          <p className="truncate text-xs text-zinc-500">
            Flow {snapshot.flowRateLpm.toFixed(2)} L/min · {snapshot.pumpCurrentA.toFixed(2)} A
          </p>
        </div>
        {/* Animated droplets when ON */}
        {pump.running && (
          <div className="flex shrink-0 items-end gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full bg-sky-400"
                animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mode segmented control */}
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleMode(m.id)}
            className={cn(
              "rounded-lg px-2 py-2 text-xs font-bold transition-all",
              pump.mode === m.id
                ? "bg-emerald-500 text-black shadow-[0_0_16px_rgba(34,197,94,0.4)]"
                : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            {t(m.labelKey)}
          </button>
        ))}
      </div>

      {/* Big ON/OFF (Manual mode) */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handlePower(true)}
          disabled={!isManual || pump.running}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-extrabold transition-all",
            isManual && !pump.running
              ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:bg-emerald-400 active:scale-[0.98]"
              : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-zinc-600",
          )}
        >
          <Power className="h-4 w-4" /> ON
        </button>
        <button
          type="button"
          onClick={() => handlePower(false)}
          disabled={!isManual || !pump.running}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-extrabold transition-all",
            isManual && pump.running
              ? "border border-red-400/50 bg-red-500/15 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-500/25 active:scale-[0.98]"
              : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-zinc-600",
          )}
        >
          <Square className="h-4 w-4" /> OFF
        </button>
      </div>
      {!isManual && (
        <p className="mt-1.5 text-center text-[11px] text-zinc-600">
          Switch to Manual mode to use ON / OFF directly.
        </p>
      )}

      {/* Quick run buttons */}
      <div className="mt-3 flex items-center gap-2">
        <Timer className="h-4 w-4 shrink-0 text-zinc-500" />
        <div className="grid flex-1 grid-cols-3 gap-2">
          {[5, 10, 30].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => handleQuickRun(sec)}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs font-bold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-emerald-200 active:scale-[0.97]"
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* Live Auto-AI explanation */}
      {pump.mode === "auto" && (
        <div className="mt-3 space-y-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
            Auto AI reasoning · live
          </p>
          {autoLines().map((l, i) => (
            <p key={i} className={cn("font-mono text-[11px] leading-relaxed", l.hot ? "text-amber-300" : "text-zinc-400")}>
              {l.hot ? "● " : "○ "}{l.text}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
