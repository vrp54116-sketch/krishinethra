"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type GlassButtonVariant = "primary" | "ghost" | "danger";
type GlassButtonSize = "sm" | "md" | "lg";

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
}

const SIZE_CLASS: Record<GlassButtonSize, string> = {
  sm: "px-3.5 py-2 text-[13px]",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-[15px]",
};

export function GlassButton({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...rest
}: GlassButtonProps) {
  if (variant === "ghost") {
    return (
      <button
        disabled={disabled}
        className={cn(
          "glass inline-flex cursor-pointer items-center justify-center gap-2",
          "rounded-2xl! font-semibold text-[#e7f5ec]",
          "transition-all duration-200 hover:bg-white/10 active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60",
          SIZE_CLASS[size],
          className,
        )}
        {...rest}
      >
        <span className="relative z-[1] inline-flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  }

  if (variant === "danger") {
    return (
      <button
        disabled={disabled}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-2",
          "rounded-2xl border font-semibold text-red-100",
          "transition-all duration-200 active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60",
          SIZE_CLASS[size],
          className,
        )}
        style={{
          background: "rgba(239,68,68,0.12)",
          backdropFilter: "blur(20px) saturate(170%)",
          WebkitBackdropFilter: "blur(20px) saturate(170%)",
          borderColor: "rgba(239,68,68,0.28)",
          boxShadow:
            "0 0 24px rgba(239,68,68,0.18), 0 8px 32px rgba(0,0,0,0.4)",
          position: "relative",
          overflow: "hidden",
        }}
        {...rest}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.12), transparent 40%)",
          }}
        />
        <span className="relative z-[1] inline-flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  }

  // primary — emerald gradient + outer glow + inner top highlight
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2",
        "rounded-2xl border border-emerald-300/30 font-semibold text-white",
        "transition-all duration-200 hover:brightness-110 active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70",
        SIZE_CLASS[size],
        className,
      )}
      style={{
        background: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
        boxShadow:
          "0 0 24px rgba(16,185,129,0.35), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.35)",
        position: "relative",
        overflow: "hidden",
      }}
      {...rest}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.25), transparent 45%)",
        }}
      />
      <span className="relative z-[1] inline-flex items-center gap-2">
        {children}
      </span>
    </button>
  );
}

export default GlassButton;
