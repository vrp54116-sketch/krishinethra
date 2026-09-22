"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { getHealthBreakdown } from "@/lib/ai-engine";
import { AnimatedNumber, Card, healthColor } from "./ui";

const RING_SIZE = 120;
const STROKE = 10;

export default function HealthScoreCard() {
  const t = useT();
  const farmHealthScore = useFarmStore((s) => s.farmHealthScore);
  const snapshot = useFarmStore((s) => s.snapshot);
  const zones = useFarmStore((s) => s.zones);
  const scans = useFarmStore((s) => s.scans);
  const sprayPlans = useFarmStore((s) => s.sprayPlans);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { hex, text, word } = healthColor(farmHealthScore);

  const r = (RING_SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, farmHealthScore));

  const activePlansCount = sprayPlans.filter((p) => p.status === "active").length;
  const factors = useMemo(
    () =>
      getHealthBreakdown(
        snapshot,
        zones,
        scans.filter((x) => !x.resolved).length,
        activePlansCount,
      ),
    [snapshot, zones, scans, activePlansCount],
  );

  return (
    <Card className="relative flex flex-col items-center justify-between overflow-visible text-center max-h-[220px] h-[220px] p-3.5 sm:p-4">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-xs font-bold tracking-tight text-white sm:text-sm">
          {t("common.farmHealthScore")}
        </h2>
        {/* Breakdown tooltip trigger (tap-friendly for mobile) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            onMouseEnter={() => setShowBreakdown(true)}
            onMouseLeave={() => setShowBreakdown(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300 cursor-pointer"
            aria-label="Score breakdown"
          >
            <Info className="h-4 w-4" />
          </button>
          {showBreakdown && (
            <div className="absolute right-0 top-full z-[60] mt-2 w-72 rounded-[20px] border border-white/15 bg-[rgba(18,26,22,0.94)] p-3.5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
              <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-[#F3F4F6]">Score Breakdown</span>
                <span className="font-mono text-xs font-extrabold text-[#34D399]">
                  {Math.round(farmHealthScore)} / 100
                </span>
              </div>

              {/* Chips banner */}
              <div className="mb-3 flex flex-wrap items-center gap-1 rounded-[12px] border border-white/10 bg-[rgba(18,26,22,0.6)] p-2 text-[11px] font-medium leading-relaxed text-[#F3F4F6]">
                {factors.map((f, i) => (
                  <span key={f.key} className="inline-flex items-center gap-1">
                    <span className="rounded-md bg-[#34D399]/20 px-1.5 py-0.5 font-bold text-[#34D399]">
                      {f.chip}
                    </span>
                    {i < factors.length - 1 && <span className="text-[#9CA3AF] font-bold">•</span>}
                  </span>
                ))}
              </div>

              <div className="space-y-2">
                {factors.map((f) => (
                  <div key={f.key}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-zinc-200">{f.label}</span>
                      <span className="font-bold tabular-nums text-white">
                        {f.pts} / {f.max}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(f.pts / f.max) * 100}%`,
                          background:
                            f.pts / f.max >= 0.75
                              ? "#22c55e"
                              : f.pts / f.max >= 0.5
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      />
                    </div>
                    <p className="mt-0.5 text-[10px] text-zinc-500">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animated circular progress */}
      <div className="relative my-auto" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={r}
            fill="none"
            stroke={hex}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={false}
            animate={{ strokeDashoffset: c - (clamped / 100) * c }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            style={{ filter: `drop-shadow(0 0 10px ${hex})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatedNumber
            value={farmHealthScore}
            decimals={0}
            className={cn("text-3xl font-bold tabular-nums", text)}
          />
          <span className="text-[10px] text-[#9CA3AF]">/ 100</span>
          <span className={cn("text-xs font-semibold", text)}>{word}</span>
        </div>
      </div>

      <p className="max-w-[32ch] text-[11px] leading-tight text-[#9CA3AF] truncate">
        Moisture, climate, AQI &amp; crop health
      </p>
    </Card>
  );
}
