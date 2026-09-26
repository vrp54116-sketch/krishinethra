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
  const farmHealthScore = useFarmStore((s) => s.farmHealthScore ?? 85);
  const snapshot = useFarmStore((s) => s.snapshot);
  const zones = useFarmStore((s) => s.zones ?? []);
  const scans = useFarmStore((s) => s.scans ?? []);
  const sprayPlans = useFarmStore((s) => s.sprayPlans ?? []);
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
    <Card className="relative flex flex-col justify-between overflow-visible text-left max-h-[220px] h-[220px] rounded-none border border-[var(--line)] bg-[var(--panel)]">
      {/* Header row = mono uppercase label left + status stamp right */}
      <div className="flex w-full items-center justify-between border-b border-[var(--line)] pb-2">
        <h2 className="font-editorial-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-2)] truncate">
          {t("common.farmHealthScore")}
        </h2>
        {/* Breakdown tooltip trigger */}
        <div className="relative flex items-center gap-1.5">
          <span className="font-editorial-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)] rounded-none">
            {word}
          </span>
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            onMouseEnter={() => setShowBreakdown(true)}
            onMouseLeave={() => setShowBreakdown(false)}
            className="flex h-6 w-6 items-center justify-center rounded-none border border-[var(--line)] text-[var(--ink-2)] transition-colors hover:border-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Score breakdown"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          {showBreakdown && (
            <div className="absolute right-0 top-full z-[60] mt-2 w-72 rounded-none border border-[var(--line)] bg-[var(--panel)] p-3.5 text-left shadow-2xl">
              <div className="mb-2.5 flex items-center justify-between border-b border-[var(--line)] pb-2 font-editorial-mono">
                <span className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">Score Breakdown</span>
                <span className="text-xs font-bold text-[var(--moss)]">
                  {Math.round(farmHealthScore)} / 100
                </span>
              </div>

              {/* Chips banner */}
              <div className="mb-3 flex flex-wrap items-center gap-1 rounded-none border border-[var(--line)] bg-[var(--panel-2)] p-2 font-editorial-mono text-[10px] leading-relaxed text-[var(--ink)]">
                {factors.map((f, i) => (
                  <span key={f.key} className="inline-flex items-center gap-1">
                    <span className="rounded-none bg-[var(--moss-soft)] border border-[var(--moss)] px-1 py-0.2 text-[var(--moss)] font-bold">
                      {f.chip}
                    </span>
                    {i < factors.length - 1 && <span className="text-[var(--ink-3)] font-bold">•</span>}
                  </span>
                ))}
              </div>

              <div className="space-y-2 font-editorial-mono">
                {factors.map((f) => (
                  <div key={f.key}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--ink-2)]">{f.label}</span>
                      <span className="font-bold tabular-nums text-[var(--ink)]">
                        {f.pts} / {f.max}
                      </span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-none bg-[var(--panel-2)] border border-[var(--line)]">
                      <div
                        className="h-full rounded-none transition-all duration-500"
                        style={{
                          width: `${(f.pts / f.max) * 100}%`,
                          background:
                            f.pts / f.max >= 0.75
                              ? "var(--moss)"
                              : f.pts / f.max >= 0.5
                                ? "#E4C57E"
                                : "var(--terra)",
                        }}
                      />
                    </div>
                    <p className="mt-0.5 text-[9px] text-[var(--ink-3)]">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metric row: 40px 800 ink tabular */}
      <div className="my-auto flex items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-1">
            <AnimatedNumber
              value={farmHealthScore}
              decimals={0}
              className="text-[40px] font-extrabold text-[var(--ink)]"
            />
            <span className="font-editorial-mono text-xs uppercase text-[var(--ink-3)] font-semibold">/ 100</span>
          </div>
          <p className="mt-1 text-[11px] font-editorial-mono uppercase tracking-wider text-[var(--ink-3)]">
            Moisture · climate · aqi · crop health
          </p>
        </div>

        {/* Circular indicator */}
        <div className="relative shrink-0" style={{ width: 68, height: 68 }}>
          <svg width={68} height={68} className="-rotate-90">
            <circle
              cx={34}
              cy={34}
              r={28}
              fill="none"
              stroke="var(--line)"
              strokeWidth={5}
            />
            <motion.circle
              cx={34}
              cy={34}
              r={28}
              fill="none"
              stroke={farmHealthScore >= 70 ? "var(--moss)" : farmHealthScore >= 40 ? "#E4C57E" : "var(--terra)"}
              strokeWidth={5}
              strokeDasharray={2 * Math.PI * 28}
              initial={false}
              animate={{ strokeDashoffset: (2 * Math.PI * 28) - (clamped / 100) * (2 * Math.PI * 28) }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
            />
          </svg>
        </div>
      </div>
    </Card>
  );
}
