"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { getHealthBreakdown } from "@/lib/ai-engine";
import { AnimatedNumber, Card, healthColor } from "./ui";

const RING_SIZE = 188;
const STROKE = 15;

export default function HealthScoreCard() {
  const t = useT();
  const farmHealthScore = useFarmStore((s) => s.farmHealthScore);
  const snapshot = useFarmStore((s) => s.snapshot);
  const zones = useFarmStore((s) => s.zones);
  const scans = useFarmStore((s) => s.scans);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { hex, text, word } = healthColor(farmHealthScore);

  const r = (RING_SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, farmHealthScore));

  const factors = useMemo(
    () =>
      getHealthBreakdown(
        snapshot,
        zones,
        scans.filter((x) => !x.resolved).length,
      ),
    [snapshot, zones, scans],
  );

  return (
    <Card className="relative flex flex-col items-center justify-center overflow-visible text-center">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight text-white sm:text-base">
          {t("common.farmHealthScore")}
        </h2>
        {/* Breakdown tooltip trigger (tap-friendly for mobile) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            onMouseEnter={() => setShowBreakdown(true)}
            onMouseLeave={() => setShowBreakdown(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
            aria-label="Score breakdown"
          >
            <Info className="h-4 w-4" />
          </button>
          {showBreakdown && (
            <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-emerald-500/25 bg-[#0a120c] p-3 text-left shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Score breakdown
              </p>
              <div className="space-y-2">
                {factors.map((f) => (
                  <div key={f.key}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-zinc-200">{f.label}</span>
                      <span className="font-bold tabular-nums text-white">
                        {f.score}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${f.score}%`,
                          background:
                            f.score > 75
                              ? "#22c55e"
                              : f.score >= 50
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
      <div className="relative mt-2" style={{ width: RING_SIZE, height: RING_SIZE }}>
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
            className={cn("text-5xl font-extrabold tabular-nums", text)}
          />
          <span className="text-xs text-zinc-500">/ 100</span>
          <span className={cn("mt-1 text-sm font-bold", text)}>{word}</span>
        </div>
      </div>

      <p className="mt-3 max-w-[26ch] text-xs leading-relaxed text-zinc-500">
        Weighted from moisture, temperature, humidity, air quality &amp; disease.
      </p>
    </Card>
  );
}
