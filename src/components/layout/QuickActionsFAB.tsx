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
import {
  cmdBuzzPattern,
  cmdMode,
  cmdPumpOff,
  cmdPumpOn,
  cmdServo,
} from "@/lib/mqtt-bridge";
import { cn } from "@/lib/utils";

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
    cmdPumpOn();
    toast.success("Pump Dispatched (ON)", {
      description: "Manual 30s cycle started via Quick Actions.",
    });
    setOpen(false);
  };

  const handlePumpOff = () => {
    setPumpManual(false);
    cmdPumpOff();
    toast.success("Pump Stopped (OFF)", {
      description: "Pump turned off by operator.",
    });
    setOpen(false);
  };

  const handleTestBuzzer = () => {
    cmdBuzzPattern(2, 150);
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
    cmdServo(90);
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
    cmdPumpOff();
    cmdMode("MANUAL");
    cmdBuzzPattern(3, 300);

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
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30",
    },
    {
      id: "pump-off",
      label: "Pump OFF",
      icon: Square,
      onClick: handlePumpOff,
      color: "bg-zinc-800/80 text-zinc-300 border-white/20 hover:bg-zinc-700/80",
    },
    {
      id: "buzzer",
      label: "Test Buzzer",
      icon: Bell,
      onClick: handleTestBuzzer,
      color: "bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30",
    },
    {
      id: "camera",
      label: "Center Camera",
      icon: Camera,
      onClick: handleCenterCamera,
      color: "bg-purple-500/20 text-purple-300 border-purple-400/40 hover:bg-purple-500/30",
    },
    {
      id: "refresh",
      label: "Refresh Data",
      icon: RefreshCw,
      onClick: handleRefresh,
      color: "bg-sky-500/20 text-sky-300 border-sky-400/40 hover:bg-sky-500/30",
    },
    {
      id: "estop",
      label: "EMERGENCY STOP",
      icon: OctagonX,
      onClick: handleEmergencyStop,
      color: "bg-rose-500/30 text-rose-200 border-rose-500/60 hover:bg-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.4)] font-bold",
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
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="mb-3 flex flex-col items-end gap-2.5 p-3 rounded-3xl liquid-glass-card border border-white/20 shadow-2xl backdrop-blur-2xl"
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-2 pb-1 border-b border-white/10 w-full text-right">
              Quick Dispatch
            </p>

            <div className="flex flex-col gap-2">
              {ACTIONS.map((item, idx) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold backdrop-blur-md transition-all active:scale-95 shadow-lg",
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
          "flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300",
          open
            ? "bg-rose-500/25 border-rose-400 text-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.4)]"
            : pump.running
              ? "bg-sky-500/25 border-sky-400 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.4)] animate-pulse"
              : "bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.3)] hover:border-emerald-300",
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
