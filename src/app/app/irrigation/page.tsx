"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useFarmStore } from "@/lib/store";
import PumpHeroCard from "@/components/irrigation/PumpHeroCard";
import AiExplainerCard from "@/components/irrigation/AiExplainerCard";
import HistoryTable from "@/components/irrigation/HistoryTable";
import SchedulePanel from "@/components/irrigation/SchedulePanel";
import EdgeStaleBanner from "@/components/mqtt/EdgeStaleBanner";
import PumpRunLog from "@/components/irrigation/PumpRunLog";
import RainSkipLog from "@/components/irrigation/RainSkipLog";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import IrrigationLoading from "./loading";

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
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    const s = useFarmStore.getState();
    return !(s.hydrated && s.snapshot);
  });

  useEffect(() => {
    const unsubscribe = useFarmStore.subscribe((state) => {
      if (state.hydrated && state.snapshot) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <IrrigationLoading />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* 0. HARDWARE SAFETY — sensor node silent (edge-stale) */}
      <Rise>
        <EdgeStaleBanner />
      </Rise>

      {/* 1. PUMP HERO + EXPLAINABLE AI */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Rise>
          <ErrorBoundary name="PumpHeroCard">
            <PumpHeroCard />
          </ErrorBoundary>
        </Rise>
        <Rise delay={0.06}>
          <ErrorBoundary name="AiExplainerCard">
            <AiExplainerCard />
          </ErrorBoundary>
        </Rise>
      </div>

      {/* 2. PUMP RUN LOG & WATER SAVINGS */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Rise delay={0.1}>
          <ErrorBoundary name="PumpRunLog">
            <PumpRunLog />
          </ErrorBoundary>
        </Rise>
        <Rise delay={0.14}>
          <ErrorBoundary name="RainSkipLog">
            <RainSkipLog />
          </ErrorBoundary>
        </Rise>
      </div>

      {/* 3. SCHEDULE */}
      <Rise delay={0.18}>
        <ErrorBoundary name="SchedulePanel">
          <SchedulePanel />
        </ErrorBoundary>
      </Rise>

      {/* 4. HISTORY */}
      <Rise delay={0.22}>
        <ErrorBoundary name="HistoryTable">
          <HistoryTable />
        </ErrorBoundary>
      </Rise>
    </div>
  );
}
