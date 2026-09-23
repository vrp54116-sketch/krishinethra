"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import FarmMap from "@/components/map/FarmMap";

export default function MapPage() {
  const mode = useFarmStore((s) => s.settings.mode);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* Digital Twin banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/[0.07] p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
          <Info className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-white">
            Digital Twin · {mode === "live" ? "LIVE Hardware Mirror" : "Simulation Mirror"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-sky-100/70">
            Real-time single-zone visualization of your physical farm node. All hardware telemetry, pump states, and servo angles update live.
          </p>
        </div>
        <span
          className={cn(
            "ml-auto hidden shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold tracking-widest sm:block",
            mode === "live"
              ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
              : "border-amber-400/50 bg-amber-500/10 text-amber-300",
          )}
        >
          {mode === "live" ? "LIVE" : "SIMULATION"}
        </span>
      </div>

      {/* Single Zone Farm View */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <FarmMap />
      </motion.div>
    </div>
  );
}
