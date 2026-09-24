"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { ClimateForecastDay } from "@/lib/ai-engine";
import { useFarmStore } from "@/lib/store";
import AdvisorCard from "@/components/climate/AdvisorCard";
import ComfortPanel from "@/components/climate/ComfortPanel";
import ForecastCards from "@/components/climate/ForecastCards";
import SensorRow from "@/components/climate/SensorRow";
import PageSkeleton from "@/components/layout/PageSkeleton";
import { fallbackForecast } from "@/components/climate/shared";

// V2.5 performance — code-split the Recharts history graphs.
const HistoryGraphs = dynamic(() => import("@/components/climate/HistoryGraphs"), {
  ssr: false,
  loading: () => <PageSkeleton rows={2} />,
});

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
 * /climate — live micro-climate command center.
 * 6 sensor cards, 5-day Open-Meteo forecast (offline-safe),
 * AI climate advisor, 12h history graphs and crop comfort panel.
 */
export default function ClimatePage() {
  const snapshot = useFarmStore((s) => s.snapshot);

  // Shared forecast state: ForecastCards fetches (live or offline
  // fallback) and the advisor consumes the same days — never errors.
  // Initial-only snapshot read: live updates flow via onForecast, not rememo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => fallbackForecast(snapshot, 5), []);
  const [forecast, setForecast] = useState<ClimateForecastDay[]>(initial);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isOffline, setIsOffline] = useState(true);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* 1. SENSOR ROW — 6 live cards */}
      <Rise>
        <SensorRow />
      </Rise>

      {/* 2. WEATHER FORECAST */}
      <Rise delay={0.06}>
        <ForecastCards
          onForecast={(days, offline) => {
            setForecast(days);
            setIsOffline(offline);
          }}
        />
      </Rise>

      {/* 3 + 5. AI ADVISOR + CROP COMFORT */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Rise delay={0.1}>
          <AdvisorCard forecast={forecast} />
        </Rise>
        <Rise delay={0.14}>
          <ComfortPanel />
        </Rise>
      </div>

      {/* 4. HISTORY GRAPHS */}
      <Rise delay={0.18}>
        <HistoryGraphs />
      </Rise>
    </div>
  );
}
