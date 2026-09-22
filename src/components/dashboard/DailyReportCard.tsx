"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { generateDailyReport } from "@/lib/ai-engine";
import { Card, useMounted } from "./ui";

function voiceLang(lang: string): string {
  switch (lang) {
    case "hi":
      return "hi-IN";
    case "gu":
      return "gu-IN";
    case "mr":
      return "mr-IN";
    default:
      return "en-IN";
  }
}

export default function DailyReportCard() {
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

  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const mounted = useMounted();

  const report = useMemo(
    () =>
      generateDailyReport({
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
      }),
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

  // Stop any speech when the card unmounts.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Speech not supported on this device");
      return;
    }
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(report);
    utter.lang = voiceLang(settings.language);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utter);
    setSpeaking(true);
    toast.success(speaking ? "Stopped" : "Reading daily report aloud");
  };

  const today = new Date().toLocaleDateString(
    settings.language === "en" ? "en-IN" : "hi-IN",
    { weekday: "long", day: "numeric", month: "long" },
  );

  // Locale date strings differ between Node (SSR) and Chrome — render the
  // real date only after mount so hydration always matches.
  const todayLabel = mounted ? today : " ";

  return (
    <Card
      className={cn(
        "flex flex-col justify-between lg:col-span-2 p-3.5 sm:p-4 transition-all duration-200",
        !expanded ? "max-h-[220px] h-[220px] overflow-hidden" : "h-auto",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2 shrink-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xs sm:text-sm font-bold tracking-tight text-white">
              {t("dashboard.dailyReport")}
            </h2>
            <p className="truncate text-[11px] text-[#9CA3AF]">{todayLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleSpeech}
          aria-label={speaking ? "Stop reading" : "Read report aloud"}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer",
            speaking
              ? "border-[#34D399]/60 bg-[#34D399]/20 text-[#34D399] shadow-[0_0_16px_rgba(52,211,153,0.4)]"
              : "border-white/10 bg-white/[0.04] text-[#9CA3AF] hover:border-[#34D399]/40 hover:text-[#34D399]",
          )}
        >
          {speaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Report text clamped to 4 lines with "more" expander */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {mounted ? (
          <p className={cn("text-xs sm:text-[13px] leading-relaxed text-[#F3F4F6]", !expanded && "line-clamp-4")}>
            {report}
          </p>
        ) : (
          <div className="space-y-2" aria-hidden>
            <div className="h-3 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between shrink-0 pt-1 border-t border-white/5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] font-semibold text-[#34D399] hover:underline cursor-pointer flex items-center gap-1"
        >
          {expanded ? "Show less" : "more…"}
        </button>

        {speaking && (
          <div className="flex items-center gap-1.5" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="h-3.5 w-1 animate-pulse rounded-full bg-[#34D399]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
            <span className="ml-1 text-[11px] font-medium text-[#34D399]">
              Speaking…
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
