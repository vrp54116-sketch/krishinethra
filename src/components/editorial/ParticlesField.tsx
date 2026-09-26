import React from "react";
import { cn } from "@/lib/utils";

export interface ParticlesFieldProps {
  className?: string;
}

export function ParticlesField({ className }: ParticlesFieldProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none select-none z-0",
        className,
      )}
      aria-hidden="true"
    >
      {/* 6 floating outline squares (drift via transform keyframes 30-60s) */}
      <div
        className="editorial-drift-30 absolute top-[12%] left-[10%] w-3 h-3 border border-[var(--line)] rounded-none"
        style={{ animationDuration: "30s" }}
      />
      <div
        className="editorial-drift-45 absolute top-[28%] right-[14%] w-4 h-4 border border-[var(--line)] rounded-none"
        style={{ animationDuration: "45s" }}
      />
      <div
        className="editorial-drift-38 absolute top-[48%] left-[22%] w-3.5 h-3.5 border border-[var(--line)] rounded-none"
        style={{ animationDuration: "38s" }}
      />
      <div
        className="editorial-drift-60 absolute top-[68%] right-[24%] w-5 h-5 border border-[var(--line)] rounded-none"
        style={{ animationDuration: "60s" }}
      />
      <div
        className="editorial-drift-52 absolute top-[38%] right-[8%] w-2.5 h-2.5 border border-[var(--line)] rounded-none"
        style={{ animationDuration: "52s" }}
      />
      <div
        className="editorial-drift-38 absolute top-[84%] left-[14%] w-4 h-4 border border-[var(--line)] rounded-none"
        style={{ animationDuration: "36s" }}
      />

      {/* 3 filled 4px squares (drift via transform keyframes 30-60s) */}
      <div
        className="editorial-drift-38 absolute top-[22%] left-[46%] w-1 h-1 bg-[var(--terra)] rounded-none"
        style={{ animationDuration: "40s" }}
      />
      <div
        className="editorial-drift-52 absolute top-[62%] right-[38%] w-1 h-1 bg-[var(--moss)] rounded-none"
        style={{ animationDuration: "50s" }}
      />
      <div
        className="editorial-drift-45 absolute top-[80%] right-[18%] w-1 h-1 bg-[var(--ink-2)] rounded-none"
        style={{ animationDuration: "32s" }}
      />
    </div>
  );
}

export default ParticlesField;
