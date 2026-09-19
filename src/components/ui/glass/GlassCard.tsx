"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type GlassCardVariant = "default" | "strong" | "inset";
type GlassGlow = "green" | "amber" | "red" | "none";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  glow?: GlassGlow;
}

const VARIANT_CLASS: Record<GlassCardVariant, string> = {
  default: "glass",
  strong: "glass-strong",
  inset: "glass-inset",
};

const GLOW_STYLE: Record<GlassGlow, React.CSSProperties> = {
  none: {},
  green: {
    borderColor: "rgba(16,185,129,0.35)",
    boxShadow:
      "0 0 32px rgba(16,185,129,0.18), 0 8px 32px rgba(0,0,0,0.4)",
  },
  amber: {
    borderColor: "rgba(245,158,11,0.35)",
    boxShadow:
      "0 0 32px rgba(245,158,11,0.16), 0 8px 32px rgba(0,0,0,0.4)",
  },
  red: {
    borderColor: "rgba(239,68,68,0.35)",
    boxShadow:
      "0 0 32px rgba(239,68,68,0.18), 0 8px 32px rgba(0,0,0,0.4)",
  },
};

export function GlassCard({
  variant = "default",
  glow = "none",
  className,
  style,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(VARIANT_CLASS[variant], className)}
      style={{ ...GLOW_STYLE[glow], ...style }}
      {...rest}
    >
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

export default GlassCard;
