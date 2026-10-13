"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { OctagonX, Pause, Play, Power, Radio, Square, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarm, useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Card, CardHeader } from "./ui";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { playWaterDrop } from "@/lib/audio";

type Mode = "manual" | "auto";

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "manual", label: "MANUAL" },
  { id: "auto", label: "AUTO AI" },
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
  const [nowMs, setNowMs] = useState(() => Date.now());
  const prevRunning = useRef(farm.pump);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1-second ticker for confirmed Xs ago
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const lastSeenMs = useFarmStore((s) => s.live?.lastSeenAt ?? s.mqttLastSeen);
  const confirmedAgo = lastSeenMs ? Math.max(0, Math.floor((nowMs - lastSeenMs) / 1000)) : 0;

  // Pulse ring & audio on pump activation
  useEffect(() => {
    if (farm.pump && !prevRunning.current) {
      playWaterDrop();
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(timer);
    }
    prevRunning.current = farm.pump;
  }, [farm.pump]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const logPump = (title: string, message: string) => {
    addAlert({ level: "info", title, message });
    toast.success(title, { description: message });
  };

  const clearActiveTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePower = (on: boolean) => {
    clearActiveTimer();
    setPumpManual(on);
    farm.farmCmd(on ? "PUMP_ON" : "PUMP_OFF");
    const soilStr = farm.soil.toFixed(1);
    logPump(
      on ? "Pump turned ON" : "Pump turned OFF",
      on
        ? `Manual run — Soil at ${soilStr}%. Command: PUMP_ON.`
        : "Manual run stopped by user. Command: PUMP_OFF.",
    );
  };

  const handleQuickRun = (sec: number) => {
    clearActiveTimer();
    if (farm.mode !== "MANUAL") {
      farm.farmCmd("MODE_MANUAL");
      setPumpMode("manual");
      toast.info("Switched to MANUAL mode for timed run");
    }
    setPumpManual(true, sec);
    farm.farmCmd("PUMP_ON");
    const soilStr = farm.soil.toFixed(1);
    logPump(`Pump ON (${sec}S)`, `Quick manual run — Soil at ${soilStr}%.`);

    timerRef.current = setTimeout(() => {
      farm.farmCmd("PUMP_OFF");
      setPumpManual(false);
      logPump("Pump OFF", `Timed run (${sec}S) completed.`);
    }, sec * 1000);
  };

  const handleModeChange = (mode: Mode) => {
    clearActiveTimer();
    const cmd = mode === "auto" ? "MODE_AUTO" : "MODE_MANUAL";
    farm.farmCmd(cmd);
    setPumpMode(mode);
    const label = mode === "auto" ? "AUTO AI" : "MANUAL";
    const title = `Pump mode → ${label}`;
    const recentDuplicate = alerts.some(
      (a) => a.title === title && Date.now() - a.timestamp < 10 * 60 * 1000,
    );
    if (!recentDuplicate) {
      logPump(title, `Mode changed to ${label}. Command: ${cmd}.`);
    } else {
      toast.success(title, { description: `Mode changed to ${label}. Command: ${cmd}.` });
    }
  };

  const handleEmergencyStop = () => {
    clearActiveTimer();
    farm.farmCmd("PUMP_OFF");
    farm.farmCmd("MODE_MANUAL");
    setPumpManual(false);
    setPumpMode("manual");
    addAlert({
      level: "critical",
      title: "EMERGENCY STOP",
      message: `Emergency stop pressed. Sent PUMP_OFF + MODE_MANUAL.`,
    });
    toast.error("EMERGENCY STOP ACTIVATED", {
      description: "Dispatched PUMP_OFF and MODE_MANUAL to edge node.",
    });
  };

  const handleToggleR2 = () => {
    const nextR2 = !farm.r2;
    farm.setEdgeR2(nextR2);
    farm.farmCmd(nextR2 ? "R2_ON" : "R2_OFF");
    toast.success(nextR2 ? "Spare Relay (R2) turned ON" : "Spare Relay (R2) turned OFF", {
      description: `Command: ${nextR2 ? "R2_ON" : "R2_OFF"}`,
    });
  };

  const isManual = farm.mode === "MANUAL";
  const isRunning = farm.pump;

  // Status text from telemetry.pump when LIVE ("PUMP RUNNING" + confirmed Xs ago)
  const statusBadgeText = farm.isLive
    ? isRunning
      ? "PUMP RUNNING"
      : "IDLE"
    : isRunning
      ? "RUNNING"
      : "STANDBY";

  const statusDetailText = farm.isLive
    ? isRunning
      ? `PUMP RUNNING · confirmed ${confirmedAgo}s ago`
      : `IDLE · confirmed ${confirmedAgo}s ago`
    : isRunning
      ? t("dashboard.pumping")
      : t("dashboard.pumpIdle");

  const nowStamp = new Date().toLocaleTimeString("en-GB", { hour12: false });
  const isSafetyLocked = Boolean(farm.rain || farm.stale);

  return (
    <Card className={cn("relative rounded-[12px] border border-[var(--line)] bg-[var(--panel)] p-6", pulse && "border-[var(--terra)]")}>
      {isRunning && <span aria-hidden className="pump-pulse-ring" />}

      {/* Header row */}
      <CardHeader
        title={t("dashboard.pumpStatus")}
        subtitle={`MODE: ${farm.mode === "AUTO" ? "AUTO AI" : "MANUAL"}`}
        action={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-none border px-2.5 py-0.5 text-[10px] font-editorial-mono font-bold tracking-widest uppercase transition-all",
              isRunning
                ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]"
                : "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)]",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-none", isRunning ? "animate-pulse bg-[var(--terra)]" : "bg-[var(--ink-3)]")} />
            {statusBadgeText}
          </span>
        }
      />

      {/* Status visual - Editorial Panel */}
      <div className="relative flex items-center gap-3 rounded-none border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-none border transition-all",
            isRunning
              ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]"
              : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-3)]",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isRunning ? (
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
            {statusDetailText}
            {isRunning && isManual && manualRemaining != null && (
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

      {/* Segmented [MANUAL][AUTO AI] sends MODE_MANUAL / MODE_AUTO */}
      <div className="mt-3">
        <SegmentedControl
          options={MODES}
          value={farm.mode === "AUTO" ? "auto" : "manual"}
          onChange={(m) => handleModeChange(m as Mode)}
          layoutId="pump-mode-dashboard"
          aria-label="Pump mode"
        />
      </div>

      {/* Buttons [ON] and [OFF] */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handlePower(true)}
          disabled={!isManual || isRunning}
          className={cn(
            "flex h-14 items-center justify-center gap-2 rounded-none border text-xs font-editorial-mono font-bold uppercase tracking-widest transition-all select-none",
            isManual && isRunning
              ? "border-[var(--terra)] bg-[var(--terra)] text-white ring-2 ring-[var(--terra)]/60 animate-pulse shadow-[0_0_16px_rgba(196,80,58,0.5)]"
              : isManual && !isRunning
                ? "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink)] hover:border-[var(--ink-2)] hover:bg-[var(--panel)] cursor-pointer"
                : "border-[var(--line)] bg-[var(--panel-2)]/30 text-[var(--ink-3)] cursor-not-allowed opacity-40",
          )}
        >
          <Power className="h-4 w-4" /> ON
        </button>
        <button
          type="button"
          onClick={() => handlePower(false)}
          disabled={!isManual || !isRunning}
          className={cn(
            "flex h-14 items-center justify-center gap-2 rounded-none border text-xs font-editorial-mono font-bold uppercase tracking-widest transition-all select-none",
            isManual && isRunning
              ? "border-[var(--terra)] bg-[var(--panel-2)] text-[var(--terra)] hover:bg-[var(--terra-soft)] cursor-pointer"
              : isManual && !isRunning
                ? "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)]"
                : "border-[var(--line)] bg-[var(--panel-2)]/30 text-[var(--ink-3)] cursor-not-allowed opacity-40",
          )}
        >
          <Square className="h-4 w-4" /> OFF
        </button>
      </div>
      {!isManual && (
        <p className="mt-1 text-center font-editorial-mono text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
          Switch to MANUAL mode to toggle ON / OFF directly.
        </p>
      )}

      {/* Timers buttons [5S] [10S] [30S] (timers = PUMP_ON then setTimeout PUMP_OFF) */}
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

      {/* Spare relay (R2) toggle row (sends R2_ON / R2_OFF) */}
      <div className="mt-3 flex items-center justify-between rounded-none border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 font-editorial-mono text-xs">
        <div className="flex items-center gap-2">
          <Radio className={cn("h-4 w-4", farm.r2 ? "text-emerald-400" : "text-[var(--ink-3)]")} />
          <span className="font-bold text-[var(--ink)] uppercase tracking-wider">
            SPARE RELAY (R2): {farm.r2 ? "ON" : "OFF"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggleR2}
          className={cn(
            "rounded-none border px-3 py-1 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer",
            farm.r2
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
              : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:text-[var(--ink)]",
          )}
        >
          {farm.r2 ? "R2_OFF" : "R2_ON"}
        </button>
      </div>

      {/* [EMERGENCY STOP] sends PUMP_OFF + MODE_MANUAL */}
      <button
        type="button"
        onClick={handleEmergencyStop}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-none border border-red-500/60 bg-red-600/90 px-4 py-3 font-editorial-mono text-xs font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all hover:bg-red-500 active:scale-[0.98] cursor-pointer"
      >
        <OctagonX className="h-4 w-4" /> EMERGENCY STOP
      </button>

      {/* Agent reasoning when auto */}
      {farm.mode === "AUTO" && (
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
          <div className="flex items-start gap-1.5 leading-relaxed text-[var(--ink-2)]">
            <span className="text-[var(--ink-3)] shrink-0 font-mono">[{nowStamp}]</span>
            <span>
              Soil: {farm.soil.toFixed(1)}% (Low: {thresholds?.moistureLow ?? 30}%, High: {thresholds?.moistureHigh ?? 75}%) · Rain: {farm.rain ? "DETECTED" : "NONE"}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
});

export default PumpControl;
export const PumpCard = PumpControl;
