"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiquidSpinner } from "./LiquidSpinner";

/**
 * LiquidButton — V2.1 liquid glass pill button with micro-interactions.
 *
 * - Hover translateY(-3px), icon circle scale(1.1)
 * - Active scale(0.94), icon scale(0.94), text color darkens
 * - Loading state: button width shrinks to 40px, shows gooey spinner, then expands back
 * - Success state: checkmark icon appears, button turns emerald, then reverts after 2s
 * - Click spawns an expanding ripple (600ms)
 */

export interface LiquidButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  href?: string;
  label?: React.ReactNode;
  variant?: "primary" | "glass";
  iconOnly?: boolean;
  loading?: boolean;
  success?: boolean;
  onSuccessRevert?: () => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  (
    {
      icon: Icon,
      href,
      label,
      variant = "primary",
      iconOnly = false,
      loading = false,
      success = false,
      onSuccessRevert,
      className,
      onClick,
      disabled,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const [internalSuccess, setInternalSuccess] = React.useState(success);
    const nextId = React.useRef(0);

    // Sync external success prop
    React.useEffect(() => {
      setInternalSuccess(success);
      if (success) {
        const timer = setTimeout(() => {
          setInternalSuccess(false);
          onSuccessRevert?.();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }, [success, onSuccessRevert]);

    const spawnRipple = (e: React.MouseEvent<HTMLElement>) => {
      if (loading || internalSuccess) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const reach = Math.hypot(
        Math.max(x, rect.width - x),
        Math.max(y, rect.height - y),
      );
      const id = nextId.current++;
      setRipples((r) => [...r, { id, x, y, size: Math.ceil(reach * 2) }]);
      window.setTimeout(() => {
        setRipples((r) => r.filter((p) => p.id !== id));
      }, 620);
    };

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      if (loading) return;
      spawnRipple(e);
      onClick?.(e as React.MouseEvent<HTMLButtonElement>);
    };

    const EffectiveIcon = internalSuccess ? Check : Icon;

    const inner = (
      <>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="spinner"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="flex items-center justify-center w-full h-full"
            >
              <LiquidSpinner size="sm" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-3 w-full justify-center"
            >
              <span
                className={cn(
                  "liquid-button-badge transition-transform duration-150",
                  internalSuccess && "bg-white text-emerald-700 shadow-[0_0_12px_rgba(255,255,255,0.7)]",
                )}
              >
                <EffectiveIcon
                  className={cn(
                    "h-[18px] w-[18px] transition-transform duration-150",
                    internalSuccess && "text-emerald-700 stroke-[2.8]",
                  )}
                  strokeWidth={2.2}
                />
              </span>
              {!iconOnly && label ? (
                <span
                  className={cn(
                    "liquid-button-label whitespace-nowrap transition-colors duration-150 active:text-white/70",
                    internalSuccess && "text-white font-bold",
                  )}
                >
                  {internalSuccess ? "Success" : label}
                </span>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {ripples.map((r) => (
          <span
            key={r.id}
            aria-hidden
            className="liquid-ripple"
            style={{
              left: r.x,
              top: r.y,
              width: r.size,
              height: r.size,
            }}
          />
        ))}
      </>
    );

    const classes = cn(
      "liquid-button transition-all duration-300",
      variant === "primary" ? "liquid-button-primary" : "liquid-glass-pill",
      iconOnly && "liquid-button-icon-only",
      internalSuccess &&
        "bg-emerald-500! border-emerald-400! shadow-[0_0_28px_rgba(52,211,153,0.75)]! text-white!",
      loading && "w-10! min-w-10! max-w-10! p-0! justify-center overflow-hidden cursor-wait",
      "focus-visible:outline-none",
      className,
    );

    if (href && !disabled && !loading) {
      return (
        <Link
          href={href}
          className={cn(classes, "text-sm")}
          onClick={handleClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
          {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {inner}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        onClick={handleClick}
        className={cn(classes, "text-sm")}
        {...rest}
      >
        {inner}
      </button>
    );
  },
);
LiquidButton.displayName = "LiquidButton";

export default LiquidButton;
