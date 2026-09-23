"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * LiquidButton — V2.1 liquid glass pill button.
 *
 * - .liquid-button surface (frost + blur + 6-layer shadow; primary adds the
 *   emerald glow 0 0 28px rgba(52,211,153,0.35)).
 * - 40px dark icon circle badge (white icon) that scales 1.1 on hover.
 * - Hover translateY(-3px) + brightness(1.1), active scale(0.94).
 * - Click spawns an expanding ripple from the exact click point that runs
 *   opacity 0 → 1 → 0 over 600ms (hidden under prefers-reduced-motion).
 */

export interface LiquidButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  href?: string;
  label?: React.ReactNode;
  variant?: "primary" | "glass";
  iconOnly?: boolean;
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
      className,
      onClick,
      disabled,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const nextId = React.useRef(0);

    const spawnRipple = (e: React.MouseEvent<HTMLElement>) => {
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
      spawnRipple(e);
      onClick?.(e as React.MouseEvent<HTMLButtonElement>);
    };

    const inner = (
      <>
        <span className="liquid-button-badge">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </span>
        {!iconOnly && label ? (
          <span className="liquid-button-label whitespace-nowrap">{label}</span>
        ) : null}
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
      "liquid-button",
      variant === "primary" ? "liquid-button-primary" : "liquid-glass-pill",
      iconOnly && "liquid-button-icon-only",
      "focus-visible:outline-none",
      className,
    );

    if (href && !disabled) {
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
        disabled={disabled}
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
