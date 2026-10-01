"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, ShieldAlert, CloudRain, CheckCircle2, AlertTriangle } from "lucide-react";
import { useFarm } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ReasoningState {
  id: string;
  type: "on" | "off" | "rain_lock" | "stale_lock" | "manual_hold";
  headline: string;
  rule: string;
}

export default function AiAgentReasoning({ className }: { className?: string }) {
  const farm = useFarm();
  const manualRemaining = farm.manualRemainingSec;

  const [elapsedSec, setElapsedSec] = useState(0);

  // Compute dynamic reasoning based on current telemetry & settings
  const currentReasoning = useMemo<ReasoningState>(() => {
    const soil = Math.round(farm.soil);
    const rain = farm.rain;
    const stale = farm.stale;
    const isAuto = farm.mode === "AUTO";
    const isRunning = farm.pump;
    const lowThresh = farm.thresholds?.moistureLow ?? 30;
    const highThresh = farm.thresholds?.moistureHigh ?? 75;

    if (stale) {
      return {
        id: `stale-${stale}`,
        type: "stale_lock",
        headline: "Sensor node stale (Edge node offline 5s+) → Auto-irrigation locked for safety",
        rule: "Fail-safe watchdog triggered: irrigation suppressed until link restored",
      };
    }

    if (rain) {
      const rainMmVal = (farm.snapshot?.rainMm ?? 0).toFixed(1);
      return {
        id: `rain-${rain}-${isRunning}`,
        type: "rain_lock",
        headline: "Rain detected → Pump locked OFF (water savings: ~12L today)",
        rule: `Rain sensor active • Precip: ${rainMmVal} mm • Conserving reservoir`,
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
    farm.soil,
    farm.rain,
    farm.snapshot?.rainMm,
    farm.stale,
    farm.mode,
    farm.pump,
    manualRemaining,
    farm.thresholds?.moistureLow,
    farm.thresholds?.moistureHigh,
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

  const isLocked = currentReasoning.type === "rain_lock" || currentReasoning.type === "stale_lock";
  const nowStamp = new Date().toLocaleTimeString("en-GB", { hour12: false });

  return (
    <div
      className={cn(
        "relative rounded-none border border-[var(--line)] bg-[var(--panel)] p-4 font-editorial-mono transition-all",
        className,
      )}
    >
      {/* Header row = mono uppercase label left + status stamp right */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-none bg-[var(--panel-2)] border border-[var(--line)]">
            <Brain className="h-3.5 w-3.5 text-[var(--ink-2)]" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              AI AGENT REASONING // JAL-SUPERVISOR
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="px-1.5 py-0.5 border border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)] font-bold text-[10px] uppercase tracking-wider">
              LOCKED
            </span>
          ) : (
            <span className="px-1.5 py-0.5 border border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)] font-bold text-[10px] uppercase tracking-wider">
              {farm.mode === "AUTO" ? "AUTONOMOUS" : "MANUAL"}
            </span>
          )}
          <span className="text-[10px] text-[var(--ink-3)] font-mono">
            [{nowStamp}]
          </span>
        </div>
      </div>

      {/* Reasoning Display as Mono Log Lines with Timestamps */}
      <div className="mt-3 space-y-1.5 min-h-[56px] flex flex-col justify-center text-xs">
        <div className="flex items-start gap-2">
          <span className="text-[var(--ink-3)] shrink-0 font-mono">[{nowStamp}]</span>
          {isLocked && (
            <span className="shrink-0 px-1 py-0.2 border border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)] font-bold text-[9px] uppercase">
              LOCKED
            </span>
          )}
          <span className={cn("font-medium", isLocked ? "text-[var(--terra)]" : "text-[var(--ink)]")}>
            {currentReasoning.headline}
          </span>
        </div>
        <div className="flex items-start gap-2 text-[11px] text-[var(--ink-2)] pl-6">
          <span className="text-[var(--ink-3)]">↳</span>
          <span>{currentReasoning.rule}</span>
        </div>
      </div>

      {/* Footer live status bar */}
      <div className="mt-3 pt-2 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--ink-3)]">
        <div className="flex items-center gap-3">
          <span>SOIL: <strong className="text-[var(--ink)]">{Math.round(farm.soil)}%</strong></span>
          <span>RAIN: <strong className={farm.rain ? "text-[var(--terra)]" : "text-[var(--moss)]"}>{farm.rain ? "DETECTED" : "NONE"}</strong></span>
          <span>LINK: <strong className={farm.stale ? "text-[var(--terra)]" : "text-[var(--moss)]"}>{farm.stale ? "STALE" : "LIVE"}</strong></span>
        </div>
        <div>
          THRESHOLDS: {farm.thresholds?.moistureLow ?? 30}% / {farm.thresholds?.moistureHigh ?? 75}%
        </div>
      </div>
    </div>
  );
}
