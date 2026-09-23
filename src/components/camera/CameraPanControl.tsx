"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Compass, MoveHorizontal, Pause, Play, RotateCcw, Sliders, Video } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { cmdServo, cmdSweep } from "@/lib/mqtt-bridge";
import { LiquidButton, LiquidToggle } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "Center (90°)", angle: 90 },
  { label: "Left 30° (60°)", angle: 60 },
  { label: "Right 30° (120°)", angle: 120 },
  { label: "Wide Left (30°)", angle: 30 },
  { label: "Wide Right (150°)", angle: 150 },
];

export default function CameraPanControl({ className }: { className?: string }) {
  const snapshot = useFarmStore((s) => s.snapshot);
  const currentTelemetryAngle = snapshot.servo ?? 90;

  const [angle, setAngle] = useState<number>(currentTelemetryAngle);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>("Center (90°)");

  // Sync with telemetry if not user dragging
  useEffect(() => {
    if (!isSweeping && snapshot.servo != null) {
      setAngle(snapshot.servo);
    }
  }, [snapshot.servo, isSweeping]);

  // Sweep simulation if simulator mode or edge responds
  useEffect(() => {
    if (!isSweeping) return;
    let current = angle;
    let forward = true;
    const interval = setInterval(() => {
      if (forward) {
        current += 5;
        if (current >= 170) forward = false;
      } else {
        current -= 5;
        if (current <= 10) forward = true;
      }
      setAngle(current);
      useFarmStore.setState((s) => ({
        snapshot: { ...s.snapshot, servo: current },
      }));
    }, 150);

    return () => clearInterval(interval);
  }, [isSweeping, angle]);

  const handleSliderChange = (newAngle: number) => {
    if (isSweeping) setIsSweeping(false);
    setAngle(newAngle);
    setActivePreset("");
    cmdServo(newAngle);
    useFarmStore.setState((s) => ({
      snapshot: { ...s.snapshot, servo: newAngle },
    }));
  };

  const handleCenter = () => {
    if (isSweeping) setIsSweeping(false);
    setAngle(90);
    setActivePreset("Center (90°)");
    cmdServo(90);
    useFarmStore.setState((s) => ({
      snapshot: { ...s.snapshot, servo: 90 },
    }));
  };

  const handleStop = () => {
    setIsSweeping(false);
    cmdServo(angle);
  };

  const handleToggleSweep = (enable: boolean) => {
    setIsSweeping(enable);
    if (enable) {
      cmdSweep();
    } else {
      cmdServo(angle);
    }
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    if (isSweeping) setIsSweeping(false);
    setAngle(preset.angle);
    setActivePreset(preset.label);
    cmdServo(preset.angle);
    useFarmStore.setState((s) => ({
      snapshot: { ...s.snapshot, servo: preset.angle },
    }));
  };

  return (
    <div
      className={cn(
        "liquid-glass-card rounded-3xl p-5 md:p-6 transition-all duration-300 space-y-5",
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-400/25">
            <Camera className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Camera Pan Control
            </h3>
            <p className="text-[11px] text-zinc-400">
              SG90 Servo gimbal on Arduino UNO D9 PWM
            </p>
          </div>
        </div>

        {/* Live Angle Indicator Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-purple-300 border border-purple-400/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
            <Compass className="h-3.5 w-3.5 text-purple-400" />
            Angle: {angle}°
          </span>
          {isSweeping && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-pulse">
              Sweeping
            </span>
          )}
        </div>
      </div>

      {/* Visual Gimbal Dial Arc */}
      <div className="relative flex flex-col items-center justify-center py-2">
        <div className="relative h-24 w-48 overflow-hidden">
          {/* Semicircle Track */}
          <div className="absolute inset-0 rounded-t-full border-4 border-dashed border-white/15 border-b-0" />
          <div
            className="absolute inset-0 rounded-t-full border-4 border-purple-500/60 border-b-0"
            style={{
              clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
              opacity: 0.8,
            }}
          />

          {/* Needle / Pointer */}
          <motion.div
            className="absolute bottom-0 left-1/2 h-20 w-1 bg-gradient-to-t from-purple-500 to-sky-400 origin-bottom rounded-full shadow-[0_0_10px_#a855f7]"
            style={{ transformOrigin: "bottom center" }}
            animate={{ rotate: angle - 90 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />

          {/* Center Hub */}
          <div className="absolute bottom-0 left-1/2 h-5 w-5 -translate-x-1/2 translate-y-1/2 rounded-full bg-purple-400 border-2 border-white shadow-[0_0_12px_#a855f7]" />
        </div>

        <div className="flex w-52 justify-between text-[10px] font-mono text-zinc-400 mt-2">
          <span>0° (Left)</span>
          <span>90° (Center)</span>
          <span>180° (Right)</span>
        </div>
      </div>

      {/* Manual Pan Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <MoveHorizontal className="h-3.5 w-3.5 text-zinc-400" />
            Pan Angle (0° to 180°)
          </span>
          <span className="font-mono text-purple-300 font-bold">{angle}°</span>
        </div>

        <input
          type="range"
          min={0}
          max={180}
          step={1}
          value={angle}
          onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
          className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-white/10 accent-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
        />
      </div>

      {/* Presets Grid */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-zinc-400">Camera Presets</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border text-center truncate",
                activePreset === p.label && angle === p.angle
                  ? "bg-purple-500/25 border-purple-400/50 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                  : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:border-white/20",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls: Auto Sweep Toggle, Center Button, Stop Button */}
      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        {/* Auto Sweep Toggle */}
        <div className="flex items-center gap-3">
          <LiquidToggle
            checked={isSweeping}
            onChange={handleToggleSweep}
            label={isSweeping ? "Sweeping" : "Auto Sweep"}
          />
          <span className="text-xs text-zinc-400 hidden sm:inline">
            Continuous 10°-170° sweep
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <LiquidButton
            icon={RotateCcw}
            label="Center (90°)"
            onClick={handleCenter}
            className="text-xs"
            variant="glass"
          />

          <button
            onClick={handleStop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 transition-all active:scale-95"
          >
            <Pause className="h-3.5 w-3.5" />
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}
