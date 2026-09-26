"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StampBoxProps {
  label?: string;
  color?: "terra" | "moss" | "ink" | string;
  sublabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export function StampBox({
  label,
  color = "terra",
  sublabel,
  children,
  className,
}: StampBoxProps) {
  const shouldReduceMotion = useReducedMotion();
  const content = label || children;

  const colorStyles: Record<string, { border: string; text: string; bg: string }> = {
    terra: {
      border: "border-[var(--terra)]",
      text: "text-[var(--terra)]",
      bg: "bg-[var(--terra-soft)]",
    },
    moss: {
      border: "border-[var(--moss)]",
      text: "text-[var(--moss)]",
      bg: "bg-[var(--moss-soft)]",
    },
    ink: {
      border: "border-[var(--ink)]",
      text: "text-[var(--ink)]",
      bg: "bg-transparent",
    },
  };

  const currentStyle = colorStyles[color] || {
    border: "border-[var(--terra)]",
    text: "text-[var(--terra)]",
    bg: "bg-[var(--terra-soft)]",
  };

  const isCustomColor = !colorStyles[color];

  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? { opacity: 1, rotate: -6, scale: 1 }
          : { opacity: 0, rotate: 0, scale: 1.4 }
      }
      whileInView={{
        opacity: 1,
        rotate: -6,
        scale: 1,
      }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : 0.35,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "inline-flex flex-col items-center justify-center px-3 py-1.5",
        "border-2 rounded-none select-none",
        "font-editorial-mono text-[11px] uppercase tracking-[0.12em] font-bold",
        currentStyle.border,
        currentStyle.text,
        currentStyle.bg,
        className,
      )}
      style={
        isCustomColor
          ? {
              borderColor: color,
              color: color,
            }
          : undefined
      }
    >
      <span className="leading-tight">{content}</span>
      {sublabel && (
        <span className="text-[9px] tracking-[0.15em] opacity-80 mt-0.5">
          {sublabel}
        </span>
      )}
    </motion.div>
  );
}

export default StampBox;
