"use client";

/**
 * notifications.ts
 * Central alert pipeline for KrishiNethra AI.
 *
 * pushAlert(alert) is the ONE entry point for UI-initiated alerts. It:
 *  1. adds the alert to the zustand store,
 *  2. shows a level-colored sonner toast,
 *  3. plays a soft WebAudio beep for critical alerts (no audio files),
 *  4. POSTs to /api/telegram when settings.telegram.enabled is on.
 *
 * Engine alerts (simulation tick, disease scans, pump guards) are created
 * inside store.ts and bypass pushAlert to avoid a store <-> lib import
 * cycle. The <AlertPipelineListener /> export below subscribes to the
 * store and runs the same toast + beep + telegram side-effects for those
 * background alerts — exactly once per alert id.
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useFarmStore } from "./store";
import type { Alert } from "./types";

export type PushAlertInput = Omit<Alert, "id" | "timestamp" | "read"> &
  Partial<Pick<Alert, "id" | "timestamp" | "read">>;

export type AlertSource = "Jal Agent" | "Rog Agent" | "Vayu Agent" | "System";

/* ------------------------------------------------------------------ */
/* Id bookkeeping — prevents double toast for pushAlert() callers      */
/* ------------------------------------------------------------------ */

/** Ids already announced by pushAlert(); the pipeline listener skips these. */
const announcedIds = new Set<string>();
/** Ids the background listener has already processed. */
const pipelineSeenIds = new Set<string>();

function makeId(): string {
  try {
    if (
      typeof crypto !== "undefined" &&
      "randomUUID" in crypto &&
      typeof crypto.randomUUID === "function"
    ) {
      return `alert-${crypto.randomUUID()}`;
    }
  } catch {
    /* fall through */
  }
  return `alert-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/* ------------------------------------------------------------------ */
/* Source badge + deep-link helpers                                    */
/* ------------------------------------------------------------------ */

const JAL_RE = /moisture|irrigat|pump|tank|water|flow/i;
const ROG_RE = /disease|pest|aphid|rust|spot|fungal|leaf|spray|crop doctor|blight|mildew/i;
const VAYU_RE = /temperatur|humidity|aqi|air quality|weather|rain|climate|heat|humid/i;
const TASK_RE = /task|fertilizer|schedule/i;

export function getAlertSource(alert: Pick<Alert, "title" | "message">): AlertSource {
  const text = `${alert.title} ${alert.message}`;
  if (JAL_RE.test(text)) return "Jal Agent";
  if (ROG_RE.test(text)) return "Rog Agent";
  if (VAYU_RE.test(text)) return "Vayu Agent";
  return "System";
}

export function getAlertLink(alert: Pick<Alert, "title" | "message">): {
  href: string;
  label: string;
} {
  const text = `${alert.title} ${alert.message}`;
  if (JAL_RE.test(text)) return { href: "/irrigation", label: "Open Irrigation" };
  if (ROG_RE.test(text)) return { href: "/camera", label: "Open Crop Doctor" };
  if (VAYU_RE.test(text)) return { href: "/climate", label: "Open Climate" };
  if (TASK_RE.test(text)) return { href: "/tasks", label: "Open Tasks" };
  return { href: "/dashboard", label: "Open Dashboard" };
}

/* ------------------------------------------------------------------ */
/* Soft critical beep — WebAudio oscillator, no audio files             */
/* ------------------------------------------------------------------ */

export function playCriticalBeep(): void {
  try {
    if (typeof window === "undefined") return;
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const play = (freq: number, startAt: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      // Soft envelope: quick fade-in, gentle fade-out (no clicks / harshness).
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.36);
    };
    const t0 = ctx.currentTime + 0.01;
    play(880, t0); // A5
    play(660, t0 + 0.38); // E5 — gentle two-tone "dee-doo"
    // Release the context shortly after the beeps finish.
    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, 1500);
  } catch {
    /* Audio must never crash the app. */
  }
}

/* ------------------------------------------------------------------ */
/* Per-rule Telegram gating (managed on the /alerts RULES table)       */
/* ------------------------------------------------------------------ */

/** localStorage key for the per-rule enable map (ruleId -> boolean). */
export const ALERT_RULE_STORAGE_KEY = "krishinethra-alert-rules-v1";

/**
 * Map an alert to its RULES-table rule id by title. Returns null for
 * alerts that don't belong to a toggleable rule (always forwarded).
 */
export function ruleIdForAlert(
  alert: Pick<Alert, "title">,
): string | null {
  const t = alert.title.toLowerCase();
  if (t.includes("critical soil moisture")) return "soil-critical";
  if (t.includes("low soil moisture")) return "soil-low";
  if (t.includes("high temperature")) return "temp-high";
  if (t.includes("poor air quality")) return "aqi-high";
  if (t.includes("low water tank")) return "tank-low";
  if (t.includes("pump blocked")) return "pump-blocked";
  if (t.includes("pump started") || t.includes("pump turned")) return "pump-event";
  if (t.includes("disease detected")) return "disease";
  return null;
}

/** A rule forwards to Telegram unless explicitly toggled off on /alerts. */
export function isTelegramRuleEnabled(ruleId: string | null): boolean {
  try {
    if (!ruleId) return true;
    if (typeof localStorage === "undefined") return true;
    const raw = localStorage.getItem(ALERT_RULE_STORAGE_KEY);
    if (!raw) return true;
    const map = JSON.parse(raw) as Record<string, unknown>;
    return map[ruleId] !== false;
  } catch {
    return true;
  }
}

/* ------------------------------------------------------------------ */
/* Telegram fire-and-forget                                            */
/* ------------------------------------------------------------------ */

function postToTelegram(alert: Alert): void {
  try {
    if (typeof window === "undefined") return;
    if (!isTelegramRuleEnabled(ruleIdForAlert(alert))) return;
    const telegram = useFarmStore.getState().settings.telegram;
    if (!telegram?.enabled) return;
    if (!telegram.botToken || !telegram.chatId) return;
    void fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        botToken: telegram.botToken,
        chatId: telegram.chatId,
        level: alert.level,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp,
      }),
    }).catch(() => undefined);
  } catch {
    /* Telegram must never crash the app. */
  }
}

/* ------------------------------------------------------------------ */
/* Level-colored toast                                                 */
/* ------------------------------------------------------------------ */

function showAlertToast(alert: Alert): void {
  try {
    const link = getAlertLink(alert);
    const action = {
      label: link.label,
      onClick: () => {
        window.location.href = link.href;
      },
    };
    if (alert.level === "critical") {
      toast.error(alert.title, { description: alert.message, action });
    } else if (alert.level === "warning") {
      toast.warning(alert.title, { description: alert.message, action });
    } else {
      toast.success(alert.title, { description: alert.message, action });
    }
  } catch {
    /* Toast must never crash the app. */
  }
}

/** Run toast + beep + telegram for one fully-formed alert. Never throws. */
export function announceAlert(alert: Alert): void {
  try {
    showAlertToast(alert);
    // Sound toggle lives in Settings → Alerts (default ON).
    try {
      const soundOn = useFarmStore.getState().settings.soundEnabled;
      if (alert.level === "critical" && soundOn !== false) playCriticalBeep();
    } catch {
      if (alert.level === "critical") playCriticalBeep();
    }
    postToTelegram(alert);
    // Browser notifications (opt-in via Settings → Alerts).
    try {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const n = new Notification(alert.title, { body: alert.message });
        window.setTimeout(() => n.close(), 6000);
      }
    } catch {
      /* notifications are best-effort */
    }
  } catch {
    /* never crash */
  }
}

/* ------------------------------------------------------------------ */
/* pushAlert — the central function                                    */
/* ------------------------------------------------------------------ */

/**
 * Add an alert to the store + toast + beep (critical) + Telegram
 * (when enabled). Always returns the alert id. Never throws.
 */
export function pushAlert(input: PushAlertInput): string {
  try {
    const id = input.id ?? makeId();
    announcedIds.add(id);
    useFarmStore.getState().addAlert({ ...input, id });
    const full =
      useFarmStore.getState().alerts.find((a) => a.id === id) ??
      ({
        id,
        level: input.level,
        title: input.title,
        message: input.message,
        timestamp: input.timestamp ?? Date.now(),
        read: input.read ?? false,
      } satisfies Alert);
    announceAlert(full);
    return id;
  } catch {
    // Last-resort: still try to store the alert without side-effects.
    try {
      return useFarmStore.getState().addAlert({ ...input });
    } catch {
      return `alert-dropped-${Date.now()}`;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Background pipeline listener — engine alerts → toast/telegram       */
/* ------------------------------------------------------------------ */

/**
 * Subscribes to the farm store and announces every NEW alert that did
 * not come through pushAlert() (simulation ticks, disease scans, pump
 * guards). Mount once at the app root. Renders nothing.
 */
export function AlertPipelineListener() {
  const primed = useRef(false);

  useEffect(() => {
    // Prime with current ids so reloads don't re-announce history.
    if (!primed.current) {
      primed.current = true;
      for (const a of useFarmStore.getState().alerts) pipelineSeenIds.add(a.id);
    }
    const unsub = useFarmStore.subscribe((s) => {
      for (const alert of s.alerts) {
        if (pipelineSeenIds.has(alert.id) || announcedIds.has(alert.id)) {
          pipelineSeenIds.add(alert.id);
          continue;
        }
        pipelineSeenIds.add(alert.id);
        announceAlert(alert);
      }
      // Bound the bookkeeping sets so a long session can't leak memory.
      if (pipelineSeenIds.size > 500) {
        const keep = s.alerts.map((a) => a.id);
        for (const id of [...pipelineSeenIds]) {
          if (!keep.includes(id)) pipelineSeenIds.delete(id);
        }
      }
      if (announcedIds.size > 500) {
        const keep = new Set(s.alerts.map((a) => a.id));
        for (const id of [...announcedIds]) {
          if (!keep.has(id)) announcedIds.delete(id);
        }
      }
    });
    return unsub;
  }, []);

  return null;
}
