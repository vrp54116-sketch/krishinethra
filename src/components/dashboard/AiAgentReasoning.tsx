"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, ShieldAlert, CloudRain, CheckCircle2, AlertTriangle } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ReasoningState {
  id: string;
  type: "on" | "off" | "rain_lock" | "stale_lock" | "manual_hold";
  headline: string;
  rule: string;
}

export default function AiAgentReasoning({ className }: { className?: string }) {
  const snapshot = useFarmStore((s) => s.snapshot);
  const pump = useFarmStore((s) => s.pump);
  const thresholds = useFarmStore((s) => s.settings.thresholds);
  const manualRemaining = useFarmStore((s) => s.manualPumpRemainingSec);

  const [elapsedSec, setElapsedSec] = useState(0);

  // Compute dynamic reasoning based on current telemetry & settings
  const currentReasoning = useMemo<ReasoningState>(() => {
    const soil = Math.round(snapshot.soil ?? 45);
    const rain = snapshot.rain;
    const stale = snapshot.stale;
    const isAuto = pump.mode === "auto";
    const isRunning = pump.running;
    const lowThresh = thresholds.moistureLow;
    const highThresh = thresholds.moistureHigh;

    if (stale) {
      return {
        id: `stale-${stale}`,
        type: "stale_lock",
        headline: "Sensor node stale (UNO link dead 5s+) → Auto-irrigation locked for safety",
        rule: "Fail-safe watchdog triggered: irrigation suppressed until link restored",
      };
    }

    if (rain) {
      return {
        id: `rain-${rain}-${isRunning}`,
        type: "rain_lock",
        headline: "Rain detected → Pump locked OFF (water savings: ~12L today)",
        rule: `Rain sensor active • Precip: ${snapshot.rainMm.toFixed(1)} mm • Conserving reservoir`,
      };
    }

    if (isAuto) {
      if (isRunning) {
        return {
          id: `on-${soil}`,
          type: "on",
          headline: `Soil ${soil}% < ${lowThresh}% threshold AND No rain detected → Pump ON (Auto mode)`,
          rule: `Active hydration cycle • Moisture target: ${highThresh}% • Auto shutoff armed`,
        };
      } else {
        if (soil >= highThresh) {
          return {
            id: `off-high-${soil}`,
            type: "off",
            headline: `Soil ${soil}% > ${highThresh}% threshold → Pump OFF`,
            rule: "Optimal root zone saturation reached • Pump idle",
          };
        } else {
          return {
            id: `off-normal-${soil}`,
            type: "off",
            headline: `Soil ${soil}% within acceptable zone [${lowThresh}% - ${highThresh}%] → Pump OFF`,
            rule: "Autonomous guard cycle active • Continuous soil moisture surveillance",
          };
        }
      }
    } else {
      // Manual mode
      if (isRunning) {
        return {
          id: `manual-on-${soil}`,
          type: "on",
          headline: "Manual override active → Pump running under operator control",
          rule: `Manual burst timer: ${manualRemaining != null ? Math.ceil(manualRemaining) : 0}s remaining • Safety cut-off at 10m`,
        };
      } else {
        return {
          id: `manual-off-${soil}`,
          type: "manual_hold",
          headline: "Manual mode enabled → Pump idle waiting for command",
          rule: "Autonomous decisions paused • Operator manual dispatch ready",
        };
      }
    }
  }, [
    snapshot.soil,
    snapshot.rain,
    snapshot.rainMm,
    snapshot.stale,
    pump.mode,
    pump.running,
    manualRemaining,
    thresholds.moistureLow,
    thresholds.moistureHigh,
  ]);

  const [lastHeadline, setLastHeadline] = useState(currentReasoning.headline);
  if (lastHeadline !== currentReasoning.headline) {
    setLastHeadline(currentReasoning.headline);
    setElapsedSec(0);
  }

  // Live timer for "Last updated: X seconds ago"
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec: number) => {
    if (sec <= 1) return "Just now";
    if (sec < 60) return `${sec} seconds ago`;
    const min = Math.floor(sec / 60);
    return `${min}m ${sec % 60}s ago`;
  };

  const getToneDetails = (type: ReasoningState["type"]) => {
    switch (type) {
      case "on":
        return {
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
          textColor: "text-emerald-300",
          glow: "shadow-[0_0_24px_rgba(16,185,129,0.18)]",
          border: "border-emerald-500/30",
        };
      case "rain_lock":
        return {
          badge: "bg-rose-500/20 text-rose-300 border-rose-400/30",
          icon: <CloudRain className="h-4 w-4 text-rose-400" />,
          textColor: "text-rose-300",
          glow: "shadow-[0_0_24px_rgba(244,63,94,0.18)]",
          border: "border-rose-500/30",
        };
      case "stale_lock":
        return {
          badge: "bg-rose-500/25 text-rose-300 border-rose-400/40",
          icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
          textColor: "text-rose-300",
          glow: "shadow-[0_0_28px_rgba(244,63,94,0.25)]",
          border: "border-rose-500/40",
        };
      case "manual_hold":
        return {
          badge: "bg-amber-500/20 text-amber-300 border-amber-400/30",
          icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
          textColor: "text-amber-300",
          glow: "shadow-[0_0_24px_rgba(245,158,11,0.18)]",
          border: "border-amber-500/30",
        };
      case "off":
      default:
        return {
          badge: "bg-white/10 text-zinc-300 border-white/15",
          icon: <Sparkles className="h-4 w-4 text-sky-400" />,
          textColor: "text-white/95",
          glow: "shadow-[0_0_20px_rgba(255,255,255,0.06)]",
          border: "border-white/15",
        };
    }
  };

  const tone = getToneDetails(currentReasoning.type);

  return (
    <div
      className={cn(
        "liquid-glass-card relative overflow-hidden rounded-3xl p-5 md:p-6 transition-all duration-300",
        tone.border,
        tone.glow,
        className,
      )}
    >
      {/* Subtle background ambient pulse */}
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-25 transition-all duration-700",
          currentReasoning.type === "on"
            ? "bg-emerald-500"
            : currentReasoning.type === "rain_lock" || currentReasoning.type === "stale_lock"
              ? "bg-rose-500"
              : currentReasoning.type === "manual_hold"
                ? "bg-amber-500"
                : "bg-sky-500",
        )}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-inner">
            <Brain className="h-4 w-4 text-sky-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90 flex items-center gap-2">
              🧠 AI Agent Reasoning
            </h3>
            <p className="text-[11px] text-zinc-400">
              Edge decision engine • Real-time rule evaluation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border backdrop-blur-md",
              tone.badge,
            )}
          >
            {tone.icon}
            {pump.mode === "auto" ? "Autonomous Logic" : "Manual Mode"}
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {formatElapsed(elapsedSec)}
          </span>
        </div>
      </div>

      {/* Reasoning Display with Spring Animation */}
      <div className="mt-4 relative min-h-[76px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentReasoning.id + currentReasoning.headline}
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
            }}
            className="flex flex-col gap-1.5"
          >
            <p className={cn("text-base md:text-lg font-semibold tracking-tight", tone.textColor)}>
              {currentReasoning.headline}
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/40" />
              <span>{currentReasoning.rule}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer live status bar */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 font-mono">
        <div className="flex items-center gap-3">
          <span>Soil: <strong className="text-white">{Math.round(snapshot.soil ?? 45)}%</strong></span>
          <span>Rain: <strong className={snapshot.rain ? "text-rose-400" : "text-emerald-400"}>{snapshot.rain ? "DETECTED" : "CLEAR"}</strong></span>
          <span>Link: <strong className={snapshot.stale ? "text-rose-400" : "text-emerald-400"}>{snapshot.stale ? "STALE" : "HEALTHY"}</strong></span>
        </div>
        <div className="text-zinc-500">
          Thresholds: {thresholds.moistureLow}% / {thresholds.moistureHigh}%
        </div>
      </div>
    </div>
  );
}
