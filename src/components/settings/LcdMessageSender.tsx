"use client";

import { useState } from "react";
import { Monitor, Send, Sparkles, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useFarmStore } from "@/lib/store";
import { cmdLcd } from "@/lib/mqtt-bridge";
import { LiquidButton } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

export default function LcdMessageSender({ className }: { className?: string }) {
  const snapshot = useFarmStore((s) => s.snapshot);

  const [line1, setLine1] = useState("KrishiNethra AI");
  const [line2, setLine2] = useState("System Ready");
  const [lastSent, setLastSent] = useState<string | null>(null);

  const isLine1Overflow = line1.length > 16;
  const isLine2Overflow = line2.length > 16;
  const hasOverflow = isLine1Overflow || isLine2Overflow;

  const handleSend = () => {
    if (hasOverflow) {
      toast.error("Character Limit Exceeded", {
        description: "Lines must be at most 16 characters for the 16x2 LCD display.",
      });
      return;
    }
    cmdLcd(line1, line2);
    setLastSent(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    toast.success("Sent to Physical LCD", {
      description: `L1: "${line1}" | L2: "${line2}"`,
    });
  };

  const applyPreset = (presetL1: string, presetL2: string) => {
    setLine1(presetL1);
    setLine2(presetL2);
  };

  // Helper to format simulated 16x2 LCD row
  const formatLcdRow = (text: string) => {
    return text.padEnd(16, " ").slice(0, 16);
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
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/25">
            <Monitor className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Physical LCD Display
            </h3>
            <p className="text-[11px] text-zinc-400">
              1602 I2C Character Display on Arduino UNO
            </p>
          </div>
        </div>

        {lastSent && (
          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Last sent: {lastSent}
          </span>
        )}
      </div>

      {/* Simulated 16x2 Physical LCD Screen */}
      <div className="relative mx-auto w-full max-w-md rounded-2xl border-4 border-zinc-800 bg-[#07130f] p-4 shadow-[inset_0_0_24px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.15)]">
        {/* LCD Glass Screen Background */}
        <div className="rounded-lg bg-[#0d2a1f] p-3.5 border border-emerald-500/30 font-mono tracking-widest text-[#4ade80] shadow-[inset_0_0_12px_rgba(0,0,0,0.6)]">
          {/* Row 1 */}
          <div className="flex items-center justify-between text-sm sm:text-base font-bold select-none h-6">
            <span>{formatLcdRow(line1)}</span>
            <span className="text-[9px] text-[#4ade80]/40 font-mono">1</span>
          </div>
          {/* Row 2 */}
          <div className="flex items-center justify-between text-sm sm:text-base font-bold select-none h-6 mt-1">
            <span>{formatLcdRow(line2)}</span>
            <span className="text-[9px] text-[#4ade80]/40 font-mono">2</span>
          </div>
        </div>

        {/* LCD Panel Bezel Labels */}
        <div className="mt-2 flex items-center justify-between text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
          <span>16x2 Dot Matrix</span>
          <span>HD44780 I2C 0x27</span>
        </div>
      </div>

      {/* Inputs for Line 1 & Line 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Line 1 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-zinc-300">Line 1 Text</label>
            <span
              className={cn(
                "font-mono text-[11px]",
                isLine1Overflow ? "text-rose-400 font-bold" : "text-zinc-500",
              )}
            >
              {line1.length}/16
            </span>
          </div>
          <input
            type="text"
            value={line1}
            maxLength={24}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="Max 16 characters"
            className={cn(
              "w-full rounded-xl border bg-black/40 px-3.5 py-2 text-sm text-white font-mono transition-all focus:outline-none",
              isLine1Overflow
                ? "border-rose-500 focus:ring-2 focus:ring-rose-500/40 bg-rose-500/[0.05]"
                : "border-white/10 focus:border-cyan-400/50",
            )}
          />
          {isLine1Overflow && (
            <p className="text-[10px] text-rose-400 font-mono">
              Overflow: will be truncated to 16 characters.
            </p>
          )}
        </div>

        {/* Line 2 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-zinc-300">Line 2 Text</label>
            <span
              className={cn(
                "font-mono text-[11px]",
                isLine2Overflow ? "text-rose-400 font-bold" : "text-zinc-500",
              )}
            >
              {line2.length}/16
            </span>
          </div>
          <input
            type="text"
            value={line2}
            maxLength={24}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="Max 16 characters"
            className={cn(
              "w-full rounded-xl border bg-black/40 px-3.5 py-2 text-sm text-white font-mono transition-all focus:outline-none",
              isLine2Overflow
                ? "border-rose-500 focus:ring-2 focus:ring-rose-500/40 bg-rose-500/[0.05]"
                : "border-white/10 focus:border-cyan-400/50",
            )}
          />
          {isLine2Overflow && (
            <p className="text-[10px] text-rose-400 font-mono">
              Overflow: will be truncated to 16 characters.
            </p>
          )}
        </div>
      </div>

      {/* Presets Row */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-zinc-400">Quick Presets</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              applyPreset(
                "Soil Moisture",
                `Level: ${Math.round(snapshot.soil ?? 45)}% ${snapshot.soil < 30 ? "DRY" : "OK"}`,
              )
            }
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/10 text-zinc-300 hover:text-white hover:border-cyan-400/30 transition-all"
          >
            [Show Soil%]
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset(
                "Climate DHT22",
                `${Math.round(snapshot.temp ?? 30)}C  Hum: ${Math.round(snapshot.hum ?? 60)}%`,
              )
            }
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/10 text-zinc-300 hover:text-white hover:border-cyan-400/30 transition-all"
          >
            [Show Temp]
          </button>
          <button
            type="button"
            onClick={() => applyPreset("KrishiNethra V2", "System Online")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/10 text-zinc-300 hover:text-white hover:border-cyan-400/30 transition-all"
          >
            [Show Status]
          </button>
          <button
            type="button"
            onClick={() => applyPreset("ESP32 Edge Node", "192.168.1.105")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/10 text-zinc-300 hover:text-white hover:border-cyan-400/30 transition-all"
          >
            [Show IP]
          </button>
          <button
            type="button"
            onClick={() => applyPreset("", "")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/10 text-rose-300 hover:text-rose-200 hover:border-rose-400/30 transition-all flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            [Clear]
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-white/10 flex justify-end">
        <LiquidButton
          icon={Send}
          label="Send to Physical LCD"
          onClick={handleSend}
          disabled={hasOverflow}
          className="w-full sm:w-auto text-xs"
        />
      </div>
    </div>
  );
}
