"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type GlassPillProps = React.HTMLAttributes<HTMLDivElement>;

export function GlassPill({ className, children, ...rest }: GlassPillProps) {
  return (
    <div className={cn("glass-pill", className)} {...rest}>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

export default GlassPill;
