"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, Container, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { TANK_CAPACITY_L } from "@/lib/simulation-engine";
import { AnimatedNumber, Card, CardHeader } from "@/components/dashboard/ui";

/** Big vertical tank with animated water fill. Refills over ~5s like a farmer refill. */
export default function TankCard() {
  const t = useT();
  const tankLevel = useFarmStore((s) => s.snapshot.tankLevelPercent);
  const tankLow = useFarmStore((s) => s.settings.thresholds.tankLow);
  const addAlert = useFarmStore((s) => s.addAlert);

  const [refilling, setRefilling] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const litres = (tankLevel / 100) * TANK_CAPACITY_L;
  const low = tankLevel < 20;

  // SVG geometry
  const H = 220; // inner height
  const waterH = Math.max(0, Math.min(H, (tankLevel / 100) * H));
  const waterY = H - waterH;

  const handleRefill = () => {
    if (refilling) return;
    const start = useFarmStore.getState().snapshot.tankLevelPercent;
    setRefilling(true);
    setProgress(0);
    const STEPS = 50;
    let step = 0;
    timerRef.current = setInterval(() => {
      step += 1;
      const pct = Math.min(100, start + ((100 - start) * step) / STEPS);
      useFarmStore.setState((s) => ({
        snapshot: { ...s.snapshot, tankLevelPercent: Math.round(pct * 100) / 100 },
      }));
      setProgress(Math.round((step / STEPS) * 100));
      if (step >= STEPS) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setRefilling(false);
        addAlert({
          level: "info",
          title: "Tank refilled to 100%",
          message: `Farmer refilled the ${TANK_CAPACITY_L}L tank to full. Auto-irrigation resumed.`,
        });
        toast.success("Tank refilled to 100%", {
          description: `${TANK_CAPACITY_L}L available — Auto AI can irrigate again.`,
        });
      }
    }, 100); // 50 × 100ms ≈ 5s
  };

  return (
    <Card>
      <CardHeader
        title={t("irrigation.tankTitle")}
        subtitle={`${TANK_CAPACITY_L}L capacity · live level`}
        action={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
            <Container className="h-4 w-4" />
          </span>
        }
      />

      {low && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2.5 text-xs font-semibold text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" />
          Low tank — {tankLevel.toFixed(0)}% left. Refill soon; auto-start blocks below 15% and the pump cannot run below 5%.
        </div>
      )}

      <div className="flex items-center gap-4 sm:gap-5">
        {/* Tank SVG */}
        <svg viewBox="-8 0 116 248" className="h-56 w-28 shrink-0 sm:h-64 sm:w-32" role="img" aria-label={`Tank ${tankLevel.toFixed(0)} percent full`}>
          <defs>
            <clipPath id="tank-clip">
              <rect x="10" y="14" width="80" height="220" rx="14" />
            </clipPath>
            <linearGradient id="tank-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          {/* glass body */}
          <rect x="10" y="14" width="80" height="220" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
          {/* lid */}
          <rect x="30" y="2" width="40" height="12" rx="4" fill="#27272a" stroke="rgba(255,255,255,0.15)" />
          {/* water */}
          <g clipPath="url(#tank-clip)">
            <rect
              x="10"
              y={14 + waterY}
              width="80"
              height={waterH + 4}
              fill="url(#tank-water)"
              opacity="0.9"
              style={{ transition: "y 0.9s ease, height 0.9s ease" }}
            />
            {/* animated surface wave */}
            {waterH > 4 && (
              <motion.ellipse
                cx="50"
                cy={14 + waterY + 1}
                rx="44"
                ry="4"
                fill="#7dd3fc"
                opacity="0.8"
                animate={{ cx: [38, 62, 38] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            {/* rising bubbles while refilling */}
            {refilling &&
              [0, 1, 2, 3].map((i) => (
                <motion.circle
                  key={i}
                  cx={28 + i * 15}
                  r="3"
                  fill="#e0f2fe"
                  opacity="0.7"
                  initial={{ cy: 230 }}
                  animate={{ cy: [230, 14 + waterY + 8] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.3, ease: "easeOut" }}
                />
              ))}
            {/* measurement ticks */}
            {[25, 50, 75].map((p) => (
              <line
                key={p}
                x1="10"
                x2="22"
                y1={14 + H - (p / 100) * H}
                y2={14 + H - (p / 100) * H}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
              />
            ))}
          </g>
          {/* percent label on glass */}
          <text x="50" y={waterH > 60 ? 14 + waterY + 34 : 128} textAnchor="middle" fill="#fff" fontSize="20" fontWeight="800">
            {tankLevel.toFixed(0)}%
          </text>
        </svg>

        {/* Readout */}
        <div className="min-w-0 flex-1">
          <p className="text-4xl font-extrabold tracking-tight text-white">
            <AnimatedNumber value={litres} decimals={2} />
            <span className="ml-1 text-sm font-semibold text-zinc-400">/ {TANK_CAPACITY_L}L</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {tankLow <= 100 ? `Low-water mark ${tankLow}%` : ""} · drains while pumping, tops up with rain
          </p>

          {/* level bar */}
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                low ? "bg-gradient-to-r from-red-500 to-amber-400" : "bg-gradient-to-r from-sky-500 to-cyan-300",
              )}
              style={{ width: `${Math.max(0, Math.min(100, tankLevel))}%` }}
            />
          </div>

          <button
            type="button"
            onClick={handleRefill}
            disabled={refilling}
            className={cn(
              "mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition-all active:scale-[0.98]",
              refilling
                ? "cursor-wait border border-sky-400/40 bg-sky-500/10 text-sky-200"
                : "bg-sky-500 text-black shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:bg-sky-400",
            )}
          >
            <RefreshCw className={cn("h-4 w-4", refilling && "animate-spin")} />
            {refilling ? `${t("irrigation.refilling")} ${progress}%` : t("irrigation.refillTank")}
          </button>
          {refilling && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
