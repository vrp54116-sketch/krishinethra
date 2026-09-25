"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type GlassButtonVariant = "primary" | "ghost" | "secondary" | "danger";
type GlassButtonSize = "sm" | "md" | "lg";

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
}

const SIZE_CLASS: Record<GlassButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export const GlassButton = React.forwardRef<
  HTMLButtonElement,
  GlassButtonProps
>(
  (
    {
      variant = "primary",
      size = "md",
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => {
    // Secondary / ghost: surface pill border
    if (variant === "ghost" || variant === "secondary") {
      return (
        <button
          ref={ref}
          disabled={disabled}
          className={cn(
            "btn-secondary inline-flex cursor-pointer items-center justify-center gap-2",
            "rounded-full font-semibold transition-all duration-200 active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-50",
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

    // Danger: crit tint
    if (variant === "danger") {
      return (
        <button
          ref={ref}
          disabled={disabled}
          className={cn(
            "btn-danger inline-flex cursor-pointer items-center justify-center gap-2",
            "rounded-full font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-50",
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

    // Primary: linear-gradient(135deg,#FF6B1A,#FF8A4C) white text + glow 0 0 24px accent-glow
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "btn-primary-ember group inline-flex cursor-pointer items-center justify-center gap-2",
          "rounded-full font-semibold text-white",
          "transition-all duration-200 hover:brightness-110 active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100",
          SIZE_CLASS[size],
          className,
        )}
        style={{
          background: "linear-gradient(135deg, #FF6B1A 0%, #FF8A4C 100%)",
          boxShadow: "0 0 24px rgba(255, 107, 26, 0.35)",
        }}
        {...rest}
      >
        <span className="relative z-[1] inline-flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);
GlassButton.displayName = "GlassButton";

export default GlassButton;
