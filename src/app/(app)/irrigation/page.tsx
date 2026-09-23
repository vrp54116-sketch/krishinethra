"use client";

import { motion } from "framer-motion";
import PumpHeroCard from "@/components/irrigation/PumpHeroCard";
import AiExplainerCard from "@/components/irrigation/AiExplainerCard";
import HistoryTable from "@/components/irrigation/HistoryTable";
import SchedulePanel from "@/components/irrigation/SchedulePanel";
import EdgeStaleBanner from "@/components/mqtt/EdgeStaleBanner";
import PumpRunLog from "@/components/irrigation/PumpRunLog";
import RainSkipLog from "@/components/irrigation/RainSkipLog";

function Rise({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * /irrigation — single pump & soil water management center.
 * Pump control, Jal Agent rule engine, weekly scheduling,
 * and history log — all live from the hardware contract.
 */
export default function IrrigationPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* 0. HARDWARE SAFETY — sensor node silent (edge-stale) */}
      <Rise>
        <EdgeStaleBanner />
      </Rise>

      {/* 1. PUMP HERO + EXPLAINABLE AI */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Rise>
          <PumpHeroCard />
        </Rise>
        <Rise delay={0.06}>
          <AiExplainerCard />
        </Rise>
      </div>

      {/* 2. PUMP RUN LOG & WATER SAVINGS */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Rise delay={0.1}>
          <PumpRunLog />
        </Rise>
        <Rise delay={0.14}>
          <RainSkipLog />
        </Rise>
      </div>

      {/* 3. SCHEDULE */}
      <Rise delay={0.18}>
        <SchedulePanel />
      </Rise>

      {/* 4. HISTORY */}
      <Rise delay={0.22}>
        <HistoryTable />
      </Rise>
    </div>
  );
}
