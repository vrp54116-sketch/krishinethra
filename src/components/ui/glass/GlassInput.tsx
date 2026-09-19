"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type GlassInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const GlassInput = React.forwardRef<
  HTMLInputElement,
  GlassInputProps
>(({ className, ...rest }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "glass-inset w-full px-4 py-2.5 text-sm text-[#e7f5ec]",
        "placeholder:text-[#e7f5ec]/40",
        "outline-none transition-all duration-200",
        "focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-500/30",
        className,
      )}
      {...rest}
    />
  );
});
GlassInput.displayName = "GlassInput";

export default GlassInput;
