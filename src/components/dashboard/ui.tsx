"use client";

import { memo, useEffect, useState, type ReactNode } from "react";
import { animate, useMotionValue } from "framer-motion";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Card shell — hover lift + green glow (shared by every dashboard card) */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "card-surface rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-[0_0_28px_rgba(34,197,94,0.22)] sm:p-5",
        className,
      )}
    >
      {children}
    </section>
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
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pts} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.8}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Status pill                                                         */
/* ------------------------------------------------------------------ */

export type PillTone = "good" | "warn" | "bad" | "info";

const PILL_STYLES: Record<PillTone, string> = {
  good: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  warn: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  bad: "border-red-400/40 bg-red-500/10 text-red-300",
  info: "border-sky-400/40 bg-sky-500/10 text-sky-300",
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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
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
