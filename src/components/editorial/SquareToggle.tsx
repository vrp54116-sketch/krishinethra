"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SquareToggleProps {
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
  title?: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function SquareToggle({
  icon,
  active = false,
  onClick,
  ariaLabel,
  title,
  className,
  disabled = false,
  children,
}: SquareToggleProps) {
  const content = icon || children;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || title || "Toggle"}
      aria-pressed={active}
      title={title}
      className={cn(
        "w-10 h-10 shrink-0 inline-flex items-center justify-center",
        "border border-[var(--line)] rounded-[2px]",
        "bg-[var(--panel)] text-[var(--ink-2)] cursor-pointer select-none",
        "transition-all duration-200 ease-out",
        "hover:text-[var(--ink)] hover:border-[var(--ink-2)] hover:bg-[var(--panel-2)]",
        "hover:-translate-x-px hover:-translate-y-px",
        "active:translate-x-0 active:translate-y-0",
        active && "border-[var(--terra)] text-[var(--ink)] bg-[var(--terra-soft)]",
        disabled && "opacity-40 cursor-not-allowed hover:translate-x-0 hover:translate-y-0",
        className,
      )}
    >
      {content}
    </button>
  );
}

export default SquareToggle;
