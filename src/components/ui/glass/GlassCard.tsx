"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type GlassCardVariant = "default" | "strong" | "inset";
type GlassGlow = "green" | "amber" | "red" | "rose" | "accent" | "none";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  glow?: GlassGlow;
}

const VARIANT_CLASS: Record<GlassCardVariant, string> = {
  default: "glass rounded-[20px]",
  strong: "glass-strong rounded-[20px]",
  inset: "glass-inset rounded-[16px]",
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
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(VARIANT_CLASS[variant], className)}
        style={{ ...GLOW_STYLE[glow], ...style }}
        {...rest}
      >
        <div className="relative z-[1]">{children}</div>
      </div>
    );
  },
);
GlassCard.displayName = "GlassCard";

export default GlassCard;
