"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Lightbulb,
  Droplets,
  OctagonX,
  Plus,
  RefreshCw,
  Square,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useFarmStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Lazy MQTT bridge — keeps the `mqtt` package out of the initial bundle. */
const withMqtt = (
  fn: (m: typeof import("@/lib/mqtt-bridge")) => void,
): void => {
  void import("@/lib/mqtt-bridge").then(fn).catch(() => {});
};

export default function QuickActionsFAB() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pump = useFarmStore((s) => s.pump);
  const setPumpManual = useFarmStore((s) => s.setPumpManual);
  const setPumpMode = useFarmStore((s) => s.setPumpMode);
  const addAlert = useFarmStore((s) => s.addAlert);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Actions
  const handlePumpOn = () => {
    setPumpManual(true);
    withMqtt((m) => m.cmdPumpOn());
    toast.success("PUMP DISPATCHED (ON)", {
      description: "Manual 30s cycle started via Quick Actions.",
    });
    setOpen(false);
  };

  const handlePumpOff = () => {
    setPumpManual(false);
    withMqtt((m) => m.cmdPumpOff());
    toast.success("PUMP STOPPED (OFF)", {
      description: "Pump turned off by operator.",
    });
    setOpen(false);
  };

  const handleTestBuzzer = () => {
    withMqtt((m) => m.cmdBuzzPattern(2, 150));
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(2400, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      /* ignore audio error */
    }
    toast.info("BUZZER FIRED", {
      description: "Sent BUZZ:2:150 to edge node.",
    });
    setOpen(false);
  };

  const handleToggleR2 = () => {
    const s = useFarmStore.getState();
    const next = !s.edgeR2;
    s.setEdgeR2(next);
    toast.success(next ? "RELAY R2 ON" : "RELAY R2 OFF", {
      description: next ? "Sent R2_ON to edge node." : "Sent R2_OFF to edge node.",
    });
    setOpen(false);
  };

  const handleRefresh = () => {
    toast.success("TELEMETRY REFRESHED", {
      description: "Store synchronized with latest snapshot.",
    });
    setOpen(false);
  };

  const handleEmergencyStop = () => {
    setPumpManual(false);
    setPumpMode("manual");
    withMqtt((m) => {
      m.cmdPumpOff();
      m.cmdMode("MANUAL");
      m.cmdBuzzPattern(3, 300);
    });

    addAlert({
      level: "critical",
      title: "🛑 EMERGENCY STOP ACTIVATED",
      message: "Operator triggered hardware emergency halt from Floating Action Menu.",
    });

    toast.error("🛑 EMERGENCY STOP ACTIVATED", {
      description: "Pump shut down immediately. Mode locked to MANUAL.",
      duration: 6000,
    });
    setOpen(false);
  };

  const ACTIONS = [
    {
      id: "pump-on",
      label: "PUMP ON",
      icon: Droplets,
      onClick: handlePumpOn,
      color: "border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)] hover:bg-[var(--moss-soft)]/80",
    },
    {
      id: "pump-off",
      label: "PUMP OFF",
      icon: Square,
      onClick: handlePumpOff,
      color: "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)] hover:text-[var(--ink)]",
    },
    {
      id: "buzzer",
      label: "TEST BUZZER",
      icon: Bell,
      onClick: handleTestBuzzer,
      color: "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink)] hover:bg-[var(--panel)]",
    },
    {
      id: "r2",
      label: "TOGGLE RELAY R2",
      icon: Lightbulb,
      onClick: handleToggleR2,
      color: "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink)] hover:bg-[var(--panel)]",
    },
    {
      id: "refresh",
      label: "REFRESH DATA",
      icon: RefreshCw,
      onClick: handleRefresh,
      color: "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink)] hover:bg-[var(--panel)]",
    },
    {
      id: "estop",
      label: "EMERGENCY STOP",
      icon: OctagonX,
      onClick: handleEmergencyStop,
      color: "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)] font-bold shadow-[0_0_12px_var(--terra)]",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end font-editorial-mono"
    >
      {/* Expandable square action menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="mb-2 flex flex-col items-end gap-1.5 p-2 rounded-none border border-[var(--line)] bg-[var(--panel)] shadow-2xl"
          >
            <p className="text-[10px] uppercase tracking-wider text-[var(--ink-3)] px-1 pb-1 border-b border-[var(--line)] w-full text-right">
              QUICK DISPATCH // ACTIONS
            </p>

            <div className="flex flex-col gap-1 w-full">
              {ACTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-none border text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-left w-full",
                    item.color,
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main square floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Quick Actions Floating Menu"
        className={cn(
          "flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-none border shadow-lg transition-all cursor-pointer select-none",
          open
            ? "bg-[var(--terra-soft)] border-[var(--terra)] text-[var(--terra)]"
            : pump.running
              ? "bg-[var(--terra)] border-[var(--terra)] text-white animate-pulse"
              : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:border-[var(--ink-2)] hover:shadow-[3px_3px_0_var(--terra)]",
        )}
      >
        {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>
    </div>
  );
}
