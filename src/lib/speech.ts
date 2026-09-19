"use client";

/**
 * speech.ts
 * Central speechSynthesis helper for KrishiNethra voice output.
 *
 * - Prefers hi-IN / en-IN (or gu-IN / mr-IN) voices when available.
 * - rate 0.95 for a calm, clear delivery.
 * - Cancels any previous utterance before starting a new one.
 */

export type SpeechLang = string; // e.g. "hi-IN" | "en-IN" | "gu-IN" | "mr-IN"

/** Map a store language code ("en" | "hi" | "gu" | "mr") to a BCP-47 voice lang. */
export function settingsLangToSpeechLang(settingsLang: string): SpeechLang {
  switch (settingsLang) {
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

/** True when the Web Speech synthesis API exists in this browser. */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.speechSynthesis?.speak === "function"
  );
}

/**
 * Pick the best available voice for `lang`.
 * Priority: exact match → same-language prefix → hi-IN → en-IN → default.
 */
function pickVoice(
  synth: SpeechSynthesis,
  lang: string,
): SpeechSynthesisVoice | null {
  try {
    const voices = synth.getVoices?.() ?? [];
    if (voices.length === 0) return null;
    const exact = voices.find((v) => v.lang === lang);
    if (exact) return exact;
    const prefix = lang.slice(0, 2).toLowerCase();
    const sameLang = voices.find((v) =>
      v.lang?.toLowerCase().startsWith(prefix),
    );
    if (sameLang) return sameLang;
    // Spec: prefer hi-IN / en-IN voices when available.
    const hi = voices.find((v) => v.lang === "hi-IN");
    if (hi && (prefix === "hi" || prefix === "mr" || prefix === "gu"))
      return hi;
    const enIn = voices.find((v) => v.lang === "en-IN");
    if (enIn) return enIn;
    const en = voices.find((v) => v.lang?.toLowerCase().startsWith("en"));
    return en ?? voices[0] ?? null;
  } catch {
    return null;
  }
}

/** Warm up the async voice list (Chrome loads voices lazily). */
export function warmUpVoices(): void {
  try {
    if (!isSpeechSupported()) return;
    const synth = window.speechSynthesis;
    // Touch the list now; Chrome fires voiceschanged when ready.
    synth.getVoices();
    if (typeof synth.onvoiceschanged !== "undefined") {
      const noop = () => undefined;
      // Don't clobber an existing handler — just ensure the list loads.
      if (synth.onvoiceschanged == null) synth.onvoiceschanged = noop;
    }
  } catch {
    /* speech must never crash the app */
  }
}

export interface SpeakOptions {
  /** BCP-47 lang, e.g. "hi-IN". Defaults to "en-IN". */
  lang?: string;
  /** Speech rate. Defaults to 0.95 per spec. */
  rate?: number;
  /** Callbacks for UI state (speaking indicator). */
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

/**
 * Speak `text` aloud. Cancels any previous utterance first.
 * No-op (returns false) when unsupported or text is empty.
 * Returns true when an utterance was queued.
 */
export function speakText(text: string, opts?: SpeakOptions): boolean {
  try {
    if (!text || !text.trim()) return false;
    if (!isSpeechSupported()) return false;
    const synth = window.speechSynthesis;
    // Cancel previous utterance before starting a new one (spec).
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = opts?.lang ?? "en-IN";
    utter.rate = opts?.rate ?? 0.95;
    const voice = pickVoice(synth, utter.lang);
    if (voice) utter.voice = voice;
    if (opts?.onStart) utter.onstart = () => opts.onStart?.();
    if (opts?.onEnd) utter.onend = () => opts.onEnd?.();
    utter.onerror = () => opts?.onError?.();
    synth.speak(utter);
    return true;
  } catch {
    try {
      opts?.onError?.();
    } catch {
      /* ignore */
    }
    return false;
  }
}

/** Stop any in-progress speech. Safe to call when unsupported. */
export function stopSpeaking(): void {
  try {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
