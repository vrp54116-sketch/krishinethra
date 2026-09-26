import React from "react";
import { cn } from "@/lib/utils";

export interface GhostChipProps {
  icon?: React.ReactNode;
  label?: string;
  children?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function GhostChip({
  icon,
  label,
  children,
  active = false,
  onClick,
  className,
}: GhostChipProps) {
  const content = label || children;
  const Component = onClick ? "button" : "span";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1",
        "border border-[var(--line)] bg-transparent rounded-none",
        "font-editorial-mono text-[11px] uppercase tracking-[0.12em]",
        "select-none transition-all duration-200 ease-out",
        active
          ? "border-[var(--terra)] text-[var(--ink)] bg-[var(--terra-soft)]"
          : "text-[var(--ink-2)] hover:border-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--panel)]",
        onClick && "cursor-pointer hover:-translate-y-px active:translate-y-0",
        className,
      )}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="leading-none">{content}</span>
    </Component>
  );
}

export default GhostChip;
