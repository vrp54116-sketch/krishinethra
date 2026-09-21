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
 * SegmentedControl — grid-cols-3 with sliding emerald indicator (framer-motion layoutId="seg")
 * behind the active option; guaranteed equal widths.
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
        "grid w-full grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/40 p-1",
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
              "relative flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-extrabold transition-colors cursor-pointer select-none",
              active ? "text-black" : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            {active && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-emerald-500 shadow-[0_0_16px_rgba(34,197,94,0.45)]"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5 truncate">
              {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-black" : "text-zinc-400")} />}
              <span className="truncate">{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
