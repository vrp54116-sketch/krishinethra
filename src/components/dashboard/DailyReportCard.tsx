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
    <Card className="flex flex-col lg:col-span-2">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
              {t("dashboard.dailyReport")}
            </h2>
            <p className="truncate text-xs text-[#9CA3AF]">{todayLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleSpeech}
          aria-label={speaking ? "Stop reading" : "Read report aloud"}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all",
            speaking
              ? "border-[#34D399]/60 bg-[#34D399]/20 text-[#34D399] shadow-[0_0_16px_rgba(52,211,153,0.4)]"
              : "border-white/10 bg-white/[0.04] text-[#9CA3AF] hover:border-[#34D399]/40 hover:text-[#34D399]",
          )}
        >
          {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Live report text can never match the server prerender (1s tick +
          random noise), so render a stable skeleton until mount — same
          hydration-gate pattern as the AppShell live values. */}
      {mounted ? (
        <p className="flex-1 text-sm leading-relaxed text-[#F3F4F6]">{report}</p>
      ) : (
        <div className="flex-1 space-y-2" aria-hidden>
          <div className="h-3 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
        </div>
      )}

      {speaking && (
        <div className="mt-3 flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="h-4 w-1 animate-pulse rounded-full bg-[#34D399]"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
          <span className="ml-1 text-[11px] font-medium text-[#34D399]">
            Speaking…
          </span>
        </div>
      )}
    </Card>
  );
}
