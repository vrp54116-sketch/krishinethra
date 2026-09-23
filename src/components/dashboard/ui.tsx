"use client";

import { memo, useEffect, useId, useState, type ReactNode } from "react";
import { animate, useMotionValue } from "framer-motion";
import { Area, ComposedChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Aurora Harvest chart theme — shared by every Recharts surface      */
/* ------------------------------------------------------------------ */

export const CHART_GRID = "rgba(255,255,255,0.06)";
export const CHART_TICK = "#9CA3AF";

export const chartTooltipStyle = {
  background: "rgba(18,26,22,0.85)",
  backdropFilter: "blur(20px) saturate(170%)",
  WebkitBackdropFilter: "blur(20px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 999,
  fontSize: 12,
  color: "#F3F4F6",
  padding: "6px 14px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
} as const;

/** Custom glass-pill tooltip for Recharts (blur + white/15 border + 999px radius). */
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
      {title ? <p className="font-bold text-white mb-0.5">{title}</p> : null}
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
/* Card shell — Aurora Harvest GlassCard                               */
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
  // V2.1 — every dashboard card is a liquid glass card.
  return (
    <div
      className={cn(
        "relative liquid-card-hover",
        variant === "strong"
          ? "liquid-glass-strong rounded-[28px]"
          : "liquid-glass-card",
        className,
      )}
    >
      <div className="relative z-[1]">{children}</div>
    </div>
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
        <h2 className="truncate text-[13px] font-semibold uppercase tracking-wider text-white/50">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-zinc-400">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AnimatedNumber — tabular-nums, font-semibold, gradient text        */
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
    <span
      className={cn(
        "tabular-nums font-semibold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent",
        className,
      )}
    >
      {display.toFixed(decimals)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline — tiny 24-point recharts line with accent glow           */
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
/* Status pill — glass-inset pill with dot + uppercase 10px label     */
/* ------------------------------------------------------------------ */

export type PillTone =
  | "optimal"
  | "warning"
  | "critical"
  | "info"
  | "good"
  | "warn"
  | "bad";

const PILL_CONFIG: Record<
  PillTone,
  { pillStyle: string; dotStyle: string }
> = {
  optimal: {
    pillStyle: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    dotStyle: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]",
  },
  good: {
    pillStyle: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    dotStyle: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]",
  },
  warning: {
    pillStyle: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    dotStyle: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.85)]",
  },
  warn: {
    pillStyle: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    dotStyle: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.85)]",
  },
  critical: {
    pillStyle: "border-rose-400/30 bg-rose-500/10 text-rose-300",
    dotStyle: "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.85)]",
  },
  bad: {
    pillStyle: "border-rose-400/30 bg-rose-500/10 text-rose-300",
    dotStyle: "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.85)]",
  },
  info: {
    pillStyle: "border-sky-400/30 bg-sky-500/10 text-sky-300",
    dotStyle: "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.85)]",
  },
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
  const cfg = PILL_CONFIG[tone] ?? PILL_CONFIG.info;
  return (
    <span
      className={cn(
        "liquid-glass-pill inline-flex items-center gap-1.5 rounded-full! border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        cfg.pillStyle,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          cfg.dotStyle,
          pulse && "animate-pulse",
        )}
      />
      <span>{children}</span>
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
    return { hex: "#34D399", text: "text-emerald-300", word: "Good" };
  if (score >= 50) return { hex: "#FBBF24", text: "text-amber-300", word: "Fair" };
  return { hex: "#FB7185", text: "text-rose-300", word: "Poor" };
}

/* ------------------------------------------------------------------ */
/* useMounted — gate locale/date strings to client-only rendering       */
/* ------------------------------------------------------------------ */

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
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
