import React from "react";
import { cn } from "@/lib/utils";

export interface MetaBarProps {
  items?: string[];
  scrollText?: string;
  children?: React.ReactNode;
  className?: string;
}

export function MetaBar({
  items = ["FIELD EDITORIAL", "VOL. 01", "KRISHINETHRA AI"],
  scrollText = "SCROLL TO EXPLORE",
  children,
  className,
}: MetaBarProps) {
  return (
    <div
      className={cn(
        "w-full flex items-center justify-between py-2.5 px-4 md:px-6",
        "border-y border-[var(--line)] bg-[var(--bg)]",
        "font-editorial-mono text-[11px] uppercase tracking-[0.12em]",
        "select-none overflow-x-auto scrollbar-hide",
        className,
      )}
    >
      {/* Left stamps joined by terra bullets */}
      <div className="flex items-center gap-2.5 shrink-0 text-[var(--ink-2)]">
        {children ? (
          children
        ) : (
          items.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span
                  className="inline-block w-1 h-1 bg-[var(--terra)] shrink-0 rounded-none"
                  aria-hidden="true"
                />
              )}
              <span className="whitespace-nowrap">{item}</span>
            </React.Fragment>
          ))
        )}
      </div>

      {/* Right "SCROLL TO EXPLORE" + animated tick line */}
      <div className="flex items-center gap-3 shrink-0 ml-4 text-[var(--ink-2)]">
        <span className="whitespace-nowrap hidden sm:inline">{scrollText}</span>
        {/* Animated tick line */}
        <div
          className="relative w-9 h-[1px] bg-[var(--line)] overflow-hidden shrink-0"
          aria-hidden="true"
        >
          <span className="editorial-tick-animated absolute inset-0 bg-[var(--terra)] block origin-left" />
        </div>
      </div>
    </div>
  );
}

export default MetaBar;
