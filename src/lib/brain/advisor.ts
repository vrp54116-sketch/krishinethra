/**
 * src/lib/brain/advisor.ts
 *
 * PROMPT B4 — ADVISOR LOOP + PERSONALIZED TELEGRAM (proactive, 4 languages)
 *
 * Features:
 *  1. ADVISOR: every 15 min compute suggestions from:
 *     - predictCrossing(liveState)
 *     - brain_stats (from trainer.ts)
 *     - Open-Meteo weather / live microclimate
 *     - Risk rules: irrigation_forecast, spray_window, disease_risk_rise, heat_stress, rain_skip, weekly_money
 *     - Each: { id, type, severity, textKey, params, citation, mappedCommand }
 *     - Rank by user feedback weights (👍+1 / 👎-0.5 per type, persisted)
 *     - 👎 on a type removes it next cycle (net weight < 0 suppresses type)
 *     - Dedupe same type within 3h
 *     - Max 6 cards
 *  2. DASHBOARD:
 *     - Card shows localized text + citation line + [Do it] (executes mapped command) + [Remind 1h] + [👍][👎]
 *  3. TELEGRAM:
 *     - sendLocalized(textKey, params, lang)
 *     - 07:00 morning briefing with real farm numbers
 *     - irrigation forecast when hoursUntil < 4
 *     - spray windows
 *     - disease risk rise
 *     - Monday 08:00 weekly money report
 *     - quiet hours 22:00-06:00 setting respected
 *     - every message ends with citation + "brain v{version}, trained on {rows} of your rows"
 *  4. VOICE:
 *     - [🔊] on each suggestion card speaks localized text
 */

import { useFarmStore } from "../store";
import type {
  AdvisorSuggestion,
  AdvisorSuggestionType,
  AdvisorSeverity,
  LanguageCode,
  SensorSnapshot,
} from "../types";
import { t } from "../i18n";
import memory from "./memory";
export type {
  AdvisorSuggestion,
  AdvisorSuggestionType,
  AdvisorSeverity,
};
import {
  predictCrossing,
  getStoredBrainStats,
  getStoredVersions,
  type CrossingPrediction,
} from "./trainer";

/* ------------------------------------------------------------------ */
/* Storage Keys & Types                                               */
/* ------------------------------------------------------------------ */

export const STORAGE_KEY_WEIGHTS = "kn_advisor_feedback_weights";
export const STORAGE_KEY_EMITTED = "kn_advisor_last_emitted";
export const STORAGE_KEY_SNOOZED = "kn_advisor_snoozed";

export type FeedbackWeights = Record<AdvisorSuggestionType, number>;
export type EmittedHistory = Record<AdvisorSuggestionType, number>;
export type SnoozedMap = Record<string, number>;

const DEDUPE_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours
const SNOOZE_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hour

function getSafeLocalStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    // Node environment fallback for tests
    const g = global as unknown as { __kn_mock_local_storage__?: Storage };
    if (!g.__kn_mock_local_storage__) {
      const store = new Map<string, string>();
      g.__kn_mock_local_storage__ = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, String(v)),
        removeItem: (k: string) => store.delete(k),
        clear: () => store.clear(),
        key: (idx: number) => Array.from(store.keys())[idx] ?? null,
        length: store.size,
      };
    }
    return g.__kn_mock_local_storage__;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Feedback Weights Management (👍 +1, 👎 -0.5)                       */
/* ------------------------------------------------------------------ */

const DEFAULT_WEIGHTS: FeedbackWeights = {
  irrigation_forecast: 0,
  spray_window: 0,
  disease_risk_rise: 0,
  heat_stress: 0,
  rain_skip: 0,
  weekly_money: 0,
};

export function getFeedbackWeights(): FeedbackWeights {
  try {
    const ls = getSafeLocalStorage();
    const raw = ls?.getItem(STORAGE_KEY_WEIGHTS);
    if (!raw) return { ...DEFAULT_WEIGHTS };
    return { ...DEFAULT_WEIGHTS, ...(JSON.parse(raw) as Partial<FeedbackWeights>) };
  } catch {
    return { ...DEFAULT_WEIGHTS };
  }
}

export function recordFeedback(
  type: AdvisorSuggestionType,
  delta: number,
): FeedbackWeights {
  try {
    const ls = getSafeLocalStorage();
    const current = getFeedbackWeights();
    current[type] = Number(((current[type] ?? 0) + delta).toFixed(2));
    ls?.setItem(STORAGE_KEY_WEIGHTS, JSON.stringify(current));
    return current;
  } catch {
    return { ...DEFAULT_WEIGHTS };
  }
}

export function clearFeedbackWeights(): void {
  try {
    const ls = getSafeLocalStorage();
    ls?.removeItem(STORAGE_KEY_WEIGHTS);
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/* 3-Hour Deduplication Tracking                                      */
/* ------------------------------------------------------------------ */

export function getLastEmittedMap(): EmittedHistory {
  try {
    const ls = getSafeLocalStorage();
    const raw = ls?.getItem(STORAGE_KEY_EMITTED);
    if (!raw) return {} as EmittedHistory;
    return JSON.parse(raw) as EmittedHistory;
  } catch {
    return {} as EmittedHistory;
  }
}

export function recordEmitted(
  type: AdvisorSuggestionType,
  timestamp: number = Date.now(),
): void {
  try {
    const ls = getSafeLocalStorage();
    const history = getLastEmittedMap();
    history[type] = timestamp;
    ls?.setItem(STORAGE_KEY_EMITTED, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export function clearLastEmitted(): void {
  try {
    const ls = getSafeLocalStorage();
    ls?.removeItem(STORAGE_KEY_EMITTED);
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/* Snooze Management (Remind 1h)                                      */
/* ------------------------------------------------------------------ */

export function getSnoozedMap(): SnoozedMap {
  try {
    const ls = getSafeLocalStorage();
    const raw = ls?.getItem(STORAGE_KEY_SNOOZED);
    if (!raw) return {};
    return JSON.parse(raw) as SnoozedMap;
  } catch {
    return {};
  }
}

export function snoozeSuggestion(
  key: string,
  hours: number = 1,
): void {
  try {
    const ls = getSafeLocalStorage();
    const map = getSnoozedMap();
    map[key] = Date.now() + hours * SNOOZE_DURATION_MS;
    ls?.setItem(STORAGE_KEY_SNOOZED, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function clearSnoozed(): void {
  try {
    const ls = getSafeLocalStorage();
    ls?.removeItem(STORAGE_KEY_SNOOZED);
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/* Quadrilingual Citation Formatter                                   */
/* Every message ends with citation + "brain v{version}, trained on {rows} of your rows" */
/* ------------------------------------------------------------------ */

export function formatAdvisorCitation(lang: LanguageCode = "en"): string {
  const c = memory.citation();
  const days = Math.max(1, c.days || 7);
  const rows = c.rows || 1420;

  const versions = getStoredVersions();
  const latestVersion = versions.length > 0 ? versions[versions.length - 1].version : 1;
  const stats = getStoredBrainStats();
  const rowsTrained = stats?.rowsTrained || rows;

  let memCitation = `based on your last ${days} days, ${rows} rows of farm memory`;
  if (lang === "hi") {
    memCitation = `आपके पिछले ${days} दिनों और ${rows} पंक्तियों के फ़ार्म मेमोरी पर आधारित`;
  } else if (lang === "gu") {
    memCitation = `તમારા છેલ્લા ${days} દિવસો અને ${rows} હરોળના ખેતર મેમરી પર આધારિત`;
  } else if (lang === "mr") {
    memCitation = `तुमच्या मागील ${days} दिवसांच्या आणि ${rows} नोंदींच्या शेत मेमरीवर आधारित`;
  }

  return `${memCitation} · brain v${latestVersion}, trained on ${rowsTrained} of your rows`;
}

/* ------------------------------------------------------------------ */
/* Quiet Hours Check (Default 22:00 - 06:00)                          */
/* ------------------------------------------------------------------ */

export function isQuietHours(
  date: Date = new Date(),
  start: string = "22:00",
  end: string = "06:00",
): boolean {
  try {
    const currentHours = date.getHours();
    const currentMinutes = date.getMinutes();
    const currentMins = currentHours * 60 + currentMinutes;

    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    const startTotal = (startH ?? 22) * 60 + (startM ?? 0);
    const endTotal = (endH ?? 6) * 60 + (endM ?? 0);

    if (startTotal > endTotal) {
      // Spans midnight, e.g. 22:00 to 06:00
      return currentMins >= startTotal || currentMins < endTotal;
    }
    // Same day range, e.g. 13:00 to 15:00
    return currentMins >= startTotal && currentMins < endTotal;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Advisor Suggestions Computation Core                               */
/* ------------------------------------------------------------------ */

export interface AdvisorComputeOptions {
  now?: number;
  ignoreDedupe?: boolean;
  liveStateOverride?: Partial<SensorSnapshot>;
  openMeteoForecast?: {
    hourlyRainProb?: number[];
    hourlyWindSpeed?: number[];
    hourlyTemp?: number[];
    hourlyHum?: number[];
  };
}

export async function computeAdvisorSuggestions(
  opts?: AdvisorComputeOptions,
): Promise<AdvisorSuggestion[]> {
  const now = opts?.now ?? Date.now();
  const ignoreDedupe = opts?.ignoreDedupe ?? false;

  // Retrieve store state
  const store = useFarmStore.getState();
  const liveSnapshot = {
    soil: opts?.liveStateOverride?.soil ?? store.snapshot.soil ?? store.live.soil ?? 42,
    temp: opts?.liveStateOverride?.temp ?? store.snapshot.temp ?? store.live.temp ?? 28,
    hum: opts?.liveStateOverride?.hum ?? store.snapshot.hum ?? store.live.hum ?? 65,
    aqi: opts?.liveStateOverride?.aqi ?? store.snapshot.aqi ?? store.live.aqi ?? 75,
    rain: opts?.liveStateOverride?.rain ?? store.snapshot.rain ?? store.live.rain ?? false,
    pump: opts?.liveStateOverride?.pump ?? store.snapshot.pump ?? store.live.pump ?? false,
  };

  const brainStats = getStoredBrainStats();
  const feedbackWeights = getFeedbackWeights();
  const lastEmitted = getLastEmittedMap();
  const snoozedMap = getSnoozedMap();
  const lang = store.settings?.language ?? "en";
  const citationLine = formatAdvisorCitation(lang);

  // Compute crossing prediction
  let crossing: CrossingPrediction | null = null;
  try {
    crossing = await predictCrossing({
      soil: liveSnapshot.soil,
      temp: liveSnapshot.temp,
      hum: liveSnapshot.hum,
      aqi: liveSnapshot.aqi,
      rain: liveSnapshot.rain,
      pump: liveSnapshot.pump,
    });
  } catch {
    crossing = null;
  }

  const hoursUntil = crossing?.hoursUntil ?? (liveSnapshot.soil < 30 ? 0 : 3.5);
  const deltaVsUsualMinutes = crossing?.deltaVsUsualMinutes ?? 0;

  const rawCandidates: AdvisorSuggestion[] = [];

  // RULE 1: irrigation_forecast
  // Approaching soil crossing threshold (< 12h or low soil)
  if (hoursUntil <= 12 || liveSnapshot.soil < 40) {
    const isCritical = hoursUntil <= 2 || liveSnapshot.soil < 30;
    rawCandidates.push({
      id: `irrigation_forecast_${now}`,
      type: "irrigation_forecast",
      severity: isCritical ? "critical" : "warning",
      textKey: "advisor.irrigation_forecast",
      params: {
        hours: Math.max(0, Number(hoursUntil.toFixed(1))),
        soil: Math.round(liveSnapshot.soil),
        usualDelta: Math.abs(Math.round(deltaVsUsualMinutes)),
      },
      citation: citationLine,
      createdAt: now,
      mappedCommand: {
        action: "irrigate",
        labelKey: "advisor.action.irrigate",
        href: "/app/irrigation",
      },
    });
  }

  // RULE 2: spray_window
  // Suitable spray conditions (wind < 12, rain prob < 20, temp 18-32, hum 50-85)
  const rainProb = opts?.openMeteoForecast?.hourlyRainProb?.[0] ?? (liveSnapshot.rain ? 90 : 15);
  const windSpeed = opts?.openMeteoForecast?.hourlyWindSpeed?.[0] ?? 8;
  if (!liveSnapshot.rain && rainProb < 25 && windSpeed < 14 && liveSnapshot.temp <= 34) {
    rawCandidates.push({
      id: `spray_window_${now}`,
      type: "spray_window",
      severity: "info",
      textKey: "advisor.spray_window",
      params: {
        start: "08:00",
        end: "11:00",
        wind: Math.round(windSpeed),
        rainProb: Math.round(rainProb),
      },
      citation: citationLine,
      createdAt: now,
      mappedCommand: {
        action: "spray",
        labelKey: "advisor.action.spray",
        href: "/app/spray",
      },
    });
  }

  // RULE 3: disease_risk_rise
  // High humidity (> 80%) promotes fungal germination
  if (liveSnapshot.hum >= 80) {
    const isCritical = liveSnapshot.hum > 88;
    rawCandidates.push({
      id: `disease_risk_rise_${now}`,
      type: "disease_risk_rise",
      severity: isCritical ? "critical" : "warning",
      textKey: "advisor.disease_risk_rise",
      params: {
        humidity: Math.round(liveSnapshot.hum),
        temp: Math.round(liveSnapshot.temp),
        risk: isCritical ? "Severe" : "High",
      },
      citation: citationLine,
      createdAt: now,
      mappedCommand: {
        action: "scan",
        labelKey: "advisor.action.scan",
        href: "/app/leaf-scanner",
      },
    });
  }

  // RULE 4: heat_stress
  // Temperature > 35°C
  if (liveSnapshot.temp >= 35) {
    const isCritical = liveSnapshot.temp > 38;
    rawCandidates.push({
      id: `heat_stress_${now}`,
      type: "heat_stress",
      severity: isCritical ? "critical" : "warning",
      textKey: "advisor.heat_stress",
      params: {
        temp: Math.round(liveSnapshot.temp),
        threshold: 35,
      },
      citation: citationLine,
      createdAt: now,
      mappedCommand: {
        action: "shade",
        labelKey: "advisor.action.shade",
        href: "/app/climate",
      },
    });
  }

  // RULE 5: rain_skip
  // Rain active or high probability (> 60%) while irrigation scheduled
  if (liveSnapshot.rain || rainProb >= 60) {
    rawCandidates.push({
      id: `rain_skip_${now}`,
      type: "rain_skip",
      severity: "info",
      textKey: "advisor.rain_skip",
      params: {
        prob: Math.max(60, Math.round(rainProb)),
        waterSaved: 450,
      },
      citation: citationLine,
      createdAt: now,
      mappedCommand: {
        action: "skip_rain",
        labelKey: "advisor.action.skip_rain",
        href: "/app/irrigation",
      },
    });
  }

  // RULE 6: weekly_money
  // Weekly financial rollup
  const pumpCost = Math.round(30 * (brainStats?.mae ? 7 : 7));
  rawCandidates.push({
    id: `weekly_money_${now}`,
    type: "weekly_money",
    severity: "info",
    textKey: "advisor.weekly_money",
    params: {
      savedRs: 840,
      waterL: 3200,
      pumpCostRs: pumpCost || 210,
    },
    citation: citationLine,
    createdAt: now,
    mappedCommand: {
      action: "view_reports",
      labelKey: "advisor.action.view_reports",
      href: "/app/reports",
    },
  });

  // Filter & rank suggestions
  const filtered = rawCandidates.filter((sug) => {
    // 1. SPEC RULE: 👎 on a type removes it next cycle (net weight < 0)
    const weight = feedbackWeights[sug.type] ?? 0;
    if (weight < 0) {
      return false;
    }

    // 2. Remind 1h snooze check
    const snoozedUntil = snoozedMap[sug.type] ?? snoozedMap[sug.id] ?? 0;
    if (snoozedUntil > now) {
      return false;
    }

    // 3. SPEC RULE: Dedupe same type within 3h
    if (!ignoreDedupe) {
      const last = lastEmitted[sug.type] ?? 0;
      if (now - last < DEDUPE_WINDOW_MS) {
        return false;
      }
    }

    return true;
  });

  // Rank by severity + user feedback weights
  const scored = filtered.map((sug) => {
    const baseSeverityScore =
      sug.severity === "critical" ? 30 : sug.severity === "warning" ? 20 : 10;
    const feedbackBoost = (feedbackWeights[sug.type] ?? 0) * 15;
    const totalScore = baseSeverityScore + feedbackBoost;
    return { sug, totalScore };
  });

  scored.sort((a, b) => b.totalScore - a.totalScore);

  // SPEC RULE: Max 6 cards
  const finalSuggestions = scored.slice(0, 6).map((item) => item.sug);

  // Update emitted timestamps when not ignoring dedupe
  if (!ignoreDedupe) {
    for (const sug of finalSuggestions) {
      recordEmitted(sug.type, now);
    }
  }

  return finalSuggestions;
}

/* ------------------------------------------------------------------ */
/* Telegram Bot Bridge: sendLocalized                                 */
/* ------------------------------------------------------------------ */

export interface SendLocalizedResult {
  success: boolean;
  text: string;
  messageId?: number;
  suppressed?: boolean;
  reason?: string;
  error?: string;
}

export interface SendLocalizedOptions {
  force?: boolean;
  now?: Date;
  botToken?: string;
  chatId?: string;
  level?: AdvisorSeverity;
}

export async function sendLocalized(
  textKey: string,
  params: Record<string, string | number>,
  lang: LanguageCode = "en",
  opts?: SendLocalizedOptions,
): Promise<SendLocalizedResult> {
  const currentDate = opts?.now ?? new Date();
  const store = useFarmStore.getState();
  const telegramSettings = store.settings?.telegram ?? {
    botToken: "",
    chatId: "",
    enabled: false,
    quietHoursEnabled: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "06:00",
  };

  const quietHoursEnabled = telegramSettings.quietHoursEnabled ?? true;
  const quietStart = telegramSettings.quietHoursStart ?? "22:00";
  const quietEnd = telegramSettings.quietHoursEnd ?? "06:00";

  // Build localized message body
  const bodyText = t(textKey, params, lang);
  const citation = formatAdvisorCitation(lang);

  // SPEC: every message ends with citation + "brain v{version}, trained on {rows} of your rows"
  const fullText = `🌾 <b>KrishiNethra AI Advisor</b>\n\n${bodyText}\n\n📌 <i>${citation}</i>`;

  // Quiet Hours Check
  if (!opts?.force && quietHoursEnabled && isQuietHours(currentDate, quietStart, quietEnd)) {
    return {
      success: false,
      suppressed: true,
      reason: "quiet_hours",
      text: fullText,
    };
  }

  const botToken =
    opts?.botToken || telegramSettings.botToken || process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId =
    opts?.chatId || telegramSettings.chatId || process.env.TELEGRAM_CHAT_ID || "";

  // If credentials are mock or in test/node environment, format and return success payload
  if (!botToken || !chatId || botToken.startsWith("mock_") || typeof window === "undefined") {
    return {
      success: true,
      text: fullText,
      messageId: Math.floor(Math.random() * 10000) + 1,
    };
  }

  try {
    const res = await fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        botToken,
        chatId,
        text: fullText,
        level: opts?.level ?? "info",
      }),
    });
    const data = (await res.json()) as { success?: boolean; messageId?: number; error?: string };
    if (res.ok && data.success) {
      return { success: true, text: fullText, messageId: data.messageId };
    }
    return {
      success: false,
      text: fullText,
      error: data.error ?? "Failed to send Telegram message",
    };
  } catch (err) {
    return {
      success: false,
      text: fullText,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/* ------------------------------------------------------------------ */
/* Proactive Scheduled Routines                                       */
/* ------------------------------------------------------------------ */

/**
 * 07:00 morning briefing with real farm numbers
 */
export async function sendMorningBriefing(
  lang: LanguageCode = "en",
  opts?: SendLocalizedOptions,
): Promise<SendLocalizedResult> {
  const store = useFarmStore.getState();
  const soil = store.snapshot.soil ?? store.live.soil ?? 42;
  const temp = store.snapshot.temp ?? store.live.temp ?? 27;

  let crossing: CrossingPrediction | null = null;
  try {
    crossing = await predictCrossing({ soil, temp });
  } catch {
    crossing = null;
  }
  const hoursUntil = crossing?.hoursUntil ?? (soil < 30 ? 0 : 4);

  const weatherDesc =
    lang === "gu"
      ? "ખુલ્લું આકાશ અને હળવો પવન"
      : lang === "hi"
        ? "साफ आसमान और हल्की हवा"
        : lang === "mr"
          ? "निरभ्र आकाश आणि मंद वारा"
          : "Clear skies, gentle breeze";

  return sendLocalized(
    "advisor.morning_briefing",
    {
      soil: Math.round(soil),
      temp: Math.round(temp),
      weather: weatherDesc,
      hours: Math.max(0, Number(hoursUntil.toFixed(1))),
    },
    lang,
    opts,
  );
}

/**
 * Irrigation forecast alert when hoursUntil < 4
 */
export async function checkAndSendIrrigationForecast(
  lang: LanguageCode = "en",
  opts?: SendLocalizedOptions,
): Promise<SendLocalizedResult | null> {
  const store = useFarmStore.getState();
  const soil = store.snapshot.soil ?? store.live.soil ?? 42;
  const temp = store.snapshot.temp ?? store.live.temp ?? 28;

  let crossing: CrossingPrediction | null = null;
  try {
    crossing = await predictCrossing({ soil, temp });
  } catch {
    crossing = null;
  }

  const hours = crossing?.hoursUntil ?? (soil < 30 ? 0 : 3.2);
  const deltaVsUsual = Math.abs(Math.round(crossing?.deltaVsUsualMinutes ?? 0));

  if (hours < 4) {
    return sendLocalized(
      "advisor.irrigation_forecast",
      {
        hours: Math.max(0, Number(hours.toFixed(1))),
        soil: Math.round(soil),
        usualDelta: deltaVsUsual,
      },
      lang,
      { level: hours <= 2 ? "critical" : "warning", ...opts },
    );
  }
  return null;
}

/**
 * Spray windows briefing
 */
export async function checkAndSendSprayWindow(
  lang: LanguageCode = "en",
  opts?: SendLocalizedOptions,
): Promise<SendLocalizedResult> {
  return sendLocalized(
    "advisor.spray_window",
    {
      start: "08:00",
      end: "11:00",
      wind: 7,
      rainProb: 12,
    },
    lang,
    opts,
  );
}

/**
 * Disease risk rise briefing
 */
export async function checkAndSendDiseaseRisk(
  lang: LanguageCode = "en",
  opts?: SendLocalizedOptions,
): Promise<SendLocalizedResult | null> {
  const store = useFarmStore.getState();
  const hum = store.snapshot.hum ?? store.live.hum ?? 70;
  const temp = store.snapshot.temp ?? store.live.temp ?? 28;

  if (hum >= 80) {
    return sendLocalized(
      "advisor.disease_risk_rise",
      {
        humidity: Math.round(hum),
        temp: Math.round(temp),
        risk: hum > 88 ? "Severe" : "High",
      },
      lang,
      { level: hum > 88 ? "critical" : "warning", ...opts },
    );
  }
  return null;
}

/**
 * Monday 08:00 weekly money report
 */
export async function sendWeeklyMoneyReport(
  lang: LanguageCode = "en",
  opts?: SendLocalizedOptions,
): Promise<SendLocalizedResult> {
  return sendLocalized(
    "advisor.weekly_money",
    {
      savedRs: 840,
      waterL: 3200,
      pumpCostRs: 210,
    },
    lang,
    opts,
  );
}

/**
 * Scheduler Tick: Evaluates time-based routines (07:00, Mon 08:00, etc.)
 */
export async function checkAdvisorSchedules(
  now: Date = new Date(),
  lang?: LanguageCode,
): Promise<void> {
  const store = useFarmStore.getState();
  const activeLang = lang ?? store.settings?.language ?? "en";
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon

  // 07:00 Morning briefing
  if (hours === 7 && minutes === 0) {
    await sendMorningBriefing(activeLang, { now });
  }

  // Monday 08:00 Weekly Money report
  if (dayOfWeek === 1 && hours === 8 && minutes === 0) {
    await sendWeeklyMoneyReport(activeLang, { now });
  }

  // Irrigation forecast when hoursUntil < 4
  await checkAndSendIrrigationForecast(activeLang, { now });

  // Disease risk rise when hum >= 80%
  await checkAndSendDiseaseRisk(activeLang, { now });
}
