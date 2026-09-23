"use client";

import { useState } from "react";
import { Bell, Volume2, VolumeX, Sparkles, AlertCircle, AlertTriangle, Info, Play } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { cmdBuzzPattern } from "@/lib/mqtt-bridge";
import { LiquidButton, LiquidToggle } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

// Web Audio sound synthesizer for buzzer feedback
function playBuzzerAudio(beeps: number, durationMs: number) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    for (let i = 0; i < beeps; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square"; // Piezo buzzer tone
      osc.frequency.setValueAtTime(2400, ctx.currentTime + (i * (durationMs + 100)) / 1000); // 2.4kHz standard buzzer freq

      gain.gain.setValueAtTime(0.15, ctx.currentTime + (i * (durationMs + 100)) / 1000);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + (i * (durationMs + 100) + durationMs) / 1000,
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + (i * (durationMs + 100)) / 1000);
      osc.stop(ctx.currentTime + (i * (durationMs + 100) + durationMs) / 1000);
    }
  } catch {
    /* audio context suppressed by browser policy until interaction */
  }
}

export default function BuzzerPatternTester({ className }: { className?: string }) {
  const muteBuzzer = useFarmStore((s) => s.settings.muteBuzzer ?? false);
  const updateSettings = useFarmStore((s) => s.updateSettings);

  const [activeRipple, setActiveRipple] = useState<string | null>(null);
  const [customBeeps, setCustomBeeps] = useState(4);
  const [customMs, setCustomMs] = useState(200);

  const handleTest = (beeps: number, ms: number, id: string) => {
    setActiveRipple(id);
    setTimeout(() => setActiveRipple(null), 600);

    if (!muteBuzzer) {
      playBuzzerAudio(beeps, ms);
      cmdBuzzPattern(beeps, ms);
    }
  };

  const handleToggleMute = (muted: boolean) => {
    updateSettings({ muteBuzzer: muted });
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
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-400/25">
            <Bell className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Test Alert Sounds
            </h3>
            <p className="text-[11px] text-zinc-400">
              Active piezo buzzer patterns on Arduino UNO D8
            </p>
          </div>
        </div>

        {/* Mute All Toggle */}
        <div className="flex items-center gap-2">
          <LiquidToggle
            checked={muteBuzzer}
            onChange={handleToggleMute}
            label={muteBuzzer ? "Muted" : "Sound ON"}
          />
        </div>
      </div>

      {/* Preset Sound Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1 Beep - Info */}
        <button
          type="button"
          onClick={() => handleTest(1, 100, "info")}
          disabled={muteBuzzer}
          className={cn(
            "relative overflow-hidden p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 group",
            activeRipple === "info"
              ? "bg-sky-500/25 border-sky-400 scale-[0.98] shadow-[0_0_20px_rgba(14,165,233,0.3)]"
              : "bg-white/[0.03] border-white/10 hover:border-sky-400/30 hover:bg-sky-500/[0.05]",
            muteBuzzer && "opacity-50 cursor-not-allowed",
          )}
        >
          {activeRipple === "info" && (
            <span className="absolute inset-0 bg-sky-400/20 animate-ping rounded-2xl pointer-events-none" />
          )}
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30">
              <Info className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-mono text-zinc-400">1x 100ms</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
              1 Beep — Info
            </h4>
            <p className="text-[11px] text-zinc-400">Normal status & check-ins</p>
          </div>
        </button>

        {/* 2 Beeps - Warning */}
        <button
          type="button"
          onClick={() => handleTest(2, 150, "warn")}
          disabled={muteBuzzer}
          className={cn(
            "relative overflow-hidden p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 group",
            activeRipple === "warn"
              ? "bg-amber-500/25 border-amber-400 scale-[0.98] shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              : "bg-white/[0.03] border-white/10 hover:border-amber-400/30 hover:bg-amber-500/[0.05]",
            muteBuzzer && "opacity-50 cursor-not-allowed",
          )}
        >
          {activeRipple === "warn" && (
            <span className="absolute inset-0 bg-amber-400/20 animate-ping rounded-2xl pointer-events-none" />
          )}
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-mono text-zinc-400">2x 150ms</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              2 Beeps — Warning
            </h4>
            <p className="text-[11px] text-zinc-400">Dry soil & high temperature</p>
          </div>
        </button>

        {/* 3 Beeps - Critical */}
        <button
          type="button"
          onClick={() => handleTest(3, 250, "crit")}
          disabled={muteBuzzer}
          className={cn(
            "relative overflow-hidden p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 group",
            activeRipple === "crit"
              ? "bg-rose-500/25 border-rose-400 scale-[0.98] shadow-[0_0_20px_rgba(244,63,94,0.3)]"
              : "bg-white/[0.03] border-white/10 hover:border-rose-400/30 hover:bg-rose-500/[0.05]",
            muteBuzzer && "opacity-50 cursor-not-allowed",
          )}
        >
          {activeRipple === "crit" && (
            <span className="absolute inset-0 bg-rose-400/20 animate-ping rounded-2xl pointer-events-none" />
          )}
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30">
              <AlertCircle className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-mono text-zinc-400">3x 250ms</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
              3 Beeps — Critical
            </h4>
            <p className="text-[11px] text-zinc-400">Reservoir low / node stale</p>
          </div>
        </button>
      </div>

      {/* Custom Beep Pattern */}
      <div className="liquid-glass-pill rounded-2xl p-4 border border-white/10 bg-white/[0.02] space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Custom Pattern (`BUZZ:n:ms`)
          </span>
          {muteBuzzer && (
            <span className="text-[10px] text-rose-400 font-mono">Buzzer is Muted</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Beep Count (1 - 10)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={customBeeps}
              onChange={(e) => setCustomBeeps(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              disabled={muteBuzzer}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white font-mono focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">
              Duration per beep (ms)
            </label>
            <input
              type="number"
              min={20}
              max={1000}
              step={20}
              value={customMs}
              onChange={(e) => setCustomMs(Math.min(1000, Math.max(20, parseInt(e.target.value) || 100)))}
              disabled={muteBuzzer}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white font-mono focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => handleTest(customBeeps, customMs, "custom")}
              disabled={muteBuzzer}
              className={cn(
                "w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                muteBuzzer
                  ? "opacity-50 cursor-not-allowed bg-white/5 border border-white/10 text-zinc-500"
                  : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] active:scale-95",
              )}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Test Pattern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
