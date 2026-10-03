"use client";

import { memo, useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Bug,
  ChevronRight,
  CloudRain,
  Droplets,
  Thermometer,
  Wind,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";

interface SuggestionRule {
  id: "dry_soil" | "high_temp" | "rain_detected" | "high_aqi" | "high_humidity";
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  icon: LucideIcon;
  badgeTone: string;
  borderTone: string;
}

function evaluateRules(): SuggestionRule[] {
  const s = useFarmStore.getState();
  const soil = s.snapshot.soil ?? s.snapshot.soilMoistureB ?? s.live.soil ?? 45;
  const temp = s.snapshot.temp ?? s.snapshot.tempC ?? s.live.temp ?? 28;
  const hum = s.snapshot.hum ?? s.snapshot.humidity ?? s.live.hum ?? 60;
  const aqi = s.snapshot.aqi ?? s.live.aqi ?? 85;
  const rain = Boolean(s.snapshot.rain ?? s.live.rain);

  const lowMoisture = s.settings.thresholds?.moistureLow ?? 30;

  const candidateRules: SuggestionRule[] = [];

  // Rule 1: dry soil -> irrigate now
  if (soil < lowMoisture || soil < 35) {
    candidateRules.push({
      id: "dry_soil",
      title: "Dry soil detected — irrigate now",
      message: `Soil moisture is ${soil.toFixed(1)}% (below threshold). Start irrigation cycle now.`,
      actionLabel: "Irrigate",
      actionHref: "/app/irrigation",
      icon: Droplets,
      badgeTone: "bg-[#FB7185]/15 text-[#FB7185]",
      borderTone: "border-[#FB7185]/30",
    });
  }

  // Rule 2: temp above 35 -> shade/mulch
  if (temp > 35) {
    candidateRules.push({
      id: "high_temp",
      title: "High heat warning — shade/mulch",
      message: `Field temperature is ${temp.toFixed(1)}°C (>35°C). Apply organic mulch or deploy shade nets.`,
      actionLabel: "Climate",
      actionHref: "/app/climate",
      icon: Thermometer,
      badgeTone: "bg-[#FBBF24]/15 text-[#FBBF24]",
      borderTone: "border-[#FBBF24]/30",
    });
  }

  // Rule 3: rain detected -> skip irrigation
  if (rain) {
    candidateRules.push({
      id: "rain_detected",
      title: "Rain detected — skip irrigation",
      message: "Precipitation active on field. Hold irrigation pump to conserve water and prevent root rot.",
      actionLabel: "Irrigation",
      actionHref: "/app/irrigation",
      icon: CloudRain,
      badgeTone: "bg-sky-500/15 text-sky-300",
      borderTone: "border-sky-400/30",
    });
  }

  // Rule 4: AQI above 150 -> air warning
  if (aqi > 150) {
    candidateRules.push({
      id: "high_aqi",
      title: "Air warning — AQI above 150",
      message: `Air Quality Index is ${aqi}. Postpone foliar spraying until atmospheric conditions clear.`,
      actionLabel: "Sensors",
      actionHref: "/app/sensors",
      icon: Wind,
      badgeTone: "bg-[#FB7185]/15 text-[#FB7185]",
      borderTone: "border-[#FB7185]/30",
    });
  }

  // Rule 5: humidity above 85 -> fungal watch
  if (hum > 85) {
    candidateRules.push({
      id: "high_humidity",
      title: "Fungal watch — humidity above 85%",
      message: `Relative humidity is ${hum.toFixed(1)}%. Inspect crop foliage for downy mildew and leaf spot.`,
      actionLabel: "Crop Doctor",
      actionHref: "/app/camera",
      icon: Bug,
      badgeTone: "bg-[#FBBF24]/15 text-[#FBBF24]",
      borderTone: "border-[#FBBF24]/30",
    });
  }

  // Deduplicate and cap at maximum 6 cards
  const seenIds = new Set<string>();
  const deduped: SuggestionRule[] = [];
  for (const r of candidateRules) {
    if (!seenIds.has(r.id)) {
      seenIds.add(r.id);
      deduped.push(r);
    }
  }

  return deduped.slice(0, 6);
}

export default memo(function SuggestionsCard({ className }: { className?: string }) {
  const [suggestions, setSuggestions] = useState<SuggestionRule[]>(() => evaluateRules());
  const lastRunRef = useRef<number>(Date.now());

  // Recomputed at most every 30 seconds from CURRENT state only
  useEffect(() => {
    // Initial evaluation
    setSuggestions(evaluateRules());

    const intervalId = setInterval(() => {
      const now = Date.now();
      if (now - lastRunRef.current >= 29500) {
        lastRunRef.current = now;
        setSuggestions(evaluateRules());
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className={cn(
        "relative rounded-[12px] p-6 border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] flex flex-col justify-between transition-colors",
        className,
      )}
    >
      <div>
        {/* Header row */}
        <div className="mb-4 flex items-start justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div className="min-w-0">
            <h2 className="truncate font-editorial-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-2)]">
              AI Action Suggestions
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-[var(--ink-3)] font-editorial-mono">
              Evaluated every 30s from current sensors
            </p>
          </div>
          <span className="font-editorial-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)] rounded-none">
            {suggestions.length} Active
          </span>
        </div>

        {/* Content list */}
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400 bg-white/[0.02] border border-white/5 rounded-xl">
            <Sparkles className="h-7 w-7 text-emerald-400/70 mb-2" />
            <p className="text-sm font-semibold text-white/90">All clear — no actions required</p>
            <p className="text-xs text-zinc-400 mt-0.5">Farm microclimate, moisture, and air quality are running in optimal ranges.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {suggestions.map((sug) => {
              const Icon = sug.icon;
              return (
                <li
                  key={sug.id}
                  className={cn(
                    "flex items-center gap-3 rounded-[12px] border bg-[rgba(18,26,22,0.85)] p-3 transition-colors hover:bg-[rgba(18,26,22,0.95)]",
                    sug.borderTone,
                  )}
                >
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", sug.badgeTone)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">
                      {sug.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-[#9CA3AF] leading-relaxed">
                      {sug.message}
                    </p>
                  </div>
                  {sug.actionHref && (
                    <Link
                      href={sug.actionHref}
                      className="flex shrink-0 items-center gap-0.5 rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-bold text-[#34D399] transition-colors hover:border-[#34D399]/40 hover:bg-[#34D399]/10"
                    >
                      {sug.actionLabel}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
});
