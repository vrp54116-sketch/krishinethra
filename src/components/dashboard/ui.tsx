"use client";

import { memo, useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Field Editorial chart theme — hairline grids, mono axis labels,    */
/* terra/moss strokes, square tooltips (panel bg, 1px border)         */
/* ------------------------------------------------------------------ */

export const CHART_GRID = "var(--line, rgba(237, 234, 227, 0.12))";
export const CHART_TICK = "var(--ink-3, #6B726B)";

export const CHART_STROKES = {
  accent: "var(--terra, #C4503A)",
  terra: "#C4503A",
  moss: "#5F8B6A",
  white40: "rgba(237, 234, 227, 0.40)",
  white20: "rgba(237, 234, 227, 0.20)",
} as const;

export const chartTooltipStyle = {
  background: "var(--panel, #0D120E)",
  border: "1px solid var(--line, rgba(237, 234, 227, 0.12))",
  borderRadius: 0,
  fontSize: 11,
  fontFamily: "IBM Plex Mono, monospace",
  color: "var(--ink, #EDEAE3)",
  padding: "6px 12px",
  boxShadow: "2px 2px 0 rgba(0,0,0,0.4)",
} as const;

/** Custom square tooltip for Recharts */
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
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 4 }}
      transition={{ duration: 0.15 }}
      className="g3-chart-tooltip"
    >
      {title ? <p className="font-bold text-[var(--ink)] mb-0.5 uppercase tracking-wider">{title}</p> : null}
      {payload.map((p, i) => {
        const v = Number(p.value ?? 0);
        const n = String(p.name ?? "");
        const [text, name] = formatter ? formatter(v, n) : [`${v}`, n];
        return (
          <p key={i} className="tabular-nums text-[var(--ink)] text-xs">
            {name ? <span className="mr-1 text-[var(--ink-2)]">{name}:</span> : null}
            {text}
          </p>
        );
      })}
    </motion.div>
  );
});

/* ------------------------------------------------------------------ */
/* Card shell — --panel bg, 1px --line border, 0 radius               */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children: ReactNode;
  variant?: "default" | "strong";
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-none p-5 border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] transition-colors",
        variant === "strong" && "bg-[var(--panel-2)]",
        className,
      )}
    >
      <div className="relative z-[1] flex flex-col gap-4">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CardHeader — mono uppercase label left + status stamp right        */
/* ------------------------------------------------------------------ */

export function CardHeader({
  title,
  subtitle,
  action,
  statusStamp,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  statusStamp?: ReactNode;
}) {
  const rightElement = statusStamp ?? action;
  return (
    <div className="mb-2 flex items-start justify-between gap-2 border-b border-[var(--line)] pb-2">
      <div className="min-w-0">
        <h2 className="truncate font-editorial-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-2)]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-[11px] text-[var(--ink-3)] font-editorial-mono">{subtitle}</p>
        )}
      </div>
      {rightElement && <div className="shrink-0 flex items-center gap-1.5">{rightElement}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AnimatedNumber — metrics 40px 800 ink tabular                      */
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
  return (
    <span
      className={cn(
        "font-editorial-display text-[40px] font-[800] tabular-nums text-[var(--ink)] leading-none tracking-tight",
        className,
      )}
    >
      {(Number.isFinite(value) ? value : 0).toFixed(decimals)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline — terra or moss strokes, square dots                     */
/* ------------------------------------------------------------------ */

export const Sparkline = memo(function Sparkline({
  data,
  color = "var(--terra)",
}: {
  data: number[];
  color?: string;
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gid = `spark-${rawId}`;

  if (!data || data.length === 0) {
    return <div className="h-10 w-full" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 40;
  const padding = 4;
  const innerHeight = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = (idx / Math.max(1, data.length - 1)) * width;
    const y = height - padding - ((val - min) / range) * innerHeight;
    return { x, y };
  });

  const pathD = points.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
    "",
  );
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="h-10 w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gid})`} />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        {points.map((pt, index) => {
          if (index % 6 !== 0 && index !== points.length - 1) return null;
          return (
            <rect
              key={`dot-${index}`}
              x={pt.x - 1.5}
              y={pt.y - 1.5}
              width={3}
              height={3}
              fill={color}
            />
          );
        })}
      </svg>
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
/* Status pill — bordered mono chips (OK moss / WARN gold / CRIT terra) */
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
  { chipStyle: string; dotStyle: string }
> = {
  optimal: {
    chipStyle: "border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)]",
    dotStyle: "bg-[var(--moss)]",
  },
  good: {
    chipStyle: "border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)]",
    dotStyle: "bg-[var(--moss)]",
  },
  warning: {
    chipStyle: "border-[#B98A3E] bg-[#B98A3E]/10 text-[#E4C57E]",
    dotStyle: "bg-[#E4C57E]",
  },
  warn: {
    chipStyle: "border-[#B98A3E] bg-[#B98A3E]/10 text-[#E4C57E]",
    dotStyle: "bg-[#E4C57E]",
  },
  critical: {
    chipStyle: "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]",
    dotStyle: "bg-[var(--terra)]",
  },
  bad: {
    chipStyle: "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--terra)]",
    dotStyle: "bg-[var(--terra)]",
  },
  info: {
    chipStyle: "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)]",
    dotStyle: "bg-[var(--ink-2)]",
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
        "inline-flex items-center gap-1.5 rounded-none border px-2 py-0.5 font-editorial-mono text-[10px] font-bold uppercase tracking-[0.1em]",
        cfg.chipStyle,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-none",
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
