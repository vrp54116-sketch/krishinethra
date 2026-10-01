"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, Power, ScanLine, Timer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarm } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useMounted } from "@/components/dashboard/ui";

const QUICK_DURATIONS = [
  { label: "10S", sec: 10 },
  { label: "30S", sec: 30 },
  { label: "2M", sec: 120 },
  { label: "5M", sec: 300 },
];

/**
 * LiveFarmPill — signature floating pill for the farm.
 * Reskinned to M1 Field Editorial: sharp 0-radius bordered panel,
 * mono text, square toggles.
 */
export default function LiveFarmPill({ className }: { className?: string } = {}) {
  const t = useT();
  const router = useRouter();
  const mounted = useMounted();
  const [sheetOpen, setSheetOpen] = useState(false);

  const farm = useFarm();
  const running = farm.pump;
  const autoMode = farm.mode === "AUTO";
  const alerts = farm.alerts;
  const defaultDuration = farm.thresholds?.pumpDurationSec ?? 30;
  const setPumpManual = farm.setPumpManual;
  const setPumpMode = farm.setPumpMode;
  const hasCritical = alerts.some(
    (a) => !a.read && a.level === "critical",
  );

  const soilMoisture = mounted
    ? Math.round(farm.soil)
    : 45;
  const tempC = mounted ? Math.round(farm.temp) : 30;

  const liveText = `SOIL ${soilMoisture}% // PUMP ${running ? "ON" : "OFF"} // ${tempC}°C`;

  const togglePump = () => {
    if (running) setPumpManual(false);
    else setPumpManual(true, defaultDuration);
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-50 md:inset-x-auto md:bottom-6 md:right-6 md:w-[380px] font-editorial-mono",
          className,
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 pl-2.5 pr-2 rounded-none border transition-colors shadow-2xl select-none",
            running
              ? "border-[var(--terra)] bg-[var(--panel)] shadow-[0_0_16px_var(--terra-soft)]"
              : hasCritical
                ? "border-[var(--terra)] bg-[var(--panel)]"
                : "border-[var(--line)] bg-[var(--panel)]",
          )}
        >
          {/* Pill body — tap to expand quick controls */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="Open live farm controls"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-none text-left cursor-pointer"
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-none border transition-colors",
                running
                  ? "border-[var(--terra)] bg-[var(--terra)] text-white"
                  : hasCritical
                    ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]"
                    : "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-3)]",
              )}
            >
              <Droplets
                className={cn("h-3.5 w-3.5", running && "animate-pulse")}
              />
            </span>
            <span className="min-w-0 flex-1 truncate">
              <span className="block truncate text-[11px] font-bold uppercase tracking-wider text-[var(--ink)]">
                {liveText}
              </span>
              <span
                className={cn(
                  "block text-[9px] font-bold uppercase tracking-widest",
                  running
                    ? "text-[var(--terra)]"
                    : hasCritical
                      ? "text-[var(--terra)]"
                      : "text-[var(--ink-3)]",
                )}
              >
                {running
                  ? "PUMP ACTIVE"
                  : hasCritical
                    ? "CRITICAL ALERT ACTIVE"
                    : "PUMP IDLE"}
              </span>
            </span>
          </button>

          {/* Square action buttons */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePump();
            }}
            aria-label={running ? "Turn pump off" : "Turn pump on"}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-none border transition-colors cursor-pointer",
              running
                ? "border-[var(--terra)] bg-[var(--terra)] text-white"
                : "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink-3)]",
            )}
          >
            <Power className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push("/app/camera");
            }}
            aria-label={t("dashboard.scanLeaf")}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-none border border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink-3)] transition-colors cursor-pointer"
          >
            <ScanLine className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded quick controls modal */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center font-editorial-mono">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-none border border-[var(--line)] bg-[var(--panel)] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                  LIVE FARM CONTROL
                </h2>
                <p className="mt-0.5 text-[10px] text-[var(--ink-3)] uppercase tracking-wider">
                  {liveText}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex h-6 w-6 items-center justify-center border border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)] hover:text-[var(--ink)] rounded-none"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Pump run / stop */}
            <div className="mt-4 flex items-center justify-between gap-3 border border-[var(--line)] bg-[var(--panel-2)] p-3 rounded-none">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-none border",
                    running
                      ? "border-[var(--terra)] bg-[var(--terra)] text-white"
                      : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-3)]",
                  )}
                >
                  <Droplets className={cn("h-3.5 w-3.5", running && "animate-pulse")} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                  {running ? "PUMP IS RUNNING" : "PUMP IS IDLE"}
                </span>
              </div>
              <button
                type="button"
                onClick={togglePump}
                className={cn(
                  "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-none border transition-colors cursor-pointer",
                  running
                    ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]"
                    : "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]",
                )}
              >
                {running ? "STOP" : "START"}
              </button>
            </div>

            {/* Pump duration quick buttons */}
            <p className="mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-3)]">
              <Timer className="h-3 w-3 text-[var(--terra)]" />
              QUICK RUN TIMERS
            </p>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {QUICK_DURATIONS.map((d) => (
                <button
                  key={d.sec}
                  type="button"
                  onClick={() => {
                    setPumpManual(true, d.sec);
                    setSheetOpen(false);
                  }}
                  className="rounded-none border border-[var(--line)] bg-[var(--panel-2)] py-2 text-xs font-bold text-[var(--ink)] hover:border-[var(--terra)] hover:text-[var(--terra)] transition-colors cursor-pointer"
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Auto-mode toggle */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-none border border-[var(--line)] bg-[var(--panel-2)] p-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                  AUTO AI IRRIGATION
                </p>
                <p className="text-[10px] text-[var(--ink-3)]">
                  Autonomous sensor-driven threshold dispatch
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPumpMode(autoMode ? "manual" : "auto")}
                className={cn(
                  "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-none border transition-colors cursor-pointer",
                  autoMode
                    ? "border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)]"
                    : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-3)]",
                )}
              >
                {autoMode ? "ENABLED" : "DISABLED"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
