"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { OctagonX, Power, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Card, CardHeader } from "@/components/dashboard/ui";
import SegmentedControl from "@/components/ui/SegmentedControl";

type Mode = "manual" | "auto" | "schedule";

const MODES: Array<{ id: Mode; labelKey: string }> = [
  { id: "manual", labelKey: "irrigation.manual" },
  { id: "auto", labelKey: "irrigation.autoAI" },
  { id: "schedule", labelKey: "irrigation.schedule" },
];

/** Spinning centrifugal-pump impeller — rotates only while running. */
function Impeller({ running }: { running: boolean }) {
  return (
    <div
      className={cn(
        "relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2",
        running
          ? "border-sky-400/60 bg-sky-500/10 shadow-[0_0_32px_rgba(56,189,248,0.45)]"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className={cn("h-20 w-20", running && "animate-spin")}
        style={running ? { animationDuration: "1.4s" } : undefined}
      >
        {/* housing */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" className={running ? "text-sky-400/70" : "text-zinc-700"} />
        {/* 6 curved blades */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 50 50)`}>
            <path
              d="M50 50 C 58 40, 66 32, 78 28 L 74 40 C 65 43, 58 49, 54 56 Z"
              fill={running ? "#38bdf8" : "#3f3f46"}
              opacity={running ? 0.9 : 0.8}
            />
          </g>
        ))}
        {/* hub */}
        <circle cx="50" cy="50" r="9" fill={running ? "#0ea5e9" : "#52525b"} />
        <circle cx="50" cy="50" r="3.5" fill="#020617" />
      </svg>
      {/* status dot */}
      <span
        className={cn(
          "absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-black",
          running ? "animate-pulse bg-emerald-400" : "bg-zinc-600",
        )}
      />
    </div>
  );
}

export default function PumpHeroCard() {
  const t = useT();
  const pump = useFarmStore((s) => s.pump);
  const snapshot = useFarmStore((s) => s.snapshot);
  const thresholds = useFarmStore((s) => s.settings.thresholds);
  const manualRemaining = useFarmStore((s) => s.manualPumpRemainingSec);
  const setPumpManual = useFarmStore((s) => s.setPumpManual);
  const setPumpMode = useFarmStore((s) => s.setPumpMode);
  const addAlert = useFarmStore((s) => s.addAlert);
  const alerts = useFarmStore((s) => s.alerts);

  const isManual = pump.mode === "manual";

  const logPump = (title: string, message: string) => {
    addAlert({ level: "info", title, message });
    toast.success(title, { description: message });
  };

  const handlePower = (on: boolean) => {
    setPumpManual(on);
    logPump(
      on ? "Pump turned ON (Manual)" : "Pump turned OFF (Manual)",
      on
        ? `Manual run for ${thresholds.pumpDurationSec}s — Zone B at ${snapshot.soilMoistureB.toFixed(1)}%, tank ${snapshot.tankLevelPercent.toFixed(0)}%.`
        : "Manual run stopped by user.",
    );
  };

  const handleQuickRun = (sec: number) => {
    setPumpManual(true, sec);
    logPump(
      `Pump ON for ${sec}s`,
      `Quick manual run — Zone B at ${snapshot.soilMoistureB.toFixed(1)}%, tank ${snapshot.tankLevelPercent.toFixed(0)}%.`,
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

  const handleEmergencyStop = () => {
    useFarmStore.setState((s) => ({
      pump: { ...s.pump, running: false },
      manualPumpRemainingSec: null,
    }));
    addAlert({
      level: "critical",
      title: "Emergency STOP pressed",
      message: `Pump force-stopped by user at Zone B ${snapshot.soilMoistureB.toFixed(1)}%.${pump.mode === "auto" ? " Auto AI may restart it if dry conditions persist." : ""}`,
    });
    toast.error("Emergency STOP", {
      description: "Pump halted immediately. All timed runs cancelled.",
    });
  };

  return (
    <Card className={pump.running ? "border-sky-400/30" : undefined}>
      <CardHeader
        title={t("irrigation.pumpTitle")}
        subtitle={`Mode: ${pump.mode === "auto" ? "Auto AI" : pump.mode === "manual" ? "Manual" : "Schedule"} · Flow ${snapshot.flowRateLpm.toFixed(2)} L/min`}
        action={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-widest",
              pump.running
                ? "border-sky-400/50 bg-sky-500/15 text-sky-300"
                : "border-white/10 bg-white/[0.03] text-zinc-400",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", pump.running ? "animate-pulse bg-sky-400" : "bg-zinc-600")} />
            {pump.running ? t("irrigation.running") : t("irrigation.idle")}
          </span>
        }
      />

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
        <Impeller running={pump.running} />

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xl font-semibold tabular-nums tracking-tight text-white sm:text-2xl">
            {pump.running ? t("dashboard.pumping") : t("dashboard.pumpIdle")}
            {pump.running && manualRemaining != null && (
              <span className="ml-2 font-mono text-sm font-medium text-sky-300">
                {Math.max(0, Math.ceil(manualRemaining))}s left
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            {snapshot.pumpCurrentA.toFixed(2)} A · Zone B {snapshot.soilMoistureB.toFixed(1)}% · Tank {snapshot.tankLevelPercent.toFixed(0)}%
          </p>

          {/* Animated water stream while running */}
          <div className="mt-2 flex h-6 items-center justify-center gap-1.5 sm:justify-start" aria-hidden>
            {pump.running ? (
              <>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                    animate={{ x: [0, 46, 92], opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                  />
                ))}
                <span className="ml-1 text-[11px] font-semibold text-sky-300">water flowing</span>
              </>
            ) : (
              <span className="text-[11px] text-[#9CA3AF]">no flow — pump is off</span>
            )}
          </div>
        </div>
      </div>

      {/* Mode segmented control */}
      <div className="mt-4">
        <SegmentedControl
          options={MODES.map((m) => ({ id: m.id, label: t(m.labelKey) }))}
          value={pump.mode}
          onChange={handleMode}
          layoutId="pump-mode-hero"
          aria-label="Pump mode"
        />
      </div>

      {/* Manual ON / OFF */}
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
          <Power className="h-4 w-4" /> {t("common.on")}
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
          <Square className="h-4 w-4" /> {t("common.off")}
        </button>
      </div>

      {/* Timed runs */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[5, 10, 30].map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => handleQuickRun(sec)}
            disabled={!isManual}
            className={cn(
              "rounded-full border px-2 py-2.5 text-xs font-bold transition-all active:scale-[0.97]",
              isManual
                ? "border-white/10 bg-white/[0.04] text-[#F3F4F6] hover:border-[#38BDF8]/40 hover:text-[#38BDF8]"
                : "cursor-not-allowed border-white/10 bg-white/[0.02] text-[#9CA3AF]/60",
            )}
          >
            {sec}s
          </button>
        ))}
      </div>
      {!isManual && (
        <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-center text-[11px] font-medium text-amber-200">
          {pump.mode === "auto"
            ? "AI is controlling — manual ON / OFF and timers are disabled. Switch to Manual to take over."
            : "Schedule is controlling — manual ON / OFF and timers are disabled. Switch to Manual to take over."}
        </p>
      )}

      {/* Emergency stop — always live */}
      <button
        type="button"
        onClick={handleEmergencyStop}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/60 bg-red-600/90 px-4 py-3 text-sm font-extrabold tracking-wide text-white shadow-[0_0_24px_rgba(239,68,68,0.45)] transition-all hover:bg-red-500 active:scale-[0.98]"
      >
        <OctagonX className="h-5 w-5" /> {t("irrigation.emergencyStop")}
      </button>
    </Card>
  );
}
