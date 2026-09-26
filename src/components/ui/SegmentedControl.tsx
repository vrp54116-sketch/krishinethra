"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId?: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * SegmentedControl — bordered square tabs (active = ink bg, bg-color text)
 */
export default function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  layoutId = "seg",
  className,
  "aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "grid w-full grid-cols-3 border border-[var(--line)] bg-[var(--panel)] p-0.5 rounded-none",
        className,
      )}
    >
      {options.map((option) => {
        const active = value === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 px-2.5 py-2",
              "font-editorial-mono text-[11px] font-bold uppercase tracking-[0.1em]",
              "rounded-none transition-colors cursor-pointer select-none",
              active ? "text-[var(--bg)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]",
            )}
          >
            {active && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-none bg-[var(--ink)]"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5 truncate">
              {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-[var(--bg)]" : "text-[var(--ink-2)]")} />}
              <span className="truncate">{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
