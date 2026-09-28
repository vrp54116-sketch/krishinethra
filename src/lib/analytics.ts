/**
 * KrishiNethra AI — Client Analytics Stub
 * Logs events to console and records event counters in localStorage
 * so that event counts {try_krishinethra, reclaim_mine, queue_signup}
 * can be inspected in Settings > Diagnostics.
 */

export type AnalyticsEventName =
  | "try_krishinethra"
  | "reclaim_mine"
  | "queue_signup";

export interface AnalyticsCounters {
  try_krishinethra: number;
  reclaim_mine: number;
  queue_signup: number;
  total: number;
  lastEvent?: AnalyticsEventName;
  lastTimestamp?: string;
}

export const ANALYTICS_STORAGE_KEY = "krishinethra_analytics_counters";
const STORAGE_PREFIX = "krishinethra_analytics_";

/**
 * Reads the current analytics counters from localStorage.
 */
export function getAnalyticsCounts(): AnalyticsCounters {
  if (typeof window === "undefined") {
    return {
      try_krishinethra: 0,
      reclaim_mine: 0,
      queue_signup: 0,
      total: 0,
    };
  }

  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        try_krishinethra: Number(parsed.try_krishinethra) || 0,
        reclaim_mine: Number(parsed.reclaim_mine) || 0,
        queue_signup: Number(parsed.queue_signup) || 0,
        total:
          Number(parsed.total) ||
          (Number(parsed.try_krishinethra) || 0) +
            (Number(parsed.reclaim_mine) || 0) +
            (Number(parsed.queue_signup) || 0),
        lastEvent: parsed.lastEvent,
        lastTimestamp: parsed.lastTimestamp,
      };
    }
  } catch (err) {
    console.error("[Analytics] Error reading counters from localStorage:", err);
  }

  // Fallback to checking individual keys if legacy
  const try_k = Number(localStorage.getItem(`${STORAGE_PREFIX}try_krishinethra`)) || 0;
  const rec_m = Number(localStorage.getItem(`${STORAGE_PREFIX}reclaim_mine`)) || 0;
  const q_s = Number(localStorage.getItem(`${STORAGE_PREFIX}queue_signup`)) || 0;

  return {
    try_krishinethra: try_k,
    reclaim_mine: rec_m,
    queue_signup: q_s,
    total: try_k + rec_m + q_s,
  };
}

/**
 * Logs an analytics event to console and increments localStorage counters.
 */
export function logAnalyticsEvent(
  eventName: AnalyticsEventName,
  payload?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();

  // 1. Log to console
  console.log(`[KrishiNethra Analytics] event="${eventName}"`, {
    event: eventName,
    timestamp,
    ...payload,
  });

  if (typeof window === "undefined") return;

  try {
    const current = getAnalyticsCounts();
    const updated: AnalyticsCounters = {
      ...current,
      [eventName]: (current[eventName] || 0) + 1,
      total: (current.total || 0) + 1,
      lastEvent: eventName,
      lastTimestamp: timestamp,
    };

    // 2. Persist to localStorage
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(`${STORAGE_PREFIX}${eventName}`, String(updated[eventName]));
    localStorage.setItem(`${STORAGE_PREFIX}total`, String(updated.total));

    // 3. Dispatch window event for live subscribers (Settings > Diagnostics)
    window.dispatchEvent(
      new CustomEvent("krishinethra:analytics", {
        detail: { event: eventName, counters: updated },
      })
    );
  } catch (err) {
    console.error("[Analytics] Error updating localStorage:", err);
  }
}

/**
 * Resets all analytics counters back to zero.
 */
export function resetAnalyticsCounts(): void {
  if (typeof window === "undefined") return;
  try {
    const empty: AnalyticsCounters = {
      try_krishinethra: 0,
      reclaim_mine: 0,
      queue_signup: 0,
      total: 0,
    };
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(empty));
    localStorage.removeItem(`${STORAGE_PREFIX}try_krishinethra`);
    localStorage.removeItem(`${STORAGE_PREFIX}reclaim_mine`);
    localStorage.removeItem(`${STORAGE_PREFIX}queue_signup`);
    localStorage.removeItem(`${STORAGE_PREFIX}total`);

    console.log("[KrishiNethra Analytics] Counters reset to 0");

    window.dispatchEvent(
      new CustomEvent("krishinethra:analytics", {
        detail: { event: "reset", counters: empty },
      })
    );
  } catch (err) {
    console.error("[Analytics] Error resetting analytics counters:", err);
  }
}
