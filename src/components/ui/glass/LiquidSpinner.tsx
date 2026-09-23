"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LiquidSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const SIZE_MAP = {
  sm: { container: "h-8 w-8", blob: "h-3.5 w-3.5", distance: 10 },
  md: { container: "h-12 w-12", blob: "h-5 w-5", distance: 14 },
  lg: { container: "h-16 w-16", blob: "h-7 w-7", distance: 18 },
};

/**
 * LiquidSpinner — Apple-style liquid glass gooey spinner.
 * Uses SVG filter `#liquid-gooey` to blend rotating droplets with fluid viscosity.
 */
export function LiquidSpinner({
  size = "md",
  className,
  label,
}: LiquidSpinnerProps) {
  const conf = SIZE_MAP[size];

  return (
    <div className={cn("inline-flex flex-col items-center justify-center gap-2", className)}>
      <div
        className={cn("relative flex items-center justify-center", conf.container)}
        style={{ filter: "url(#liquid-gooey)" }}
      >
        {/* Blob 1: Emerald rotating */}
        <motion.div
          className={cn("absolute rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981]", conf.blob)}
          animate={{
            x: [conf.distance, -conf.distance, conf.distance],
            y: [-conf.distance / 2, conf.distance / 2, -conf.distance / 2],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Blob 2: Cyan orbiting */}
        <motion.div
          className={cn("absolute rounded-full bg-cyan-400 shadow-[0_0_12px_#06b6d4]", conf.blob)}
          animate={{
            x: [-conf.distance, conf.distance, -conf.distance],
            y: [conf.distance / 2, -conf.distance / 2, conf.distance / 2],
            scale: [1.2, 0.9, 1.2],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Center core blob */}
        <motion.div
          className={cn("absolute rounded-full bg-white/90 shadow-[0_0_8px_#ffffff]", conf.blob)}
          animate={{
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {label && (
        <span className="text-xs font-medium text-zinc-400 animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}

export default LiquidSpinner;
