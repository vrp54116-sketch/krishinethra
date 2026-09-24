"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type GlassCardVariant = "default" | "strong" | "inset";
type GlassGlow = "green" | "amber" | "red" | "rose" | "accent" | "none";

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
  default: "liquid-glass-card rounded-[28px]",
  strong: "liquid-glass-strong rounded-[28px] p-6",
  inset: "glass-inset rounded-[20px] p-4",
};

const GLOW_STYLE: Record<GlassGlow, React.CSSProperties> = {
  none: {},
  green: {
    borderColor: "rgba(52,211,153,0.35)",
    boxShadow:
      "0 0 32px rgba(52,211,153,0.18), 0 8px 32px rgba(0,0,0,0.4)",
  },
  amber: {
    borderColor: "rgba(251,191,36,0.35)",
    boxShadow:
      "0 0 32px rgba(251,191,36,0.16), 0 8px 32px rgba(0,0,0,0.4)",
  },
  red: {
    borderColor: "rgba(251,113,133,0.35)",
    boxShadow:
      "0 0 32px rgba(251,113,133,0.18), 0 8px 32px rgba(0,0,0,0.4)",
  },
  rose: {
    borderColor: "rgba(251,113,133,0.35)",
    boxShadow:
      "0 0 32px rgba(251,113,133,0.18), 0 8px 32px rgba(0,0,0,0.4)",
  },
  accent: {
    borderColor: "rgba(var(--section-accent-rgb, 52, 211, 153), 0.40)",
    boxShadow:
      "0 0 24px rgba(var(--section-accent-rgb, 52, 211, 153), 0.18), 0 8px 32px rgba(0,0,0,0.4)",
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
        <div className="relative z-[1]">{children}</div>
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
