"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useFarmStore } from "@/lib/store";
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
  const profile = useFarmStore((s) => s.settings.farmProfile);
  const firstName = (profile?.farmerName || "").trim().split(" ")[0];
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* 0. PERSONALIZED GREETING */}
      {(profile?.farmerName || profile?.farmName) && (
        <Rise>
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.1] to-transparent p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl">
              {profile?.avatar || "🌾"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold text-white sm:text-lg">
                {firstName ? `Namaste, ${firstName} 🌾` : "Namaste 🌾"}
              </p>
              <p className="flex min-w-0 items-center gap-1 truncate text-xs text-emerald-100/70">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {[profile?.farmName, profile?.district, profile?.state].filter(Boolean).join(" · ")}
                </span>
              </p>
            </div>
          </div>
        </Rise>
      )}
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
