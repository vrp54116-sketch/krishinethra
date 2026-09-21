"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bug,
  ChevronRight,
  CloudRain,
  Droplets,
  FlaskConical,
  Lightbulb,
  Sprout,
  Thermometer,
  Container,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { suggestActions, type SuggestionIcon, type SuggestionSeverity } from "@/lib/ai-engine";
import { Card, CardHeader } from "./ui";

const ICONS: Record<SuggestionIcon, LucideIcon> = {
  water: Droplets,
  heat: Thermometer,
  humidity: Waves,
  air: Wind,
  tank: Container,
  disease: Bug,
  fertilizer: FlaskConical,
  rain: CloudRain,
  scout: Sprout,
};

const SEVERITY: Record<SuggestionSeverity, { dot: string; border: string; icon: string }> = {
  critical: {
    dot: "bg-[#FB7185]",
    border: "border-[#FB7185]/30",
    icon: "bg-[#FB7185]/15 text-[#FB7185]",
  },
  warning: {
    dot: "bg-[#FBBF24]",
    border: "border-[#FBBF24]/30",
    icon: "bg-[#FBBF24]/15 text-[#FBBF24]",
  },
  info: {
    dot: "bg-[#34D399]",
    border: "border-[#34D399]/25",
    icon: "bg-[#34D399]/15 text-[#34D399]",
  },
};

export default function SuggestionsCard() {
  const t = useT();
  const snapshot = useFarmStore((s) => s.snapshot);
  const zones = useFarmStore((s) => s.zones);
  const settings = useFarmStore((s) => s.settings);
  const farmHealthScore = useFarmStore((s) => s.farmHealthScore);
  const totalWaterUsedL = useFarmStore((s) => s.totalWaterUsedL);
  const tasks = useFarmStore((s) => s.tasks);
  const scans = useFarmStore((s) => s.scans);
  const alerts = useFarmStore((s) => s.alerts);
  const pump = useFarmStore((s) => s.pump);
  const sensorHistory = useFarmStore((s) => s.sensorHistory);
  const diary = useFarmStore((s) => s.diary);
  const sprayPlans = useFarmStore((s) => s.sprayPlans);

  const top = useMemo(
    () =>
      suggestActions({
        snapshot,
        zones,
        settings,
        farmHealthScore,
        totalWaterUsedL,
        tasks,
        scans,
        alerts,
        pump,
        sensorHistory,
        diary,
        sprayPlans,
      }).slice(0, 5),
    [
      snapshot,
      zones,
      settings,
      farmHealthScore,
      totalWaterUsedL,
      tasks,
      scans,
      alerts,
      pump,
      sensorHistory,
      diary,
      sprayPlans,
    ],
  );

  return (
    <Card>
      <CardHeader title={t("dashboard.aiSuggestions")} subtitle={t("dashboard.liveSensorsSub")} />
      <ul className="space-y-2">
        {top.map((sug, i) => {
          const Icon = ICONS[sug.icon] ?? Lightbulb;
          const sev = SEVERITY[sug.severity];
          return (
            <motion.li
              key={sug.id}
              layout
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className={cn(
                "flex items-center gap-3 rounded-[16px] border bg-[rgba(18,26,22,0.66)] p-3 backdrop-blur-md transition-colors hover:bg-[rgba(18,26,22,0.85)]",
                sev.border,
              )}
            >
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", sev.icon)}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-white">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", sev.dot)} />
                  <span className="truncate">{sug.title}</span>
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-[#9CA3AF]">{sug.message}</p>
              </div>
              {sug.actionHref && (
                <Link
                  href={sug.actionHref}
                  className="flex shrink-0 items-center gap-0.5 rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-[#34D399] transition-colors hover:border-[#34D399]/40 hover:bg-[#34D399]/10"
                >
                  {sug.actionLabel ?? "Open"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </motion.li>
          );
        })}
      </ul>
    </Card>
  );
}
