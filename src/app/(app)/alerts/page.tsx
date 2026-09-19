"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  Bot,
  CheckCheck,
  ChevronDown,
  Droplets,
  ExternalLink,
  Eye,
  EyeOff,
  FlaskConical,
  Info,
  Loader2,
  Search,
  Send,
  SlidersHorizontal,
  Thermometer,
  Trash2,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Card, CardHeader, formatRelativeTime, useMounted } from "@/components/dashboard/ui";
import {
  ALERT_RULE_STORAGE_KEY,
  getAlertLink,
  getAlertSource,
  pushAlert,
  type AlertSource,
} from "@/lib/notifications";
import type { Alert, Thresholds } from "@/lib/types";

function Rise({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
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

/* ------------------------------------------------------------------ */
/* Level + source presentation                                         */
/* ------------------------------------------------------------------ */

type Level = Alert["level"];

const LEVEL_META: Record<
  Level,
  { label: string; emoji: string; border: string; badge: string; dot: string }
> = {
  critical: {
    label: "Critical",
    emoji: "🔴",
    border: "border-l-red-500",
    badge: "border-red-400/40 bg-red-500/10 text-red-300",
    dot: "bg-red-400",
  },
  warning: {
    label: "Warning",
    emoji: "🟡",
    border: "border-l-amber-400",
    badge: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  info: {
    label: "Info",
    emoji: "🟢",
    border: "border-l-emerald-500",
    badge: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
};

const SOURCE_BADGE: Record<AlertSource, string> = {
  "Jal Agent": "border-sky-400/40 bg-sky-500/10 text-sky-300",
  "Rog Agent": "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  "Vayu Agent": "border-violet-400/40 bg-violet-500/10 text-violet-300",
  System: "border-white/15 bg-white/[0.04] text-zinc-300",
};

type Filter = "all" | "critical" | "warning" | "info" | "unread";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "critical", label: "🔴 Critical" },
  { id: "warning", label: "🟡 Warning" },
  { id: "info", label: "🟢 Info" },
  { id: "unread", label: "Unread" },
];

/* ------------------------------------------------------------------ */
/* Alert RULES table model                                             */
/* ------------------------------------------------------------------ */

interface RuleDef {
  id: string;
  trigger: string;
  channel: string;
  priority: "critical" | "warning" | "info" | "severity";
  control:
    | { type: "threshold"; key: keyof Thresholds }
    | { type: "fixed"; text: string }
    | { type: "severity" };
}

const RULES: RuleDef[] = [
  {
    id: "soil-critical",
    trigger: "Soil moisture < 20% (Zone A / B) — immediate irrigation",
    channel: "App + Telegram + Sound",
    priority: "critical",
    control: { type: "fixed", text: "20% · engine" },
  },
  {
    id: "soil-low",
    trigger: "Zone moisture below the low threshold — consider irrigating",
    channel: "App + Telegram",
    priority: "warning",
    control: { type: "threshold", key: "moistureLow" },
  },
  {
    id: "pump-auto",
    trigger: "Auto pump stops when Zone B rises above the high threshold",
    channel: "App",
    priority: "info",
    control: { type: "threshold", key: "moistureHigh" },
  },
  {
    id: "temp-high",
    trigger: "Field temperature above the high threshold — mulch / shade",
    channel: "App + Telegram",
    priority: "warning",
    control: { type: "threshold", key: "tempHigh" },
  },
  {
    id: "humidity-low",
    trigger: "Humidity below the low threshold — KrishiGPT dry-air advisory",
    channel: "AI chat",
    priority: "warning",
    control: { type: "threshold", key: "humidityLow" },
  },
  {
    id: "aqi-high",
    trigger: "AQI above the limit — delay foliar spraying",
    channel: "App + Telegram",
    priority: "warning",
    control: { type: "threshold", key: "aqiHigh" },
  },
  {
    id: "tank-low",
    trigger: "Tank below the low threshold (critical under 5%) — refill soon",
    channel: "App + Telegram",
    priority: "warning",
    control: { type: "threshold", key: "tankLow" },
  },
  {
    id: "pump-blocked",
    trigger: "Pump blocked — tank too low to run",
    channel: "App + Telegram + Sound",
    priority: "critical",
    control: { type: "fixed", text: "< 5% · engine" },
  },
  {
    id: "pump-event",
    trigger: "Pump started / manual ON-OFF run events",
    channel: "App",
    priority: "info",
    control: { type: "fixed", text: "event" },
  },
  {
    id: "disease",
    trigger: "Leaf scan finds infection — open Crop Doctor",
    channel: "App + Telegram",
    priority: "severity",
    control: { type: "severity" },
  },
];

const THRESHOLD_META: Record<keyof Thresholds, { unit: string; min: number; max: number; step: number }> = {
  moistureLow: { unit: "%", min: 5, max: 60, step: 1 },
  moistureHigh: { unit: "%", min: 40, max: 95, step: 1 },
  tempHigh: { unit: "°C", min: 25, max: 45, step: 0.5 },
  humidityLow: { unit: "%", min: 10, max: 60, step: 1 },
  aqiHigh: { unit: "AQI", min: 50, max: 300, step: 5 },
  tankLow: { unit: "%", min: 5, max: 60, step: 1 },
  pumpDurationSec: { unit: "s", min: 3, max: 120, step: 1 },
};

const PRIORITY_BADGE: Record<RuleDef["priority"], string> = {
  critical: "border-red-400/40 bg-red-500/10 text-red-300",
  warning: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  info: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  severity: "border-sky-400/40 bg-sky-500/10 text-sky-300",
};

function loadRuleMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(ALERT_RULE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AlertsPage() {
  const t = useT();
  const alerts = useFarmStore((s) => s.alerts);
  const telegram = useFarmStore((s) => s.settings.telegram);
  const thresholds = useFarmStore((s) => s.settings.thresholds);
  const updateSettings = useFarmStore((s) => s.updateSettings);
  const markAlertRead = useFarmStore((s) => s.markAlertRead);
  const markAlertsRead = useFarmStore((s) => s.markAlertsRead);

  const mounted = useMounted();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Telegram card state.
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Per-rule Telegram toggles (persisted; off = skip Telegram for that rule).
  const [ruleOverrides, setRuleOverrides] = useState<Record<string, boolean>>(() =>
    typeof window === "undefined" ? {} : loadRuleMap(),
  );

  // Keep "x min ago" labels fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const persistRules = (next: Record<string, boolean>) => {
    setRuleOverrides(next);
    try {
      localStorage.setItem(ALERT_RULE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage is best-effort */
    }
  };

  const counts = useMemo(() => {
    return {
      all: alerts.length,
      critical: alerts.filter((a) => a.level === "critical").length,
      warning: alerts.filter((a) => a.level === "warning").length,
      info: alerts.filter((a) => a.level === "info").length,
      unread: alerts.filter((a) => !a.read).length,
    };
  }, [alerts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alerts.filter((a) => {
      if (filter === "unread" && a.read) return false;
      if (filter === "critical" || filter === "warning" || filter === "info") {
        if (a.level !== filter) return false;
      }
      if (q) {
        const hay = `${a.title} ${a.message} ${getAlertSource(a)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [alerts, filter, query]);

  const handleClearAll = () => {
    if (alerts.length === 0) return;
    useFarmStore.setState({ alerts: [] });
    setExpandedId(null);
    toast.success("Alerts cleared", { description: "The alert center is empty." });
  };

  const handleTestConnection = async () => {
    const botToken = telegram.botToken.trim();
    const chatId = telegram.chatId.trim();
    if (!botToken || !chatId) {
      toast.error("Add your bot token + chat ID first", {
        description: "Paste both values above, then test the connection.",
      });
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken, chatId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (res.ok && data.success) {
        toast.success("Telegram connected!", {
          description: "Check your chat for the confirmation message.",
        });
      } else {
        toast.error("Telegram test failed", {
          description: data.error ?? `HTTP ${res.status} — check token / chat ID.`,
        });
      }
    } catch (err) {
      toast.error("Telegram test failed", {
        description: err instanceof Error ? err.message : "Network error.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleForwardAlert = async (alert: Alert) => {
    const botToken = telegram.botToken.trim();
    const chatId = telegram.chatId.trim();
    if (!botToken || !chatId) {
      toast.error("Telegram not configured", {
        description: "Save your bot token + chat ID in the Telegram card first.",
      });
      return;
    }
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken,
          chatId,
          level: alert.level,
          title: alert.title,
          message: alert.message,
          timestamp: alert.timestamp,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (res.ok && data.success) {
        toast.success("Forwarded to Telegram", { description: alert.title });
      } else {
        toast.error("Forward failed", {
          description: data.error ?? `HTTP ${res.status}`,
        });
      }
    } catch (err) {
      toast.error("Forward failed", {
        description: err instanceof Error ? err.message : "Network error.",
      });
    }
  };

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Card>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 animate-pulse text-emerald-300" />
            <p className="text-sm text-zinc-400">Loading alert center…</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* ============ 1. ALERT CENTER ============ */}
      <Rise>
        <Card>
          <CardHeader
            title={t("alertsPage.alertCenter")}
            subtitle={
              counts.unread > 0
                ? `${counts.unread} unread · ${counts.all} total`
                : `${counts.all} total — all caught up`
            }
            action={
              <div className="flex items-center gap-2">
                {counts.unread > 0 && (
                  <button
                    type="button"
                    onClick={markAlertsRead}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-200"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> {t("alertsPage.markRead")}
                  </button>
                )}
                {alerts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 transition-colors hover:border-red-500/50 hover:text-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {t("alertsPage.clearAll")}
                  </button>
                )}
              </div>
            }
          />

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter alerts">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              const n = counts[f.id];
              const label =
                f.id === "all" ? t("common.all") : f.id === "unread" ? t("common.unread") : f.label;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.97]",
                    active
                      ? "border-emerald-400/60 bg-emerald-500/15 text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                      : "border-white/10 bg-black/30 text-zinc-400 hover:border-emerald-500/30 hover:text-white",
                  )}
                >
                  {label}{" "}
                  <span className={cn("font-mono", active ? "text-emerald-200" : "text-zinc-500")}>
                    {n}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("alertsPage.searchPh")}
              aria-label="Search alerts"
              className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/50"
            />
          </div>

          {/* List */}
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Bell className="h-7 w-7 text-zinc-600" />
              <p className="text-sm font-semibold text-zinc-400">
                {alerts.length === 0 ? "No alerts — all clear 🌾" : "Nothing matches this filter"}
              </p>
              <p className="max-w-sm text-xs text-zinc-500">
                {alerts.length === 0
                  ? "New threshold crossings, pump events and disease detections will appear here live."
                  : "Try a different tab or clear the search box."}
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {visible.map((a) => {
                const meta = LEVEL_META[a.level];
                const source = getAlertSource(a);
                const link = getAlertLink(a);
                const expanded = expandedId === a.id;
                return (
                  <li key={a.id}>
                    <div
                      className={cn(
                        "rounded-xl border border-white/5 border-l-4 bg-black/30 transition-all hover:bg-black/50",
                        meta.border,
                        !a.read && "bg-white/[0.03]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          markAlertRead(a.id);
                          setExpandedId(expanded ? null : a.id);
                        }}
                        aria-expanded={expanded}
                        className="w-full p-3 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="flex min-w-0 items-center gap-1.5 text-[13px] font-bold text-white">
                            {!a.read && (
                              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
                            )}
                            <span className="truncate">
                              {meta.emoji} {a.title}
                            </span>
                          </p>
                          <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                            {formatRelativeTime(a.timestamp, now)}
                          </span>
                        </div>
                        <p className={cn("mt-0.5 text-xs text-zinc-400", !expanded && "line-clamp-2")}>
                          {a.message}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                              SOURCE_BADGE[source],
                            )}
                          >
                            {source}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              meta.badge,
                            )}
                          >
                            {meta.label}
                          </span>
                          {a.zone && (
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                              Zone {a.zone}
                            </span>
                          )}
                          <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-semibold text-zinc-500">
                            {expanded ? t("common.hide") : t("common.details")}
                            <ChevronDown
                              className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
                            />
                          </span>
                        </div>
                      </button>

                      {expanded && (
                        <div className="border-t border-white/5 px-3 py-3">
                          <p className="font-mono text-[11px] text-zinc-500">
                            {new Date(a.timestamp).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: true,
                            })}
                          </p>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <Link
                              href={link.href}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
                            >
                              {link.label} <ExternalLink className="h-4 w-4" strokeWidth={2.5} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => void handleForwardAlert(a)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-500/10 px-4 py-2.5 text-sm font-bold text-sky-200 transition-all hover:bg-sky-500/20 active:scale-[0.98]"
                            >
                              <Send className="h-4 w-4" /> Forward to Telegram
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </Rise>

      {/* ============ 2. TELEGRAM ALERTS ============ */}
      <Rise delay={0.06}>
        <Card>
          <CardHeader
            title={t("alertsPage.telegramTitle")}
            subtitle={
              telegram.enabled && telegram.botToken && telegram.chatId
                ? "ON — critical + warning alerts forward to your chat"
                : "Get farm alerts on your phone, free, in ~3 minutes"
            }
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                <Bot className="h-4 w-4" />
              </span>
            }
          />

          {/* Enable toggle */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">Forward alerts to Telegram</p>
              <p className="truncate text-[11px] text-zinc-500">
                {telegram.enabled ? "Pipeline live — new alerts POST to /api/telegram" : "Off — alerts stay in-app only"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={telegram.enabled}
              aria-label="Forward alerts to Telegram"
              onClick={() => updateSettings({ telegram: { enabled: !telegram.enabled } })}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                telegram.enabled ? "bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]" : "bg-white/10",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
                  telegram.enabled ? "left-6" : "left-1",
                )}
              />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Bot token (from @BotFather)
              </span>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={telegram.botToken}
                  onChange={(e) => updateSettings({ telegram: { botToken: e.target.value.trim() } })}
                  placeholder="1234567890:AAH…"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-3 pr-10 font-mono text-sm text-white outline-none transition-colors placeholder:font-sans placeholder:text-zinc-600 focus:border-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  aria-label={showToken ? "Hide token" : "Show token"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-white"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Chat ID (your Telegram user / group id)
              </span>
              <input
                value={telegram.chatId}
                onChange={(e) => updateSettings({ telegram: { chatId: e.target.value.trim() } })}
                placeholder="e.g. 987654321"
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm text-white outline-none transition-colors placeholder:font-sans placeholder:text-zinc-600 focus:border-emerald-500/50"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleTestConnection()}
              disabled={testing}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all active:scale-[0.98]",
                testing
                  ? "cursor-wait border border-white/10 bg-white/[0.04] text-zinc-400"
                  : "bg-emerald-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:bg-emerald-400",
              )}
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("common.testing")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" strokeWidth={2.5} /> {t("alertsPage.testConnection")}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                pushAlert({
                  level: "info",
                  title: "Test alert from Alert Center",
                  message: "The pushAlert pipeline works — toast shown, Telegram forwarded when enabled.",
                })
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-bold text-zinc-200 transition-all hover:border-emerald-500/40 hover:text-emerald-200 active:scale-[0.98]"
            >
              <FlaskConical className="h-4 w-4" /> {t("alertsPage.sendTest")}
            </button>
          </div>

          {/* Setup guide */}
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setGuideOpen((v) => !v)}
              aria-expanded={guideOpen}
              className="flex w-full items-center justify-between gap-2 bg-black/40 px-3 py-2.5 text-left text-sm font-bold text-white transition-colors hover:bg-black/60"
            >
              <span>📖 How to set up in 3 minutes</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform", guideOpen && "rotate-180")} />
            </button>
            {guideOpen && (
              <ol className="space-y-2.5 border-t border-white/5 bg-black/20 px-4 py-3 text-[13px] leading-relaxed text-zinc-300">
                <li>
                  <span className="font-bold text-white">1. Create a bot.</span> In Telegram, message{" "}
                  <span className="font-mono text-sky-300">@BotFather</span> → send{" "}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-emerald-200">/newbot</code>{" "}
                  → follow the prompts → copy the token it gives you.
                </li>
                <li>
                  <span className="font-bold text-white">2. Say hello.</span> Open your new bot in Telegram and send it any
                  message (e.g. “hi”) — Telegram only reveals chats that messaged first.
                </li>
                <li>
                  <span className="font-bold text-white">3. Find your chat ID.</span> Open this URL in a browser
                  (replace TOKEN with your bot token):
                  <code className="mt-1 block overflow-x-auto rounded-lg bg-white/[0.06] p-2 font-mono text-[11px] text-emerald-200">
                    https://api.telegram.org/botTOKEN/getUpdates
                  </code>
                  Look for <code className="font-mono text-[12px] text-emerald-200">{"\"chat\":{\"id\":123456789}"}</code> — that
                  number is your chat ID.
                </li>
                <li>
                  <span className="font-bold text-white">4. Paste both here</span> → flip the toggle ON → hit{" "}
                  <span className="font-semibold text-white">Test Connection</span>. ✅ lands in your chat.
                </li>
                <li className="rounded-lg border border-dashed border-white/10 p-2.5 text-[12px] text-zinc-400">
                  <span className="font-bold text-zinc-200">Production (Vercel):</span> add both values as environment
                  variables so alerts work without this browser:
                  <code className="mt-1 block rounded-lg bg-white/[0.06] p-2 font-mono text-[11px] text-emerald-200">
                    TELEGRAM_BOT_TOKEN=1234567890:AAH…{"\n"}TELEGRAM_CHAT_ID=987654321
                  </code>
                  The API route reads them automatically; the values pasted above act as a per-device override.
                </li>
              </ol>
            )}
          </div>
        </Card>
      </Rise>

      {/* ============ 3. ALERT RULES ============ */}
      <Rise delay={0.1}>
        <Card>
          <CardHeader
            title={t("alertsPage.rulesTitle")}
            subtitle="Trigger → channel → priority · thresholds edit live farm settings · toggles pause Telegram for that rule"
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
            }
          />

          {/* Desktop table header */}
          <div className="mb-2 hidden grid-cols-[1fr_170px_90px_130px_52px] items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 md:grid">
            <span>Trigger condition</span>
            <span>Channel</span>
            <span>Priority</span>
            <span>Threshold</span>
            <span className="text-right">Notify</span>
          </div>

          <ul className="space-y-2">
            {RULES.map((rule) => {
              const enabled = ruleOverrides[rule.id] !== false;
              const thresholdKey =
                rule.control.type === "threshold" ? rule.control.key : null;
              const fixedText = rule.control.type === "fixed" ? rule.control.text : null;
              return (
                <li
                  key={rule.id}
                  className={cn(
                    "grid grid-cols-1 gap-2 rounded-xl border border-white/5 bg-black/30 p-3 transition-opacity md:grid-cols-[1fr_170px_90px_130px_52px] md:items-center",
                    !enabled && "opacity-55",
                  )}
                >
                  <p className="text-[13px] font-semibold leading-snug text-white">{rule.trigger}</p>
                  <p className="text-xs text-zinc-400">
                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-600 md:hidden">
                      Channel
                    </span>
                    {rule.channel}
                  </p>
                  <p>
                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-600 md:hidden">
                      Priority
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        PRIORITY_BADGE[rule.priority],
                      )}
                    >
                      {rule.priority === "severity" ? "by severity" : rule.priority}
                    </span>
                  </p>
                  <div>
                    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-600 md:hidden">
                      Threshold
                    </span>
                    {thresholdKey ? (
                      <ThresholdInput
                        label={thresholdKey}
                        value={thresholds[thresholdKey]}
                        meta={THRESHOLD_META[thresholdKey]}
                        onChange={(v) => updateSettings({ thresholds: { [thresholdKey]: v } as Partial<Thresholds> })}
                      />
                    ) : rule.control.type === "severity" ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2 py-1.5 text-[11px] font-bold text-sky-200">
                        <AlertTriangle className="h-3.5 w-3.5" /> mild→info · med→warn · sev→crit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 font-mono text-[11px] text-zinc-400">
                        {rule.id === "pump-event" ? <Info className="h-3.5 w-3.5" /> : <Droplets className="h-3.5 w-3.5" />}
                        {fixedText}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    <span className="text-[11px] font-bold text-zinc-500 md:hidden">Telegram</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`Telegram notifications for: ${rule.trigger}`}
                      onClick={() => persistRules({ ...ruleOverrides, [rule.id]: !enabled })}
                      className={cn(
                        "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                        enabled ? "bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-white/10",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                          enabled ? "left-5" : "left-0.5",
                        )}
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Manual run-length threshold (not an alert rule, but lives with thresholds) */}
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-dashed border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <Thermometer className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
              <p className="text-xs leading-relaxed text-zinc-400">
                <span className="font-bold text-zinc-200">Default manual pump run</span> — how long the pump runs when you
                press ON without a timer.
              </p>
            </div>
            <ThresholdInput
              label="pumpDurationSec"
              value={thresholds.pumpDurationSec}
              meta={THRESHOLD_META.pumpDurationSec}
              onChange={(v) => updateSettings({ thresholds: { pumpDurationSec: v } })}
            />
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-600">
            <Wind className="h-3.5 w-3.5" />
            The simulation engine, KrishiGPT advisor and auto-pump relay all read these same values — edits apply instantly.
          </p>
        </Card>
      </Rise>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Threshold number input (synced with store settings.thresholds)      */
/* ------------------------------------------------------------------ */

function ThresholdInput({
  label,
  value,
  meta,
  onChange,
}: {
  label: string;
  value: number;
  meta: { unit: string; min: number; max: number; step: number };
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? String(value);

  const commit = (raw: string) => {
    setText(null);
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(n)) return;
    onChange(Math.min(meta.max, Math.max(meta.min, Math.round((n / meta.step)) * meta.step)));
  };

  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1 focus-within:border-emerald-500/50">
      <input
        value={shown}
        aria-label={`${label} threshold`}
        inputMode="decimal"
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-14 bg-transparent text-right font-mono text-[13px] font-bold text-white outline-none"
      />
      <span className="text-[11px] font-semibold text-zinc-500">{meta.unit}</span>
    </span>
  );
}
