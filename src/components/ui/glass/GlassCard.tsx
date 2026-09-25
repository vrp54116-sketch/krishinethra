"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type GlassCardVariant = "default" | "strong" | "inset";
type GlassGlow = "none" | "accent" | "ok" | "warn" | "crit";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  glow?: GlassGlow;
  interactive?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

const VARIANT_CLASS: Record<GlassCardVariant, string> = {
  default: "rounded-[20px] p-[20px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
  strong: "rounded-[20px] p-[20px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] shadow-xl",
  inset: "rounded-[16px] p-[16px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
};

const GLOW_STYLE: Record<GlassGlow, React.CSSProperties> = {
  none: {},
  accent: {
    borderColor: "var(--accent)",
    boxShadow: "0 0 16px var(--accent-glow)",
  },
  ok: {
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  warn: {
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  crit: {
    borderColor: "rgba(255, 69, 58, 0.4)",
  },
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = "default",
      glow = "none",
      interactive = true,
      className,
      style,
      onClick,
      children,
      ...rest
    },
    ref,
  ) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const nextId = React.useRef(0);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (interactive) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const reach = Math.hypot(
          Math.max(x, rect.width - x),
          Math.max(y, rect.height - y),
        );
        const id = nextId.current++;
        setRipples((prev) => [
          ...prev,
          { id, x, y, size: Math.ceil(reach * 2) },
        ]);
        window.setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 620);
      }
      onClick?.(e);
    };

    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden",
          VARIANT_CLASS[variant],
          interactive && "liquid-card-hover",
          className,
        )}
        style={{ ...GLOW_STYLE[glow], ...style }}
        {...rest}
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
  },
);
GlassCard.displayName = "GlassCard";

export default GlassCard;
