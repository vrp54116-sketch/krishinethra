"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GlassToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function GlassToggle({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: GlassToggleProps) {
  const toggle = React.useCallback(() => {
    if (disabled) return;
    onChange(!checked);
  }, [checked, disabled, onChange]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={toggle}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2.5 outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-0 rounded-full",
        className,
      )}
    >
      {/* Track — neumorphic-glass inset well */}
      <span
        aria-hidden
        className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border px-1"
        style={{
          background: checked
            ? "rgba(16,185,129,0.22)"
            : "rgba(0,0,0,0.35)",
          backdropFilter: "blur(20px) saturate(170%)",
          WebkitBackdropFilter: "blur(20px) saturate(170%)",
          borderColor: checked
            ? "rgba(16,185,129,0.4)"
            : "rgba(255,255,255,0.12)",
          boxShadow: checked
            ? "inset 2px 2px 6px rgba(0,0,0,0.5), inset -1px -1px 3px rgba(255,255,255,0.08), 0 0 16px rgba(16,185,129,0.25)"
            : "inset 2px 2px 6px rgba(0,0,0,0.5), inset -1px -1px 3px rgba(255,255,255,0.08)",
          transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
        }}
      >
        {/* Knob — soft raised circle, spring animated */}
        <motion.span
          className="block h-6 w-6 rounded-full"
          initial={false}
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          style={{
            background: checked
              ? "linear-gradient(180deg, #34d399 0%, #059669 100%)"
              : "linear-gradient(180deg, #2b3833 0%, #141d19 100%)",
            boxShadow: checked
              ? "3px 3px 8px rgba(0,0,0,0.5), -2px -2px 6px rgba(255,255,255,0.10), 0 0 14px rgba(16,185,129,0.55), inset 0 1px 0 rgba(255,255,255,0.4)"
              : "3px 3px 8px rgba(0,0,0,0.5), -2px -2px 6px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        />
      </span>
      {label ? (
        <span className="text-sm font-medium text-[#e7f5ec]/90">{label}</span>
      ) : null}
    </button>
  );
}

export default GlassToggle;
