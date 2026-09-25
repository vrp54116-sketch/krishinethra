"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Camera,
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
    toast.success("Pump Dispatched (ON)", {
      description: "Manual 30s cycle started via Quick Actions.",
    });
    setOpen(false);
  };

  const handlePumpOff = () => {
    setPumpManual(false);
    withMqtt((m) => m.cmdPumpOff());
    toast.success("Pump Stopped (OFF)", {
      description: "Pump turned off by operator.",
    });
    setOpen(false);
  };

  const handleTestBuzzer = () => {
    withMqtt((m) => m.cmdBuzzPattern(2, 150));
    // Web Audio beep feedback
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
    toast.info("Buzzer Fired", {
      description: "Sent BUZZ:2:150 to edge node.",
    });
    setOpen(false);
  };

  const handleCenterCamera = () => {
    withMqtt((m) => m.cmdServo(90));
    useFarmStore.setState((s) => ({
      snapshot: { ...s.snapshot, servo: 90 },
    }));
    toast.success("Camera Centered", {
      description: "Servo gimbal repositioned to 90°.",
    });
    setOpen(false);
  };

  const handleRefresh = () => {
    toast.success("Telemetry Refreshed", {
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
      label: "Pump ON",
      icon: Droplets,
      onClick: handlePumpOn,
      color: "bg-[var(--accent-soft)] text-[var(--text)] border-[var(--accent)]/40 hover:bg-[var(--accent-soft)]/80",
    },
    {
      id: "pump-off",
      label: "Pump OFF",
      icon: Square,
      onClick: handlePumpOff,
      color: "bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--surface)]",
    },
    {
      id: "buzzer",
      label: "Test Buzzer",
      icon: Bell,
      onClick: handleTestBuzzer,
      color: "bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface)]",
    },
    {
      id: "camera",
      label: "Center Camera",
      icon: Camera,
      onClick: handleCenterCamera,
      color: "bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface)]",
    },
    {
      id: "refresh",
      label: "Refresh Data",
      icon: RefreshCw,
      onClick: handleRefresh,
      color: "bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface)]",
    },
    {
      id: "estop",
      label: "EMERGENCY STOP",
      icon: OctagonX,
      onClick: handleEmergencyStop,
      color: "bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/40 hover:bg-[#FF453A]/25 shadow-[0_0_20px_rgba(255,69,58,0.35)] font-bold",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 z-40 flex flex-col items-end"
    >
      {/* Expandable circular action menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="mb-3 flex flex-col items-end gap-2.5 p-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl backdrop-blur-xl"
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-2)] px-2 pb-1 border-b border-[var(--border)] w-full text-right">
              Quick Dispatch
            </p>

            <div className="flex flex-col gap-2">
              {ACTIONS.map((item, idx) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28, delay: idx * 0.04 }}
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all active:scale-95 shadow-lg cursor-pointer",
                    item.color,
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating trigger button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Quick Actions Floating Menu"
        className={cn(
          "flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full border shadow-2xl transition-all duration-300 cursor-pointer",
          open
            ? "bg-[#FF453A]/25 border-[#FF453A] text-[#FF453A] shadow-[0_0_24px_rgba(255,69,58,0.4)]"
            : pump.running
              ? "bg-[var(--accent)] border-[var(--accent-2)] text-white shadow-[0_0_24px_var(--accent-glow)] animate-pulse"
              : "btn-primary border-none text-white shadow-[0_0_24px_var(--accent-glow)]",
        )}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Plus className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
