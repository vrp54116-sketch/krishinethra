"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type GlassPillProps = React.HTMLAttributes<HTMLDivElement>;

export const GlassPill = React.forwardRef<HTMLDivElement, GlassPillProps>(
  ({ className, children, ...rest }, ref) => {
    return (
      <div ref={ref} className={cn("glass-pill", className)} {...rest}>
        <div className="relative z-[1]">{children}</div>
      </div>
    );
  },
);
GlassPill.displayName = "GlassPill";

export default GlassPill;
