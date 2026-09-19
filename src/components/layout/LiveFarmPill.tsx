"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Droplets, Power, ScanLine, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useMounted } from "@/components/dashboard/ui";
import { GlassSheet, GlassToggle } from "@/components/ui/glass";

const QUICK_DURATIONS = [
  { label: "10s", sec: 10 },
  { label: "30s", sec: 30 },
  { label: "2m", sec: 120 },
  { label: "5m", sec: 300 },
];

/**
 * LiveFarmPill — signature floating "Now Playing" pill for the farm.
 * Frosted glass pill fixed above the mobile tab bar / bottom-right on
 * desktop: live droplet + "Zone B 22% • Pump OFF • 32°C" + pump toggle
 * and leaf-scan shortcut. Tapping the body opens quick controls.
 */
export default function LiveFarmPill() {
  const t = useT();
  const router = useRouter();
  const mounted = useMounted();
  const [sheetOpen, setSheetOpen] = useState(false);

  const pump = useFarmStore((s) => s.pump);
  const snapshot = useFarmStore((s) => s.snapshot);
  const alerts = useFarmStore((s) => s.alerts);
  const defaultDuration = useFarmStore(
    (s) => s.settings.thresholds.pumpDurationSec,
  );
  const setPumpManual = useFarmStore((s) => s.setPumpManual);
  const setPumpMode = useFarmStore((s) => s.setPumpMode);

  const running = pump.running;
  const autoMode = pump.mode === "auto";
  const hasCritical = alerts.some(
    (a) => !a.read && a.level === "critical",
  );

  const zoneBMoisture = mounted
    ? Math.round(snapshot.soilMoistureB)
    : null;
  const tempC = mounted ? Math.round(snapshot.tempC) : 32;
  const tankPct = mounted ? Math.round(snapshot.tankLevelPercent) : 78;

  const liveText = mounted
    ? `Zone B ${zoneBMoisture ?? 22}% • Pump ${running ? "ON" : "OFF"} • ${tempC}°C`
    : "Zone B 22% • Pump OFF • 32°C";

  const togglePump = () => {
    if (running) setPumpManual(false);
    else setPumpManual(true, defaultDuration);
  };

  const glowStyle = running
    ? {
        borderColor: "rgba(52,211,153,0.65)",
        boxShadow:
          "0 0 24px rgba(16,185,129,0.45), 0 8px 32px rgba(0,0,0,0.55)",
      }
    : hasCritical
      ? {
          borderColor: "rgba(251,191,36,0.65)",
          boxShadow:
            "0 0 24px rgba(245,158,11,0.45), 0 8px 32px rgba(0,0,0,0.55)",
        }
      : {
          borderColor: "rgba(255,255,255,0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
        };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-40 md:inset-x-auto md:bottom-6 md:right-6 md:w-[390px]"
      >
        <div
          className="glass-strong flex items-center gap-2.5 py-2 pl-2.5 pr-2 rounded-full backdrop-blur-xl transition-all"
          style={glowStyle}
        >
          {/* Pill body — tap to expand quick controls */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="Open live farm controls"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full text-left cursor-pointer"
          >
            <span
              className={cn(
                "glass-pill flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all",
                running
                  ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.6)]"
                  : "border-white/10 bg-white/[0.05] text-zinc-400",
              )}
            >
              <Droplets
                className={cn("h-4 w-4", running && "animate-spin text-emerald-300")}
                style={running ? { animationDuration: "2.2s" } : undefined}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white">
                {liveText}
              </span>
              <span
                className={cn(
                  "block text-[10px] font-medium tracking-wide",
                  running ? "text-emerald-300" : "text-zinc-500",
                )}
              >
                {running
                  ? t("dashboard.pumping")
                  : t("dashboard.pumpIdle")}
              </span>
            </span>
          </button>

          {/* Round glass action buttons */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePump();
            }}
            aria-label={running ? "Turn pump off" : "Turn pump on"}
            className={cn(
              "glass-pill flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all active:scale-90 cursor-pointer",
              running
                ? "border-emerald-400/60 bg-emerald-500/25 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                : "border-white/10 bg-white/[0.05] text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-200",
            )}
          >
            <Power className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push("/camera");
            }}
            aria-label={t("dashboard.scanLeaf")}
            className="glass-pill flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 transition-all hover:border-emerald-500/40 hover:text-emerald-200 active:scale-90 cursor-pointer"
          >
            <ScanLine className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Expanded quick controls */}
      <GlassSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="pr-8">
          <h2 className="text-base font-bold text-white">
            Live Farm Control
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">{liveText}</p>
        </div>

        {/* Pump run / stop */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border",
                running
                  ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.5)]"
                  : "border-white/10 bg-white/[0.05] text-zinc-400",
              )}
            >
              <Droplets
                className={cn("h-4 w-4", running && "animate-spin")}
                style={running ? { animationDuration: "2.5s" } : undefined}
              />
            </span>
            <span className="text-sm font-semibold text-white">
              {running
                ? t("irrigation.running")
                : t("irrigation.idle")}
            </span>
          </div>
          <button
            type="button"
            onClick={togglePump}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95",
              running
                ? "bg-red-500/20 text-red-200 ring-1 ring-red-400/40"
                : "bg-emerald-500 text-black shadow-[0_0_18px_rgba(16,185,129,0.45)] hover:bg-emerald-400",
            )}
          >
            {running ? t("common.off") : t("common.on")}
          </button>
        </div>

        {/* Pump duration quick buttons */}
        <p className="mt-5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          <Timer className="h-3.5 w-3.5" />
          {t("irrigation.quickRun")}
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {QUICK_DURATIONS.map((d) => (
            <button
              key={d.sec}
              type="button"
              onClick={() => setPumpManual(true, d.sec)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-bold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-emerald-200 active:scale-95"
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Auto-mode toggle */}
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
          <div>
            <p className="text-sm font-semibold text-white">
              {t("irrigation.autoAI")}
            </p>
            <p className="text-[11px] text-zinc-500">
              {t("irrigation.aiReasoning")}
            </p>
          </div>
          <GlassToggle
            checked={autoMode}
            onChange={(next) => setPumpMode(next ? "auto" : "manual")}
            label={autoMode ? t("common.on") : t("common.off")}
          />
        </div>

        {/* Tank level mini bar */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300">
              {t("dashboard.tankLevel")}
            </span>
            <span className="font-bold text-white">
              {tankPct == null ? "–" : `${tankPct}%`}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                (tankPct ?? 100) < 20
                  ? "bg-red-400"
                  : (tankPct ?? 100) < 40
                    ? "bg-amber-400"
                    : "bg-emerald-400",
              )}
              style={{ width: `${Math.max(0, Math.min(100, tankPct ?? 0))}%` }}
            />
          </div>
        </div>
      </GlassSheet>
    </>
  );
}
