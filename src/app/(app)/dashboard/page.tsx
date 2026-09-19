"use client";

import { motion } from "framer-motion";
import HealthScoreCard from "@/components/dashboard/HealthScoreCard";
import DailyReportCard from "@/components/dashboard/DailyReportCard";
import SensorGrid from "@/components/dashboard/SensorGrid";
import PumpControl from "@/components/dashboard/PumpControl";
import SuggestionsCard from "@/components/dashboard/SuggestionsCard";
import AlertsFeed from "@/components/dashboard/AlertsFeed";
import WaterCard from "@/components/dashboard/WaterCard";
import QuickActions from "@/components/dashboard/QuickActions";

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
 * /dashboard — the KrishiNethra command center.
 * Everything is live from the zustand simulation store.
 */
export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* 1. HERO ROW */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <Rise>
          <HealthScoreCard />
        </Rise>
        <Rise delay={0.06}>
          <DailyReportCard />
        </Rise>
      </div>

      {/* 2. SENSOR CARDS GRID */}
      <Rise delay={0.1}>
        <SensorGrid />
      </Rise>

      {/* 3 + 4. PUMP CONTROL + AI SUGGESTIONS */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Rise delay={0.12}>
          <PumpControl />
        </Rise>
        <Rise delay={0.16}>
          <SuggestionsCard />
        </Rise>
      </div>

      {/* 5 + 6. LIVE ALERTS + WATER TODAY */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Rise delay={0.18}>
          <AlertsFeed />
        </Rise>
        <Rise delay={0.2}>
          <WaterCard />
        </Rise>
      </div>

      {/* 7. QUICK ACTIONS */}
      <Rise delay={0.22}>
        <QuickActions />
      </Rise>
    </div>
  );
}
