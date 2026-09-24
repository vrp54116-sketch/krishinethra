"use client";

import { MapPin } from "lucide-react";
import { useFarmStore } from "@/lib/store";
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
import SensorHealthCard from "@/components/dashboard/SensorHealthCard";
import LiveCameraCard from "@/components/dashboard/LiveCameraCard";
import { LiquidStaggerContainer, LiquidStaggerItem } from "@/components/ui/glass";

/**
 * /dashboard — the KrishiNethra liquid-glass command center.
 *
 * V2.5 layout:
 *  - Desktop (xl+): 2 columns.
 *      Left : 4 sensor cards (2×2) + AI Agent Reasoning + Sensor Health
 *      Right: Farm Health score + Pump control + Live camera + Alerts feed
 *  - Tablet/mobile: single column, cards stack with a 16px gap;
 *    mobile uses the shell's compact card padding, bottom tab bar + FAB.
 * All cards use liquid-glass-card styling (24px padding).
 */
export default function DashboardPage() {
  const profile = useFarmStore((s) => s.settings.farmProfile);
  const firstName = (profile?.farmerName || "").trim().split(" ")[0];
  const location = [profile?.farmName, profile?.district, profile?.state].filter(Boolean).join(" · ");

  return (
    <LiquidStaggerContainer className="mx-auto w-full max-w-7xl space-y-4">
      {/* 0. PERSONALIZED GREETING - ONE ROW (height ≤56px) */}
      {(profile?.farmerName || profile?.farmName) && (
        <LiquidStaggerItem>
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
        </LiquidStaggerItem>
      )}

      {/* 0b. HARDWARE SAFETY & EDGE AI BANNERS */}
      <LiquidStaggerItem>
        <EdgeStaleBanner />
      </LiquidStaggerItem>
      <LiquidStaggerItem>
        <EdgeAiStatusBanners />
      </LiquidStaggerItem>

      {/* V2.5 LIQUID GLASS GRID
          Desktop (xl+): left = sensors (2×2) + AI reasoning + sensor health,
          right = farm health + pump + live camera + alerts.
          Tablet/mobile: single column, 16px (gap-4) stack. */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
        {/* ---- LEFT: 4 sensor cards (2×2) + AI Agent Reasoning + Sensor Health ---- */}
        <div className="liquid-contain flex min-w-0 flex-col gap-4">
          <LiquidStaggerItem>
            <SensorGrid />
          </LiquidStaggerItem>
          <LiquidStaggerItem>
            <AiAgentReasoning />
          </LiquidStaggerItem>
          <LiquidStaggerItem>
            <SensorHealthCard />
          </LiquidStaggerItem>
        </div>

        {/* ---- RIGHT: Farm Health score + Pump + Live camera + Alerts ---- */}
        <div className="flex min-w-0 flex-col gap-4">
          <LiquidStaggerItem>
            <HealthScoreCard />
          </LiquidStaggerItem>
          <LiquidStaggerItem>
            <PumpControl />
          </LiquidStaggerItem>
          <LiquidStaggerItem>
            <LiveCameraCard />
          </LiquidStaggerItem>
          <LiquidStaggerItem>
            <AlertsFeed />
          </LiquidStaggerItem>
        </div>
      </div>

      {/* Secondary row: report, AI suggestions, quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LiquidStaggerItem className="lg:col-span-1">
          <DailyReportCard />
        </LiquidStaggerItem>
        <LiquidStaggerItem className="lg:col-span-1">
          <SuggestionsCard />
        </LiquidStaggerItem>
        <LiquidStaggerItem className="lg:col-span-1">
          <QuickActions />
        </LiquidStaggerItem>
      </div>
    </LiquidStaggerContainer>
  );
}
