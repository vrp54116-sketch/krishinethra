import React from "react";
import { cn } from "@/lib/utils";

export interface ChapterLabelProps {
  n: number | string;
  title: string;
  color?: "terra" | "moss" | string;
  className?: string;
}

export function ChapterLabel({
  n,
  title,
  color = "terra",
  className,
}: ChapterLabelProps) {
  const formattedNum =
    typeof n === "number"
      ? String(n).padStart(2, "0")
      : String(n).length === 1
        ? `0${n}`
        : String(n);

  const colorClass =
    color === "terra"
      ? "text-[var(--terra)]"
      : color === "moss"
        ? "text-[var(--moss)]"
        : "";

  const customColorStyle =
    color !== "terra" && color !== "moss" ? { color } : undefined;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 select-none",
        "font-editorial-mono text-[11px] uppercase tracking-[0.12em] font-semibold",
        colorClass,
        className,
      )}
      style={customColorStyle}
    >
      <span>
        {`CHAPTER ${formattedNum} // ${title}`}
      </span>
      {/* 48px hairline dash after */}
      <span
        className="inline-block w-12 h-[1px] bg-[var(--line)] shrink-0 self-center"
        aria-hidden="true"
      />
    </div>
  );
}

export default ChapterLabel;
