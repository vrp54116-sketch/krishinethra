"use client";

import { memo, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, ShieldAlert, CloudRain, CheckCircle2, AlertTriangle } from "lucide-react";
import { useFarm, useFarmStore } from "@/lib/store";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ReasoningState {
  id: string;
  type: "on" | "off" | "rain_lock" | "stale_lock" | "manual_hold";
  headline: string;
  rule: string;
}

export default memo(function AiAgentReasoning({ className }: { className?: string }) {
  const farm = useFarm();
  const { t } = useLang();
  const reasoningLogs = useFarmStore((s) => s.reasoningLogs) ?? [];
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
        headline: t("reasoning_stale_headline"),
        rule: t("reasoning_stale_rule"),
      };
    }

    if (rain) {
      return {
        id: `rain-${rain}-${isRunning}`,
        type: "rain_lock",
        headline: t("reasoning_rain_headline"),
        rule: t("reasoning_rain_rule"),
      };
    }

    if (isAuto) {
      if (isRunning) {
        return {
          id: `on-${soil}`,
          type: "on",
          headline: t("reasoning_on_headline", { soil, low: lowThresh }),
          rule: t("reasoning_on_rule", { high: highThresh }),
        };
      } else {
        if (soil >= highThresh) {
          return {
            id: `off-high-${soil}`,
            type: "off",
            headline: t("reasoning_off_high_headline", { soil, high: highThresh }),
            rule: t("reasoning_off_high_rule"),
          };
        } else {
          return {
            id: `off-normal-${soil}`,
            type: "off",
            headline: t("reasoning_off_normal_headline", { soil, low: lowThresh, high: highThresh }),
            rule: t("reasoning_off_normal_rule"),
          };
        }
      }
    } else {
      // Manual mode
      if (isRunning) {
        return {
          id: `manual-on-${soil}`,
          type: "on",
          headline: t("reasoning_manual_on_headline"),
          rule: t("reasoning_manual_on_rule", { remaining: manualRemaining != null ? Math.ceil(manualRemaining) : 0 }),
        };
      } else {
        return {
          id: `manual-off-${soil}`,
          type: "manual_hold",
          headline: t("reasoning_manual_off_headline"),
          rule: t("reasoning_manual_off_rule"),
        };
      }
    }
  }, [
    farm.soil,
    farm.rain,
    farm.stale,
    farm.mode,
    farm.pump,
    manualRemaining,
    farm.thresholds?.moistureLow,
    farm.thresholds?.moistureHigh,
    t,
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
        "relative rounded-[12px] border border-[var(--line)] bg-[var(--panel)] p-6 font-editorial-mono transition-all",
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
              {t("reasoning_title")}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="px-1.5 py-0.5 border border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)] font-bold text-[10px] uppercase tracking-wider">
              {t("reasoning_locked")}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 border border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)] font-bold text-[10px] uppercase tracking-wider">
              {farm.mode === "AUTO" ? t("reasoning_autonomous") : t("reasoning_manual")}
            </span>
          )}
          <span className="text-[10px] text-[var(--ink-3)] font-mono">
            [{nowStamp}]
          </span>
        </div>
      </div>

      {/* Reasoning Display as Mono Log Lines with Timestamps */}
      <div className="mt-3 space-y-2 min-h-[56px] flex flex-col justify-center text-xs">
        <div className="flex items-start gap-2">
          <span className="text-[var(--ink-3)] shrink-0 font-mono">[{nowStamp}]</span>
          {isLocked && (
            <span className="shrink-0 px-1 py-0.2 border border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)] font-bold text-[9px] uppercase">
              {t("reasoning_locked")}
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

        {/* Dynamic Appended Reasoning Logs (e.g. LEAF SCAN) */}
        {reasoningLogs.slice(0, 5).map((log, idx) => (
          <div key={idx} className="flex items-start gap-2 border-t border-[var(--line)]/40 pt-1.5 text-[11px] text-[var(--ink)] font-mono">
            <span className="text-[var(--moss)] shrink-0">●</span>
            <span className="break-all">{log}</span>
          </div>
        ))}
      </div>

      {/* Footer live status bar */}
      <div className="mt-3 pt-2 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--ink-3)]">
        <div className="flex items-center gap-3">
          <span>{t("reasoning_soil_label")} <strong className="text-[var(--ink)]">{Math.round(farm.soil)}%</strong></span>
          <span>{t("reasoning_rain_label")} <strong className={farm.rain ? "text-[var(--terra)]" : "text-[var(--moss)]"}>{farm.rain ? t("reasoning_detected") : t("reasoning_none")}</strong></span>
          <span>{t("reasoning_link_label")} <strong className={farm.stale ? "text-[var(--terra)]" : "text-[var(--moss)]"}>{farm.stale ? t("reasoning_stale") : t("reasoning_live")}</strong></span>
        </div>
        <div>
          {t("reasoning_thresholds")} {farm.thresholds?.moistureLow ?? 30}% / {farm.thresholds?.moistureHigh ?? 75}%
        </div>
      </div>
    </div>
  );
});
