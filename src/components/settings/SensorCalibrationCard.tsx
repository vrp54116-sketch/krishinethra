"use client";

import { Sliders, Wrench, Droplets, Wind, CheckCircle2, BookOpen, Code2 } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { LiquidToggle } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

export default function SensorCalibrationCard({ className }: { className?: string }) {
  const snapshot = useFarmStore((s) => s.snapshot);
  const settings = useFarmStore((s) => s.settings);
  const updateSettings = useFarmStore((s) => s.updateSettings);

  const showRaw = settings.showRawCalibrationValues ?? false;
  const soilRaw = snapshot.soilRaw ?? (snapshot.soil ? Math.round(1023 - (snapshot.soil * 6.5)) : 540);
  const mqRaw = snapshot.mqRaw ?? 230;

  const handleToggleRaw = (val: boolean) => {
    updateSettings({ showRawCalibrationValues: val });
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
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-400/25">
            <Wrench className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white/90">
              Sensor Calibration Mode
            </h3>
            <p className="text-[11px] text-zinc-400">
              Raw 10-bit ADC tuning & two-point baseline adjustment
            </p>
          </div>
        </div>

        {/* Toggle Show Raw Values */}
        <div className="flex items-center gap-2">
          <LiquidToggle
            checked={showRaw}
            onChange={handleToggleRaw}
            label={showRaw ? "Raw Values Visible" : "Standard (%)"}
          />
        </div>
      </div>

      {/* Live Raw Values Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Soil Moisture Raw */}
        <div className="liquid-glass-pill rounded-2xl p-4 border border-white/10 bg-white/[0.03] space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-white">
              <Droplets className="h-4 w-4 text-emerald-400" />
              Soil Sensor (A0)
            </span>
            <span className="text-[11px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-400/30">
              Raw ADC: {soilRaw}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Calibrate: Dry air (~920) → Water cup (~380)
          </p>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, (soilRaw / 1023) * 100))}%` }}
            />
          </div>
        </div>

        {/* MQ-135 Raw */}
        <div className="liquid-glass-pill rounded-2xl p-4 border border-white/10 bg-white/[0.03] space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-white">
              <Wind className="h-4 w-4 text-purple-400" />
              MQ-135 Gas Sensor (A1)
            </span>
            <span className="text-[11px] font-mono text-purple-300 font-bold bg-purple-500/20 px-2.5 py-0.5 rounded-lg border border-purple-400/30">
              Raw ADC: {mqRaw}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Calibrate: Clean air (~180-240) → Fumes (~600+)
          </p>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, (mqRaw / 1023) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step-by-Step Calibration Instructions Card */}
      <div className="liquid-glass-pill rounded-2xl p-4 border border-white/10 bg-white/[0.02] space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
          <BookOpen className="h-4 w-4 text-sky-400" />
          <span>Hardware Calibration Procedures (Arduino UNO & ESP32)</span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Step 1: Soil */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <span className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">1</span>
              Soil Moisture 2-Point Calibration:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px] leading-relaxed pl-1 font-mono">
              <li>Leave probe suspended in open dry air: record <code>RAW_DRY</code> (e.g. 910).</li>
              <li>Immerse probe into a glass of clean water up to PCB line: record <code>RAW_WET</code> (e.g. 390).</li>
              <li>
                In <code>krishinethra_uno.ino</code>, update:
                <code className="block mt-1 p-2 rounded-lg bg-black/50 text-emerald-300 border border-white/10">
                  int soilPct = constrain(map(rawA0, 910, 390, 0, 100), 0, 100);
                </code>
              </li>
            </ol>
          </div>

          {/* Step 2: MQ-135 */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <p className="font-semibold text-purple-300 flex items-center gap-1.5">
              <span className="h-4 w-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">2</span>
              MQ-135 Clean Air Baseline (Ro) Tuning:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px] leading-relaxed pl-1 font-mono">
              <li>Preheat heater element for at least 24h prior to final baseline lock.</li>
              <li>Place in clean outdoor environment and sample 100 analog readings on A1.</li>
              <li>
                Calculate baseline sensor resistance Ro:
                <code className="block mt-1 p-2 rounded-lg bg-black/50 text-purple-300 border border-white/10">
                  float Vrl = rawA1 * (5.0 / 1023.0);<br />
                  float Rs = ((5.0 - Vrl) / Vrl) * RL_VALUE;<br />
                  float Ro = Rs / 9.83; // Clean air ratio
                </code>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
