import React from "react";
import { cn } from "@/lib/utils";

export interface HairlineProps {
  vertical?: boolean;
  className?: string;
  color?: string;
}

export function Hairline({
  vertical = false,
  className,
  color,
}: HairlineProps) {
  if (vertical) {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn(
          "w-[1px] self-stretch bg-[var(--line)] shrink-0",
          className,
        )}
        style={color ? { backgroundColor: color } : undefined}
      />
    );
  }

  return (
    <hr
      className={cn(
        "w-full h-[1px] bg-[var(--line)] border-0 my-4 shrink-0",
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}

export default Hairline;
