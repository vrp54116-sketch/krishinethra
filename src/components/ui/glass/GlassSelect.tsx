"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type GlassSelectProps =
  React.SelectHTMLAttributes<HTMLSelectElement>;

export const GlassSelect = React.forwardRef<
  HTMLSelectElement,
  GlassSelectProps
>(({ className, children, ...rest }, ref) => {
  return (
    <span className={cn("relative inline-flex w-full")}>
      <select
        ref={ref}
        className={cn(
          "glass-inset w-full appearance-none pr-10 pl-4 py-2.5 text-sm text-[#e7f5ec]",
          "outline-none transition-all duration-200 cursor-pointer",
          "focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/30",
          "[&>option]:bg-[#0b1410] [&>option]:text-[#e7f5ec]",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e7f5ec]/50"
      />
    </span>
  );
});
GlassSelect.displayName = "GlassSelect";

export default GlassSelect;
