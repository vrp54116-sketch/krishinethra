"use client";

import { memo, useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { Area, ComposedChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Carbon & Ember chart theme — strokes: accent + white/40 + white/20 */
/* ------------------------------------------------------------------ */

export const CHART_GRID = "rgba(255,255,255,0.06)";
export const CHART_TICK = "#A3A3A3";

export const CHART_STROKES = {
  accent: "#FF6B1A",
  white40: "rgba(255,255,255,0.40)",
  white20: "rgba(255,255,255,0.20)",
} as const;

export const chartTooltipStyle = {
  background: "var(--bg, #000000)",
  border: "1px solid var(--border, rgba(255,255,255,0.10))",
  borderRadius: 9999,
  fontSize: 12,
  color: "var(--text, #FFFFFF)",
  padding: "6px 14px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
} as const;

/** Custom glass-pill tooltip for Recharts */
export const GlassChartTooltip = memo(function GlassChartTooltip({
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
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 6 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      className="g3-chart-tooltip"
    >
      {title ? <p className="font-bold text-white mb-0.5">{title}</p> : null}
      {payload.map((p, i) => {
        const v = Number(p.value ?? 0);
        const n = String(p.name ?? "");
        const [text, name] = formatter ? formatter(v, n) : [`${v}`, n];
        return (
          <p key={i} className="tabular-nums text-zinc-200 text-xs">
            {name ? <span className="mr-1 text-zinc-400">{name}:</span> : null}
            {text}
          </p>
        );
      })}
    </motion.div>
  );
});

/* ------------------------------------------------------------------ */
/* Card shell — Cards radius 20px, p-20px, gap 16px                   */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  children,
  variant = "default",
  interactive = true,
}: {
  className?: string;
  children: ReactNode;
  variant?: "default" | "strong";
  interactive?: boolean;
}) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const reach = Math.hypot(
      Math.max(x, rect.width - x),
      Math.max(y, rect.height - y),
    );
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x, y, size: Math.ceil(reach * 2) }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 620);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden liquid-card-hover rounded-[20px] p-[20px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition-colors",
        variant === "strong" && "bg-[var(--surface-2)] shadow-xl",
        className,
      )}
    >
      <div className="relative z-[1] flex flex-col gap-4">{children}</div>
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden
          className="liquid-card-ripple"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CardHeader — Labels 12px uppercase tracking-wide text-2            */
/* ------------------------------------------------------------------ */

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
    <div className="mb-1 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h2 className="truncate text-[12px] font-semibold uppercase tracking-wide text-[var(--text-2)]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-[var(--text-2)]/80">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AnimatedNumber — 28px semibold tabular-nums white                  */
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
  const shouldReduceMotion = useReducedMotion();
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const controls = animate(mv, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, mv, shouldReduceMotion]);

  const activeDisplay = shouldReduceMotion ? value : display;

  return (
    <span
      className={cn(
        "text-[28px] font-semibold tabular-nums text-[var(--text)] leading-tight",
        className,
      )}
    >
      {activeDisplay.toFixed(decimals)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline — tiny 24-point recharts line with accent glow           */
/* ------------------------------------------------------------------ */

export const Sparkline = memo(function Sparkline({
  data,
  color = "#FF6B1A",
}: {
  data: number[];
  color?: string;
}) {
  const [hasAnimated, setHasAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHasAnimated(true), 600);
    return () => clearTimeout(t);
  }, []);

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
            isAnimationActive={!hasAnimated}
            animationDuration={500}
            animationEasing="ease-in-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* resampleChartPoints — resample to maxPoints (e.g., 60 pts / 1 pt/s) */
/* ------------------------------------------------------------------ */

export function resampleChartPoints<T>(data: T[], maxPoints: number = 60): T[] {
  if (!data || data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  const result: T[] = [];
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
    if (result.length > maxPoints) {
      result.splice(1, 1);
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Status pill — Semantic dots ONLY (ok #22C55E, warn #FBBF24, crit #FF453A) */
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
    pillStyle: "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
    dotStyle: "bg-[#22C55E] shadow-[0_0_6px_rgba(34,197,94,0.85)]",
  },
  good: {
    pillStyle: "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
    dotStyle: "bg-[#22C55E] shadow-[0_0_6px_rgba(34,197,94,0.85)]",
  },
  warning: {
    pillStyle: "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
    dotStyle: "bg-[#FBBF24] shadow-[0_0_6px_rgba(251,191,36,0.85)]",
  },
  warn: {
    pillStyle: "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
    dotStyle: "bg-[#FBBF24] shadow-[0_0_6px_rgba(251,191,36,0.85)]",
  },
  critical: {
    pillStyle: "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
    dotStyle: "bg-[#FF453A] shadow-[0_0_6px_rgba(255,69,58,0.85)]",
  },
  bad: {
    pillStyle: "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
    dotStyle: "bg-[#FF453A] shadow-[0_0_6px_rgba(255,69,58,0.85)]",
  },
  info: {
    pillStyle: "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
    dotStyle: "bg-[#FF8A4C] shadow-[0_0_6px_rgba(255,138,76,0.85)]",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
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
/* Health color scale — ok #22C55E, warn #FBBF24, crit #FF453A        */
/* ------------------------------------------------------------------ */

export function healthColor(score: number): {
  hex: string;
  text: string;
  word: string;
} {
  if (score > 75)
    return { hex: "#22C55E", text: "text-[#22C55E]", word: "Good" };
  if (score >= 50) return { hex: "#FBBF24", text: "text-[#FBBF24]", word: "Fair" };
  return { hex: "#FF453A", text: "text-[#FF453A]", word: "Poor" };
}

/* ------------------------------------------------------------------ */
/* useMounted — gate locale/date strings to client-only rendering       */
/* ------------------------------------------------------------------ */

const emptySubscribe = () => () => {};

export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
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
