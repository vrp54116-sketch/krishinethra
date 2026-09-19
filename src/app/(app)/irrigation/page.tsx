"use client";

import { motion } from "framer-motion";
import PumpHeroCard from "@/components/irrigation/PumpHeroCard";
import AiExplainerCard from "@/components/irrigation/AiExplainerCard";
import TankCard from "@/components/irrigation/TankCard";
import UsageTracker from "@/components/irrigation/UsageTracker";
import EnergyMonitor from "@/components/irrigation/EnergyMonitor";
import HistoryTable from "@/components/irrigation/HistoryTable";
import SchedulePanel from "@/components/irrigation/SchedulePanel";

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
 * /irrigation — complete water management center.
 * Pump control, explainable Auto AI, tank, usage, energy,
 * history and weekly scheduling — all live from the farm store.
 */
export default function IrrigationPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* 1. PUMP HERO + EXPLAINABLE AI */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Rise>
          <PumpHeroCard />
        </Rise>
        <Rise delay={0.06}>
          <AiExplainerCard />
        </Rise>
      </div>

      {/* 2. TANK + SCHEDULE */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Rise delay={0.1}>
          <TankCard />
        </Rise>
        <Rise delay={0.14}>
          <SchedulePanel />
        </Rise>
      </div>

      {/* 3. USAGE + ENERGY */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Rise delay={0.16}>
          <UsageTracker />
        </Rise>
        <Rise delay={0.2}>
          <EnergyMonitor />
        </Rise>
      </div>

      {/* 4. HISTORY */}
      <Rise delay={0.22}>
        <HistoryTable />
      </Rise>
    </div>
  );
}
