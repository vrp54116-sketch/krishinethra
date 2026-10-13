/**
 * src/lib/brain/engine.ts
 *
 * PROMPT B3 — KNOWLEDGE BRAIN: Quad-Language Instant Answer Engine
 *
 * Answer Pipeline Order:
 *  1. Intent Classification: if conf >= 0.6 -> KB template in current language,
 *     filled with LIVE farm values + memory.citation() + predictCrossing() where relevant.
 *     Badge: BRAIN (moss green).
 *  2. Learned Entry Lookup: fuzzy string similarity against kn_learned_entries.
 *     Badge: LEARNED (gold).
 *  3. Gemini Fallback: calls /api/gemini with badge GEMINI (muted).
 *     On Gemini success: triggers capture loop (one translate call to /api/gemini/translate),
 *     stores learned entry, adds intent examples, increments brainLearnedFromYou.
 *     Next time, answers offline with badge LEARNED!
 */

import { classify } from "./classifier";
import { getKBEntry, type KBEntry } from "./kb";
import { getIntentDefinition } from "./intents";
import { findLearnedMatch, saveLearnedEntry, type LearnedEntry } from "./learned";
import memory from "./memory";
import { predictCrossing, type CrossingPrediction } from "./trainer";
import { useFarmStore } from "../store";

export type AnswerBadge = "BRAIN" | "LEARNED" | "GEMINI";

export interface AnswerResult {
  text: string;
  badge: AnswerBadge;
  latencyMs: number;
  intent?: string;
  confidence?: number;
  offline: boolean;
  learnedId?: string;
}

export interface FarmLiveContext {
  soil: number;
  temp: number;
  hum: number;
  aqi: number;
  rain: boolean;
  pump: boolean;
  mode: string;
}

/**
 * Format localized memory citation string:
 * "based on your last N days, M rows"
 */
export function formatCitation(days: number, rows: number, lang: string): string {
  const d = Math.max(1, days);
  switch (lang) {
    case "hi":
      return `आपके पिछले ${d} दिनों और ${rows} पंक्तियों के फ़ार्म मेमोरी पर आधारित`;
    case "gu":
      return `તમારા છેલ્લા ${d} દિવસો અને ${rows} હરોળના ખેતર મેમરી પર આધારિત`;
    case "mr":
      return `तुमच्या मागील ${d} दिवसांच्या आणि ${rows} नोंदींच्या शेत मेमरीवर आधारित`;
    case "en":
    default:
      return `based on your last ${d} days, ${rows} rows of farm memory`;
  }
}

/**
 * Format localized predictCrossing string.
 */
export function formatCrossing(cross: CrossingPrediction | null, soil: number, lang: string): string {
  if (soil < 30) {
    switch (lang) {
      case "hi":
        return "मिट्टी की नमी 30% सीमा से नीचे है, तुरंत सिंचाई करें";
      case "gu":
        return "જમીનમાં ભેજ 30% થી ઓછો છે, તાત્કાલિક પિયત આપવું જરૂરી છે";
      case "mr":
        return "जमिनीतला ओलावा 30% च्या खाली गेला आहे, ताबडतोब पाणी द्या";
      case "en":
      default:
        return "soil is already below the 30% moisture threshold, irrigation needed immediately";
    }
  }

  if (!cross) {
    switch (lang) {
      case "hi":
        return "फ़ार्म ब्रेन मॉडल के अनुसार मिट्टी में अभी पर्याप्त नमी है";
      case "gu":
        return "ફાર્મ બ્રેઈન મોડેલ અનુસાર જમીનમાં હાલ પૂરતો ભેજ સંગ્રહાયેલો છે";
      case "mr":
        return "फार्म ब्रेन मॉडेलनुसार जमिनीत सध्या पुरेसा ओलावा आहे";
      case "en":
      default:
        return "soil moisture is currently adequate according to your farm brain";
    }
  }

  const hours = cross.hoursUntil;
  const timeStr = new Date(cross.crossTs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  switch (lang) {
    case "hi":
      return `अनुमान है कि मिट्टी की नमी लगभग ${hours.toFixed(1)} घंटे में (लगभग ${timeStr} बजे) 30% सीमा पर पहुंचेगी`;
    case "gu":
      return `અંદાજ મુજબ જમીનનો ભેજ આશરે ${hours.toFixed(1)} કલાકમાં (આશરે ${timeStr} વાગ્યે) 30% ની સપાટીએ પહોંચશે`;
    case "mr":
      return `अंदाजानुसार जमिनीतला ओलावा सुमारे ${hours.toFixed(1)} तासांत (${timeStr} वाजता) 30% च्या पातळीवर पोहोचेल`;
    case "en":
    default:
      return `soil predicted to cross the 30% moisture threshold in ~${hours.toFixed(1)}h (around ${timeStr})`;
  }
}

/**
 * Replace placeholders in template text with live farm values, citation, and predictions.
 */
export function fillTemplate(
  template: string,
  context: FarmLiveContext,
  citationStr: string,
  crossingStr: string,
  lang: string,
): string {
  const pumpStr = context.pump
    ? lang === "gu"
      ? "ચાલુ છે"
      : lang === "hi"
        ? "चालू है"
        : lang === "mr"
          ? "सुरू आहे"
          : "RUNNING"
    : lang === "gu"
      ? "બંધ છે"
      : lang === "hi"
        ? "बंद है"
        : lang === "mr"
          ? "बंद आहे"
          : "OFF";

  let out = template
    .replace(/\{\{soil\}\}/g, Math.round(context.soil).toString())
    .replace(/\{\{temp\}\}/g, (Math.round(context.temp * 10) / 10).toString())
    .replace(/\{\{hum\}\}/g, Math.round(context.hum).toString())
    .replace(/\{\{aqi\}\}/g, Math.round(context.aqi).toString())
    .replace(/\{\{pump\}\}/g, pumpStr)
    .replace(/\{\{mode\}\}/g, context.mode)
    .replace(/\{\{crossing\}\}/g, crossingStr)
    .replace(/\{\{citation\}\}/g, citationStr);

  // If citation placeholder was missing, append it naturally
  if (!template.includes("{{citation}}") && citationStr) {
    out += ` [${citationStr}]`;
  }

  return out;
}

/**
 * Capture loop: Asynchronously translates a question & answer pair
 * via one Gemini translate call into all 4 languages, stores the learned entry,
 * adds dynamic intent examples, and increments brainLearnedFromYou.
 */
export async function captureLearnedEntry(
  question: string,
  answer: string,
  sourceLang: string,
): Promise<void> {
  try {
    const res = await fetch("/api/gemini/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: question, a: answer, sourceLang }),
    });

    if (res.ok) {
      const payload = (await res.json()) as {
        q: { en: string; hi: string; gu: string; mr: string };
        a: { en: string; hi: string; gu: string; mr: string };
      };

      if (payload.q && payload.a) {
        const newEntry: LearnedEntry = {
          id: `learned-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          q: payload.q,
          a: payload.a,
          createdAt: Date.now(),
          hits: 1,
        };

        await saveLearnedEntry(newEntry);

        // Update brainLearnedFromYou in store
        const store = useFarmStore.getState();
        if (typeof store.incrementBrainLearned === "function") {
          store.incrementBrainLearned();
        }

        // Add dynamic examples to classifier
        const classifier = (await import("./classifier")).default;
        for (const l of ["en", "hi", "gu", "mr"] as const) {
          if (payload.q[l]) {
            classifier.addDynamicIntentExample(payload.q[l], l, newEntry.id);
          }
        }

        // Log brain learn event to memory
        void memory.logEvent({
          type: "brain_train",
          payload: {
            action: "learned_qa_captured",
            id: newEntry.id,
            q: question,
            sourceLang,
          },
        });
      }
    }
  } catch (err) {
    console.warn("Capture loop translate failed", err);
  }
}

/**
 * Main Answer Engine:
 * Evaluates the query in order:
 *  (a) Intent classification with conf >= 0.6 -> KB template with LIVE values + memory.citation() + predictCrossing() -> BRAIN (moss)
 *  (b) Learned-entry lookup (fuzzy match) -> LEARNED (gold)
 *  (c) Gemini fallback -> GEMINI (muted); triggers background capture loop
 */
export async function answerQuestion(
  question: string,
  lang: string,
  context: FarmLiveContext,
  options?: {
    eli5?: boolean;
    history?: Array<{ role: "user" | "assistant"; text: string }>;
  },
): Promise<AnswerResult> {
  const startTime = performance.now();
  const normalizedQ = question.trim();
  const currentLang = (["en", "hi", "gu", "mr"].includes(lang) ? lang : "en") as
    | "en"
    | "hi"
    | "gu"
    | "mr";

  // -----------------------------------------------------------------
  // (a) INTENT CLASSIFICATION: conf >= 0.6
  // -----------------------------------------------------------------
  try {
    const { intent, conf } = await classify(normalizedQ, currentLang);

    if (conf >= 0.6) {
      const intentDef = getIntentDefinition(intent);
      const kbId = intentDef?.kbId ?? intent;
      const kbEntry = getKBEntry(kbId);

      if (kbEntry) {
        // Fetch citation synchronously / cached
        const c = memory.citation();
        const citationStr = formatCitation(c.days, c.rows, currentLang);

        // Fetch crossing prediction
        let cross: CrossingPrediction | null = null;
        try {
          cross = await predictCrossing({
            soil: context.soil,
            temp: context.temp,
            hum: context.hum,
            aqi: context.aqi,
          });
        } catch {
          // ignore
        }

        const crossingStr = formatCrossing(cross, context.soil, currentLang);
        const rawTemplate = kbEntry.texts[currentLang] || kbEntry.texts.en;
        const text = fillTemplate(rawTemplate, context, citationStr, crossingStr, currentLang);

        const latencyMs = Math.max(1, Math.round(performance.now() - startTime));

        return {
          text,
          badge: "BRAIN",
          latencyMs,
          intent,
          confidence: conf,
          offline: true,
        };
      }
    }
  } catch (intentErr) {
    console.warn("Intent classifier error in engine", intentErr);
  }

  // -----------------------------------------------------------------
  // (b) LEARNED ENTRY LOOKUP (fuzzy string similarity)
  // -----------------------------------------------------------------
  try {
    const learnedMatch = await findLearnedMatch(normalizedQ, currentLang, 0.55);
    if (learnedMatch && learnedMatch.entry) {
      const answerText =
        learnedMatch.entry.a[currentLang] || learnedMatch.entry.a.en;
      const latencyMs = Math.max(1, Math.round(performance.now() - startTime));

      return {
        text: answerText,
        badge: "LEARNED",
        latencyMs,
        confidence: learnedMatch.score,
        learnedId: learnedMatch.entry.id,
        offline: true,
      };
    }
  } catch (learnedErr) {
    console.warn("Learned entry lookup error in engine", learnedErr);
  }

  // -----------------------------------------------------------------
  // (c) GEMINI FALLBACK with BADGE GEMINI
  // -----------------------------------------------------------------
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: normalizedQ,
        history: options?.history?.map(({ role, text }) => ({ role, text })),
        eli5: options?.eli5,
        lang: currentLang,
        context,
      }),
    });

    const payload = (await response.json()) as { reply?: string; error?: string };
    if (!response.ok || !payload.reply) {
      throw new Error(payload.error || "Gemini unreachable");
    }

    const reply = payload.reply;
    const latencyMs = Math.round(performance.now() - startTime);

    // On Gemini success for unknown question: trigger capture loop in background
    void captureLearnedEntry(normalizedQ, reply, currentLang);

    return {
      text: reply,
      badge: "GEMINI",
      latencyMs,
      offline: false,
    };
  } catch (geminiErr) {
    // If Gemini is unreachable / network is OFF, fallback to closest offline KB entry
    console.warn("Gemini fallback unreachable, returning general offline brain answer", geminiErr);

    const c = memory.citation();
    const citationStr = formatCitation(c.days, c.rows, currentLang);
    const helloEntry = getKBEntry("hello");
    const fallbackTemplate =
      helloEntry?.texts[currentLang] ||
      helloEntry?.texts.en ||
      "KrishiNethra Farm Brain is offline and monitoring your crop.";
    const text = fillTemplate(fallbackTemplate, context, citationStr, "", currentLang);
    const latencyMs = Math.max(1, Math.round(performance.now() - startTime));

    return {
      text,
      badge: "BRAIN",
      latencyMs,
      offline: true,
    };
  }
}
