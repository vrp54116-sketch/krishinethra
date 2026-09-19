"use client";

import { memo, useEffect, useId, useState, type ReactNode } from "react";
import { animate, useMotionValue } from "framer-motion";
import { Area, ComposedChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass/GlassCard";

/* ------------------------------------------------------------------ */
/* G3 chart theme — shared by every Recharts surface                    */
/* ------------------------------------------------------------------ */

export const CHART_GRID = "rgba(255,255,255,0.06)";
export const CHART_TICK = "#9ca3af";

export const chartTooltipStyle = {
  background: "rgba(10,18,12,0.82)",
  backdropFilter: "blur(20px) saturate(170%)",
  WebkitBackdropFilter: "blur(20px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 999,
  fontSize: 12,
  color: "#e7f5ec",
  padding: "6px 12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
} as const;

/** Custom glass-pill tooltip for Recharts (blur + white/15 border). */
export function GlassChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; name?: string; payload?: unknown }>;
  label?: string | number;
  formatter?: (value: number, name: string) => [string, string];
  labelFormatter?: (label: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const title =
    labelFormatter && label != null ? labelFormatter(String(label)) : String(label ?? "");
  return (
    <div className="g3-chart-tooltip">
      {title ? <p className="font-bold text-white">{title}</p> : null}
      {payload.map((p, i) => {
        const v = Number(p.value ?? 0);
        const n = String(p.name ?? "");
        const [text, name] = formatter ? formatter(v, n) : [`${v}`, n];
        return (
          <p key={i} className="tabular-nums text-zinc-200">
            {name ? <span className="mr-1 text-zinc-400">{name}:</span> : null}
            {text}
          </p>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card shell — G3 GlassCard (visual only; logic unchanged)             */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children: ReactNode;
  variant?: "default" | "strong";
}) {
  return (
    <GlassCard
      variant={variant}
      className={cn("g3-card-hover p-4 sm:p-5", className)}
    >
      {children}
    </GlassCard>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-zinc-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AnimatedNumber — smoothly tweens whenever the live value changes     */
/* ------------------------------------------------------------------ */

export function AnimatedNumber({
  value,
  decimals = 1,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, mv]);

  return (
    <span className={cn("tabular-nums", className)}>
      {display.toFixed(decimals)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline — tiny 24-point recharts line, no axes                     */
/* ------------------------------------------------------------------ */

export const Sparkline = memo(function Sparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const pts = data.map((v, i) => ({ i, v }));
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gid = `spark-${rawId}`;
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={pts} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gid})`}
            dot={false}
            isAnimationActive={false}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Status pill                                                         */
/* ------------------------------------------------------------------ */

export type PillTone = "good" | "warn" | "bad" | "info";

const PILL_STYLES: Record<PillTone, string> = {
  good: "border-emerald-300/30 bg-emerald-500/10 text-emerald-200",
  warn: "border-amber-300/30 bg-amber-500/10 text-amber-200",
  bad: "border-red-300/30 bg-red-500/10 text-red-200",
  info: "border-sky-300/30 bg-sky-500/10 text-sky-200",
};

export function StatusPill({
  tone,
  children,
  pulse,
}: {
  tone: PillTone;
  children: ReactNode;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "glass-inset inline-flex items-center gap-1 rounded-full! border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        PILL_STYLES[tone],
        pulse && "animate-pulse",
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Health color scale — green >75, amber 50–75, red <50                 */
/* ------------------------------------------------------------------ */

export function healthColor(score: number): {
  hex: string;
  text: string;
  word: string;
} {
  if (score > 75)
    return { hex: "#22c55e", text: "text-emerald-300", word: "Good" };
  if (score >= 50) return { hex: "#f59e0b", text: "text-amber-300", word: "Fair" };
  return { hex: "#ef4444", text: "text-red-300", word: "Poor" };
}

/* ------------------------------------------------------------------ */
/* useMounted — gate locale/date strings to client-only rendering       */
/* ------------------------------------------------------------------ */

/**
 * Node's ICU and Chrome format locale dates differently
 * ("Thursday, 17 September" vs "Thursday 17 September"), so any
 * toLocaleDateString() output must render only after mount to avoid
 * React hydration mismatches.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  // One-time client-mount gate for locale/date strings (avoids hydration
  // mismatch between Node ICU and Chrome formatting).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  return mounted;
}

/* ------------------------------------------------------------------ */
/* Relative time — "just now", "2 min ago", ...                         */
/* ------------------------------------------------------------------ */

export function formatRelativeTime(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec} sec ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.floor(hr / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
