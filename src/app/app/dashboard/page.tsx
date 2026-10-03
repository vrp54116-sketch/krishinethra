"use client";

import { MapPin, CloudRain } from "lucide-react";
import { useFarm, useFarmStore } from "@/lib/store";
import HealthScoreCard from "@/components/dashboard/HealthScoreCard";
import DailyReportCard from "@/components/dashboard/DailyReportCard";
import SensorGrid from "@/components/dashboard/SensorGrid";
import PumpControl from "@/components/dashboard/PumpControl";
import SuggestionsCard from "@/components/dashboard/SuggestionsCard";
import AlertsFeed from "@/components/dashboard/AlertsFeed";
import QuickActions from "@/components/dashboard/QuickActions";
import EdgeStaleBanner from "@/components/mqtt/EdgeStaleBanner";
import EdgeAiStatusBanners from "@/components/dashboard/EdgeAiStatusBanners";
import AiAgentReasoning from "@/components/dashboard/AiAgentReasoning";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { cn } from "@/lib/utils";
import OfflineResilienceCard from "@/components/dashboard/OfflineResilienceCard";

/**
 * /dashboard — KrishiNethra Command Center.
 * Strict 12-column CSS Grid layout (16px gap, 24px card padding, 12px border radius).
 */
export default function DashboardPage() {
  const farm = useFarm();
  const profile = useFarmStore((s) => s.settings.farmProfile);
  const firstName = (profile?.farmerName || "").trim().split(" ")[0];
  const location = [profile?.farmName, profile?.district, profile?.state].filter(Boolean).join(" · ");
  const isRaining = Boolean(farm.rain);

  return (
    <div
      className="grid grid-cols-12 gap-4 w-full max-w-7xl mx-auto"
      style={{ gridTemplateColumns: "repeat(12, 1fr)", gap: "16px" }}
    >
      {/* Accessible h1 heading for Lighthouse */}
      <h1 className="sr-only">KrishiNethra Farm Command Center Dashboard</h1>

      {/* 1. GREETING ROW (span-12) */}
      <div className="col-span-12 flex min-h-[56px] flex-wrap items-center justify-between gap-3 rounded-[12px] border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.1] to-transparent p-6">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-xl">
            {profile?.avatar || "🌾"}
          </span>
          <p className="truncate text-base font-extrabold text-white">
            {firstName ? `Namaste, ${firstName} 🌾` : "Namaste 🌾"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {location && (
            <span className="hidden sm:flex max-w-[240px] shrink-0 items-center gap-1.5 rounded-[12px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200/90">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="truncate">{location}</span>
            </span>
          )}

          {/* Rain chip: SKY-BLUE IF DETECTED, GRAY IF NONE */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-mono font-bold uppercase tracking-wider border transition-all",
              isRaining
                ? "bg-sky-500/20 text-sky-300 border-sky-400/40 shadow-[0_0_14px_rgba(56,189,248,0.25)] animate-pulse"
                : "bg-zinc-800/40 text-zinc-400 border-zinc-700/50"
            )}
          >
            <CloudRain className={cn("w-3.5 h-3.5", isRaining ? "text-sky-300 animate-bounce" : "text-zinc-400")} />
            <span>RAIN: {isRaining ? "DETECTED" : "NONE"}</span>
          </div>
        </div>
      </div>

      {/* Safety & Edge AI Banners (span-12) */}
      <div className="col-span-12 empty:hidden">
        <EdgeStaleBanner />
      </div>
      <div className="col-span-12 empty:hidden">
        <EdgeAiStatusBanners />
      </div>

      {/* 2. FOUR SENSOR CARDS (Soil, Temperature, Humidity, AQI) - span-3 each in one row */}
      <ErrorBoundary name="SensorGrid">
        <SensorGrid />
      </ErrorBoundary>

      {/* 3. FARM HEALTH (span-4) & PUMP STATUS (span-8) in one row */}
      <div className="col-span-12 md:col-span-4 h-full">
        <ErrorBoundary name="HealthScoreCard">
          <HealthScoreCard />
        </ErrorBoundary>
      </div>
      <div className="col-span-12 md:col-span-8 h-full">
        <ErrorBoundary name="PumpControl">
          <PumpControl />
        </ErrorBoundary>
      </div>

      {/* 4. AI AGENT REASONING (span-6) & ALERT CENTER (span-6) in one row */}
      <div className="col-span-12 md:col-span-6 h-full">
        <ErrorBoundary name="AiAgentReasoning">
          <AiAgentReasoning />
        </ErrorBoundary>
      </div>
      <div className="col-span-12 md:col-span-6 h-full">
        <ErrorBoundary name="AlertsFeed">
          <AlertsFeed />
        </ErrorBoundary>
      </div>

      {/* 5. AI DAILY REPORT (span-4), SUGGESTIONS (span-4), QUICK ACTIONS (span-4) in one row */}
      <div className="col-span-12 md:col-span-4 h-full">
        <ErrorBoundary name="DailyReportCard">
          <DailyReportCard />
        </ErrorBoundary>
      </div>
      <div className="col-span-12 md:col-span-4 h-full">
        <ErrorBoundary name="SuggestionsCard">
          <SuggestionsCard />
        </ErrorBoundary>
      </div>
      <div className="col-span-12 md:col-span-4 h-full">
        <ErrorBoundary name="QuickActions">
          <QuickActions />
        </ErrorBoundary>
      </div>
      <div className="col-span-12 md:col-span-4 h-full">
        <OfflineResilienceCard />
      </div>
    </div>
  );
}
