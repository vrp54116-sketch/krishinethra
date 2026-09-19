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
    dot: "bg-red-400",
    border: "border-red-500/25",
    icon: "bg-red-500/15 text-red-300",
  },
  warning: {
    dot: "bg-amber-400",
    border: "border-amber-500/25",
    icon: "bg-amber-500/15 text-amber-300",
  },
  info: {
    dot: "bg-emerald-400",
    border: "border-emerald-500/20",
    icon: "bg-emerald-500/15 text-emerald-300",
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
                "flex items-center gap-3 rounded-xl border bg-black/30 p-3 transition-colors hover:bg-black/50",
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
                <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{sug.message}</p>
              </div>
              {sug.actionHref && (
                <Link
                  href={sug.actionHref}
                  className="flex shrink-0 items-center gap-0.5 rounded-lg border border-white/10 px-2 py-1.5 text-[11px] font-bold text-emerald-300 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10"
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
