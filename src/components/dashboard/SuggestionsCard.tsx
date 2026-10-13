"use client";

import { memo, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Droplets,
  Wind,
  Bug,
  Thermometer,
  CloudRain,
  IndianRupee,
  Sparkles,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { speakText, stopSpeaking, settingsLangToSpeechLang } from "@/lib/speech";
import {
  computeAdvisorSuggestions,
  recordFeedback,
  snoozeSuggestion,
  type AdvisorSuggestion,
  type AdvisorSuggestionType,
  type AdvisorSeverity,
} from "@/lib/brain/advisor";

const TYPE_ICONS: Record<AdvisorSuggestionType, LucideIcon> = {
  irrigation_forecast: Droplets,
  spray_window: Wind,
  disease_risk_rise: Bug,
  heat_stress: Thermometer,
  rain_skip: CloudRain,
  weekly_money: IndianRupee,
};

const SEVERITY_STYLES: Record<AdvisorSeverity, { badge: string; border: string }> = {
  critical: {
    badge: "bg-[#FB7185]/15 text-[#FB7185]",
    border: "border-[#FB7185]/30",
  },
  warning: {
    badge: "bg-[#FBBF24]/15 text-[#FBBF24]",
    border: "border-[#FBBF24]/30",
  },
  info: {
    badge: "bg-emerald-500/15 text-emerald-400",
    border: "border-emerald-500/20",
  },
};

export default memo(function SuggestionsCard({ className }: { className?: string }) {
  const router = useRouter();
  const language = useFarmStore((s) => s.settings.language);
  const setPumpManual = useFarmStore((s) => s.setPumpManual);

  const [suggestions, setSuggestions] = useState<AdvisorSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    try {
      const items = await computeAdvisorSuggestions();
      setSuggestions(items);
    } catch {
      // Keep existing items if computation fails
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute suggestions every 15 minutes + on mount
  useEffect(() => {
    void loadSuggestions();

    const THIRTY_SECONDS_MS = 30 * 1000;
    const intervalId = setInterval(() => {
      void loadSuggestions();
    }, THIRTY_SECONDS_MS);

    return () => {
      clearInterval(intervalId);
      stopSpeaking();
    };
  }, [loadSuggestions]);

  // Handle [🔊] voice action
  const handleVoice = (sug: AdvisorSuggestion) => {
    const text = t(sug.textKey, sug.params, language);
    if (speakingId === sug.id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }

    setSpeakingId(sug.id);
    const speechLang = settingsLangToSpeechLang(language);
    speakText(text, {
      lang: speechLang,
      rate: 0.95,
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  // Handle [Do it] command execution
  const handleExecute = (sug: AdvisorSuggestion) => {
    const cmd = sug.mappedCommand;
    if (!cmd) return;

    if (cmd.action === "irrigate") {
      setPumpManual(true, 15 * 60);
      toast.success(t("advisor.action.irrigate", {}, language), {
        description: "Irrigation cycle initiated for 15 minutes.",
      });
    }

    if (cmd.href) {
      router.push(cmd.href);
    }
  };

  // Handle [Remind 1h] snooze
  const handleRemind1h = (sug: AdvisorSuggestion) => {
    snoozeSuggestion(sug.type, 1);
    setSuggestions((prev) => prev.filter((item) => item.id !== sug.id));
    toast.info(t("advisor.action.remind_1h", {}, language), {
      description: "Snoozed for 1 hour.",
    });
  };

  // Handle [👍] feedback
  const handleThumbUp = (sug: AdvisorSuggestion) => {
    recordFeedback(sug.type, 1);
    toast.success(t("advisor.feedback.up", {}, language), {
      description: "Thanks! We'll prioritize suggestions like this.",
    });
  };

  // Handle [👎] feedback
  const handleThumbDown = (sug: AdvisorSuggestion) => {
    recordFeedback(sug.type, -0.5);
    // Remove immediately from UI and suppresses next cycle
    setSuggestions((prev) => prev.filter((item) => item.id !== sug.id));
    toast.info(t("advisor.feedback.down", {}, language), {
      description: "Preference saved. This suggestion type is removed.",
    });
  };

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
              {t("advisor.card_title", {}, language)}
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-[var(--ink-3)] font-editorial-mono">
              {t("advisor.card_subtitle", {}, language)}
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
            <p className="text-sm font-semibold text-white/90">
              {t("advisor.all_clear", {}, language)}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5 font-editorial-mono">
              Re-evaluated every 15 min via predictCrossing & microclimate rules.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {suggestions.map((sug) => {
              const Icon = TYPE_ICONS[sug.type] || Droplets;
              const styles = SEVERITY_STYLES[sug.severity] || SEVERITY_STYLES.info;
              const localizedText = t(sug.textKey, sug.params, language);
              const actionLabel = sug.mappedCommand?.labelKey
                ? t(sug.mappedCommand.labelKey, {}, language)
                : t("advisor.action.do_it", {}, language);

              return (
                <li
                  key={sug.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-[12px] border bg-[rgba(18,26,22,0.85)] p-3.5 transition-colors hover:bg-[rgba(18,26,22,0.95)]",
                    styles.border,
                  )}
                >
                  {/* Top: Icon + Localized Text + Voice button */}
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                        styles.badge,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white leading-relaxed">
                        {localizedText}
                      </p>
                      {/* Citation line */}
                      <p className="mt-1 text-[10px] text-zinc-400 font-editorial-mono leading-tight">
                        📌 {sug.citation}
                      </p>
                    </div>

                    {/* [🔊] Voice button */}
                    <button
                      type="button"
                      onClick={() => handleVoice(sug)}
                      title="Speak recommendation"
                      aria-label="Speak suggestion aloud"
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400",
                        speakingId === sug.id && "border-emerald-500 bg-emerald-500/20 text-emerald-300 animate-pulse",
                      )}
                    >
                      {speakingId === sug.id ? (
                        <VolumeX className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Bottom: Action buttons [Do it] + [Remind 1h] + [👍][👎] */}
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2">
                    <div className="flex items-center gap-1.5">
                      {/* [Do it] button */}
                      <button
                        type="button"
                        onClick={() => handleExecute(sug)}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:border-emerald-500/50"
                      >
                        <span>{actionLabel}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>

                      {/* [Remind 1h] button */}
                      <button
                        type="button"
                        onClick={() => handleRemind1h(sug)}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-200"
                        title="Snooze for 1 hour"
                      >
                        <Clock className="h-3 w-3" />
                        <span>{t("advisor.action.remind_1h", {}, language)}</span>
                      </button>
                    </div>

                    {/* Feedback [👍] [👎] */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleThumbUp(sug)}
                        aria-label="Vote helpful (+1)"
                        title="Helpful (+1)"
                        className="flex h-6 w-6 items-center justify-center rounded border border-white/5 text-zinc-400 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleThumbDown(sug)}
                        aria-label="Vote unhelpful (-0.5)"
                        title="Not helpful (-0.5, removes this)"
                        className="flex h-6 w-6 items-center justify-center rounded border border-white/5 text-zinc-400 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
});
