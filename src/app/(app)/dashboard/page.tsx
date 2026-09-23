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
import EdgeStaleBanner from "@/components/mqtt/EdgeStaleBanner";

function Rise({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={className}
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
  const location = [profile?.farmName, profile?.district, profile?.state].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      {/* 0. PERSONALIZED GREETING - ONE ROW (height ≤56px) */}
      {(profile?.farmerName || profile?.farmName) && (
        <Rise>
          <div className="flex h-12 sm:h-14 items-center justify-between gap-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.1] to-transparent px-3.5 sm:px-4 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-lg sm:text-xl">
                {profile?.avatar || "🌾"}
              </span>
              <p className="truncate text-sm sm:text-base font-extrabold text-white">
                {firstName ? `Namaste, ${firstName} 🌾` : "Namaste 🌾"}
              </p>
            </div>
            {location && (
              <span className="hidden xs:flex sm:flex max-w-[50%] shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200/80">
                <MapPin className="h-3 w-3 shrink-0 text-emerald-400" />
                <span className="truncate">{location}</span>
              </span>
            )}
          </div>
        </Rise>
      )}

      {/* 0b. HARDWARE SAFETY — sensor node silent (edge-stale) */}
      <Rise>
        <EdgeStaleBanner />
      </Rise>

      {/* V2.1 LIQUID GLASS LAYOUT
          Desktop (xl+): 2-column — left: sensors + AI reasoning,
          right: health + pump + camera quick actions.
          Tablet/mobile: single column, cards stack (right column first). */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ---- LEFT: sensors + reasoning (+ alerts/water) ---- */}
        <div className="order-2 flex min-w-0 flex-col gap-4 xl:order-1">
          <Rise delay={0.1}>
            <SensorGrid />
          </Rise>
          <Rise delay={0.16}>
            <SuggestionsCard />
          </Rise>
          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2 xl:grid-cols-1">
            <Rise delay={0.18}>
              <AlertsFeed />
            </Rise>
            <Rise delay={0.2}>
              <WaterCard />
            </Rise>
          </div>
        </div>

        {/* ---- RIGHT: health + pump + camera ---- */}
        <div className="order-1 flex min-w-0 flex-col gap-4 xl:order-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Rise className="h-full sm:col-span-1">
              <HealthScoreCard />
            </Rise>
            <Rise delay={0.06} className="h-full sm:col-span-2">
              <DailyReportCard />
            </Rise>
          </div>
          <Rise delay={0.12}>
            <PumpControl />
          </Rise>
          <Rise delay={0.22}>
            <QuickActions />
          </Rise>
        </div>
      </div>
    </div>
  );
}
