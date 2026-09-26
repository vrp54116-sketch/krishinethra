import React from "react";
import { cn } from "@/lib/utils";

export interface EyebrowProps {
  dot?: boolean;
  color?: "moss" | "terra" | "ink" | string;
  label?: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Eyebrow({
  dot = true,
  color = "moss",
  label,
  text,
  children,
  className,
}: EyebrowProps) {
  const content = label || text || children;

  const colorStyles: Record<string, { dot: string; text: string }> = {
    moss: {
      dot: "bg-[var(--moss)]",
      text: "text-[var(--ink-2)]",
    },
    terra: {
      dot: "bg-[var(--terra)]",
      text: "text-[var(--ink-2)]",
    },
    ink: {
      dot: "bg-[var(--ink)]",
      text: "text-[var(--ink)]",
    },
  };

  const selectedColor = colorStyles[color] || {
    dot: color.startsWith("#") || color.startsWith("rgb") || color.startsWith("var") ? "" : "bg-[var(--moss)]",
    text: "text-[var(--ink-2)]",
  };

  const isCustomColor = !colorStyles[color];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 select-none",
        "font-editorial-mono text-[11px] uppercase tracking-[0.12em]",
        selectedColor.text,
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "inline-block w-1.5 h-1.5 shrink-0 rounded-none",
            selectedColor.dot,
          )}
          style={isCustomColor ? { backgroundColor: color } : undefined}
          aria-hidden="true"
        />
      )}
      <span className="leading-none">{content}</span>
    </div>
  );
}

export default Eyebrow;
