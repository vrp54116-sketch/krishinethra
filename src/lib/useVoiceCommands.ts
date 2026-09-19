"use client";

/**
 * useVoiceCommands.ts
 * Global voice command layer for KrishiNethra AI.
 *
 * - webkitSpeechRecognition (fallback to SpeechRecognition):
 *   continuous = false, interimResults = true, lang from settings.
 * - Substring command table in Hindi (roman + Devanagari) + English.
 * - Executes farm actions via the zustand store, speaks confirmations
 *   through the speechSynthesis helper (rate 0.95, hi-IN/en-IN voices).
 * - Shared recent-commands log (localStorage, all hook instances see it).
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFarmStore } from "./store";
import { generateDailyReport } from "./ai-engine";
import {
  settingsLangToSpeechLang,
  speakText,
  stopSpeaking,
  warmUpVoices,
} from "./speech";

/* ------------------------------------------------------------------ */
/* SpeechRecognition typings (not in TS DOM lib)                       */
/* ------------------------------------------------------------------ */

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike> & { length: number };
  error?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionEventLike & { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | SpeechRecognitionCtor
    | undefined;
  return typeof ctor === "function" ? ctor : null;
}

export function isVoiceSupported(): boolean {
  return getRecognitionCtor() != null;
}

/* ------------------------------------------------------------------ */
/* Command table                                                       */
/* ------------------------------------------------------------------ */

export type VoiceCommandKey =
  | "pump-on"
  | "pump-off"
  | "scan"
  | "report"
  | "status"
  | "water"
  | "weather"
  | "alerts"
  | "map"
  | "help"
  | "unknown";

export interface VoiceCommandResult {
  key: VoiceCommandKey;
  /** What will be spoken (and shown) as the confirmation. */
  spoken: string;
  /** Client route to navigate to, if any. */
  navigateTo?: string;
  success: boolean;
}

function containsAny(haystack: string, needles: string[]): boolean {
  for (const n of needles) {
    if (n && haystack.includes(n)) return true;
  }
  return false;
}

const PUMP_ON_PHRASES = [
  "pump chalu karo",
  "pump chalu",
  "pump on karo",
  "motor chalu",
  "turn on pump",
  "start pump",
  "start the pump",
  "switch on pump",
  "pump start",
  "pump on",
  "पंप चालू",
  "पंप चालु",
  "मोटर चालू",
  "पंप ऑन",
];

const PUMP_OFF_PHRASES = [
  "pump band karo",
  "pump band",
  "motor band",
  "turn off pump",
  "stop pump",
  "stop the pump",
  "switch off pump",
  "pump stop",
  "pump off",
  "पंप बंद",
  "मोटर बंद",
  "पंप ऑफ",
];

const SCAN_PHRASES = [
  "rog scan karo",
  "rog scan",
  "scan disease",
  "leaf scan",
  "scan leaf",
  "scan karo",
  "पत्ती स्कैन",
  "पत्ता स्कैन",
  "रोग स्कैन",
  "स्कैन करो",
  "स्कैन",
];

const REPORT_PHRASES = [
  "report sunao",
  "aaj ki report",
  "aaj ka report",
  "daily report",
  "आज की रिपोर्ट",
  "आज का रिपोर्ट",
  "रिपोर्ट सुनाओ",
  "रिपोर्ट सुन",
];

const STATUS_PHRASES = [
  "sthiti batao",
  "khet ki sthiti",
  "farm status",
  "farm health",
  "khet ka haal",
  "khet ka hal",
  "स्थिति बताओ",
  "खेत की स्थिति",
  "खेत का हाल",
];

const WATER_PHRASES = [
  "paani kitna",
  "pani kitna",
  "water usage",
  "how much water",
  "tank kitna",
  "पानी कितना",
  "टंकी कितना",
  "पानी का उपयोग",
];

const WEATHER_PHRASES = [
  "mausam batao",
  "mausam",
  "weather",
  "मौसम",
  "बारिश",
];

const ALERTS_PHRASES = [
  "alert dikhao",
  "alerts dikhao",
  "show alerts",
  "alerts kholo",
  "open alerts",
  "अलर्ट दिखाओ",
  "चेतावनी दिखाओ",
];

const MAP_PHRASES = [
  "map kholo",
  "open map",
  "khet ka naksha",
  "मैप खोलो",
  "नक्शा खोलो",
  "नक्शा",
];

const HELP_PHRASES = [
  "krishinethra help",
  "krishnethra help",
  "krishnetra help",
  "krishi help",
  "command list",
  "commands",
  "madad",
  "help",
  "कमांड",
  "सहायता",
];

/** UI reference table (command → what it does, in both languages). */
export interface VoiceCommandInfo {
  id: VoiceCommandKey;
  enSay: string;
  hiSay: string;
  enDoes: string;
  hiDoes: string;
}

export const VOICE_COMMAND_REFERENCE: VoiceCommandInfo[] = [
  {
    id: "pump-on",
    enSay: "turn on pump",
    hiSay: "पंप चालू करो",
    enDoes: "Runs the pump for the default duration",
    hiDoes: "पंप डिफ़ॉल्ट समय तक चलाता है",
  },
  {
    id: "pump-off",
    enSay: "stop pump",
    hiSay: "पंप बंद करो",
    enDoes: "Stops the pump immediately",
    hiDoes: "पंप तुरंत बंद करता है",
  },
  {
    id: "scan",
    enSay: "scan disease",
    hiSay: "रोग स्कैन करो",
    enDoes: "Opens the camera leaf scanner",
    hiDoes: "कैमरा पत्ती स्कैनर खोलता है",
  },
  {
    id: "report",
    enSay: "daily report",
    hiSay: "आज की रिपोर्ट सुनाओ",
    enDoes: "Speaks today's AI farm report",
    hiDoes: "आज की AI खेत रिपोर्ट सुनाता है",
  },
  {
    id: "status",
    enSay: "farm status",
    hiSay: "स्थिति बताओ",
    enDoes: "Speaks health score, moisture, temp, alerts",
    hiDoes: "स्वास्थ्य स्कोर, नमी, तापमान, चेतावनी बताता है",
  },
  {
    id: "water",
    enSay: "water usage",
    hiSay: "पानी कितना",
    enDoes: "Speaks today's litres used + tank level",
    hiDoes: "आज का पानी + टंकी स्तर बताता है",
  },
  {
    id: "weather",
    enSay: "weather",
    hiSay: "मौसम बताओ",
    enDoes: "Speaks temperature, humidity, rain chance",
    hiDoes: "तापमान, नमी, बारिश की संभावना बताता है",
  },
  {
    id: "alerts",
    enSay: "show alerts",
    hiSay: "अलर्ट दिखाओ",
    enDoes: "Opens the alerts page",
    hiDoes: "चेतावनी पेज खोलता है",
  },
  {
    id: "map",
    enSay: "open map",
    hiSay: "मैप खोलो",
    enDoes: "Opens the farm map",
    hiDoes: "खेत का नक्शा खोलता है",
  },
  {
    id: "help",
    enSay: "commands",
    hiSay: "मदद",
    enDoes: "Lists all voice commands aloud",
    hiDoes: "सभी आवाज़ कमांड बोलकर बताता है",
  },
];

/* ------------------------------------------------------------------ */
/* Command executor (pure-ish: reads store, fires pump actions)        */
/* ------------------------------------------------------------------ */

/**
 * Match a transcript against the command table and run the farm action.
 * `recLang` is the BCP-47 recognition lang ("hi-IN" | "en-IN" …) and
 * decides whether confirmations are spoken in Hindi or English.
 */
export function executeVoiceCommand(
  transcript: string,
  recLang: string,
): VoiceCommandResult {
  const said = transcript.toLowerCase().trim();
  const s = useFarmStore.getState();
  const settings = s.settings;
  const snap = s.snapshot;
  const hindi = !recLang.toLowerCase().startsWith("en");
  const unread = s.alerts.filter((a) => !a.read).length;

  // --- Pump ON ---
  if (containsAny(said, PUMP_OFF_PHRASES)) {
    s.setPumpManual(false);
    return {
      key: "pump-off",
      spoken: hindi ? "पंप बंद कर दिया है।" : "Pump turned off.",
      success: true,
    };
  }
  if (containsAny(said, PUMP_ON_PHRASES)) {
    const duration = settings.thresholds.pumpDurationSec;
    s.setPumpManual(true, duration);
    return {
      key: "pump-on",
      spoken: hindi
        ? `पंप चालू कर दिया है। ${duration} सेकंड तक चलेगा।`
        : `Pump turned on for ${duration} seconds.`,
      success: true,
    };
  }

  // --- Leaf scan → camera scanner tab ---
  if (containsAny(said, SCAN_PHRASES)) {
    return {
      key: "scan",
      spoken: hindi
        ? "पत्ती स्कैनर खोल रहा हूँ।"
        : "Opening leaf scanner.",
      navigateTo: "/camera?tab=scanner",
      success: true,
    };
  }

  // --- Daily report ---
  if (containsAny(said, REPORT_PHRASES)) {
    const report = generateDailyReport({
      snapshot: s.snapshot,
      zones: s.zones,
      settings: s.settings,
      farmHealthScore: s.farmHealthScore,
      totalWaterUsedL: s.totalWaterUsedL,
      tasks: s.tasks,
      scans: s.scans,
      alerts: s.alerts,
      pump: s.pump,
      sensorHistory: s.sensorHistory,
      diary: s.diary,
      sprayPlans: s.sprayPlans,
    });
    return { key: "report", spoken: report, success: true };
  }

  // --- Farm status summary ---
  if (containsAny(said, STATUS_PHRASES)) {
    const health = Math.round(s.farmHealthScore);
    const moistureB = snap.soilMoistureB.toFixed(1);
    const temp = snap.tempC.toFixed(1);
    return {
      key: "status",
      spoken: hindi
        ? `खेत स्वास्थ्य ${health}, Zone B नमी ${moistureB} प्रतिशत, तापमान ${temp} डिग्री, ${unread} चेतावनी।`
        : `Farm health ${health} out of 100. Zone B moisture ${moistureB} percent, temperature ${temp} degrees, ${unread} unread alerts.`,
      success: true,
    };
  }

  // --- Water usage ---
  if (containsAny(said, WATER_PHRASES)) {
    const liters = s.totalWaterUsedL.toFixed(2);
    const tank = snap.tankLevelPercent.toFixed(0);
    return {
      key: "water",
      spoken: hindi
        ? `आज ${liters} लीटर पानी इस्तेमाल हुआ है, टंकी ${tank} प्रतिशत भरी है।`
        : `Today you used ${liters} litres of water. The tank is at ${tank} percent.`,
      success: true,
    };
  }

  // --- Alerts ---
  if (containsAny(said, ALERTS_PHRASES)) {
    return {
      key: "alerts",
      spoken: hindi
        ? `चेतावनी खोल रहा हूँ। ${unread} नई चेतावनी हैं।`
        : `Opening alerts. You have ${unread} unread alerts.`,
      navigateTo: "/alerts",
      success: true,
    };
  }

  // --- Map ---
  if (containsAny(said, MAP_PHRASES)) {
    return {
      key: "map",
      spoken: hindi
        ? "खेत का नक्शा खोल रहा हूँ।"
        : "Opening farm map.",
      navigateTo: "/map",
      success: true,
    };
  }

  // --- Weather ---
  if (containsAny(said, WEATHER_PHRASES)) {
    const temp = snap.tempC.toFixed(1);
    const hum = snap.humidity.toFixed(1);
    const rain = snap.rainMm.toFixed(1);
    let chanceEn = "low rain chance";
    let chanceHi = "बारिश की संभावना कम है";
    if (snap.rainMm > 0.2) {
      chanceEn = "rain is falling right now";
      chanceHi = "अभी बारिश हो रही है";
    } else if (snap.humidity > 75) {
      chanceEn = "high rain chance";
      chanceHi = "बारिश की संभावना ज़्यादा है";
    } else if (snap.humidity > 60) {
      chanceEn = "slight rain chance";
      chanceHi = "हल्की बारिश हो सकती है";
    }
    return {
      key: "weather",
      spoken: hindi
        ? `तापमान ${temp} डिग्री, नमी ${hum} प्रतिशत, बारिश ${rain} मिलीमीटर — ${chanceHi}।`
        : `Temperature ${temp} degrees, humidity ${hum} percent, rain ${rain} millimetres — ${chanceEn}.`,
      success: true,
    };
  }

  // --- Help / command list ---
  if (containsAny(said, HELP_PHRASES)) {
    return {
      key: "help",
      spoken: hindi
        ? "आप बोल सकते हैं: पंप चालू करो, पंप बंद करो, रोग स्कैन करो, रिपोर्ट सुनाओ, स्थिति बताओ, पानी कितना, मौसम, अलर्ट दिखाओ, मैप खोलो।"
        : "You can say: turn on pump, turn off pump, scan disease, daily report, farm status, water usage, weather, show alerts, open map.",
      success: true,
    };
  }

  // --- Fallback ---
  return {
    key: "unknown",
    spoken: hindi
      ? "समझ नहीं आया। कृपया फिर से बोलें, या कमांड सूची के लिए मदद बोलें।"
      : "Sorry, I did not catch that. Try again, or say commands for the list.",
    success: false,
  };
}

/* ------------------------------------------------------------------ */
/* Shared recent-commands log                                          */
/* ------------------------------------------------------------------ */

export interface VoiceLogEntry {
  id: string;
  transcript: string;
  response: string;
  success: boolean;
  timestamp: number;
}

const LOG_STORAGE_KEY = "krishinethra-voice-log-v1";
const LOG_MAX = 20;

let globalLog: VoiceLogEntry[] = [];
let logHydrated = false;
const logListeners = new Set<() => void>();

function hydrateLog(): void {
  if (logHydrated || typeof window === "undefined" || typeof localStorage === "undefined")
    return;
  logHydrated = true;
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      globalLog = parsed
        .filter(
          (e): e is VoiceLogEntry =>
            !!e &&
            typeof e === "object" &&
            typeof (e as VoiceLogEntry).transcript === "string" &&
            typeof (e as VoiceLogEntry).timestamp === "number",
        )
        .slice(0, LOG_MAX);
    }
  } catch {
    globalLog = [];
  }
}

function persistLog(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(globalLog));
  } catch {
    /* storage must never crash voice */
  }
}

function subscribeLog(listener: () => void): () => void {
  logListeners.add(listener);
  return () => {
    logListeners.delete(listener);
  };
}

function getLogSnapshot(): VoiceLogEntry[] {
  hydrateLog();
  return globalLog;
}

function getLogServerSnapshot(): VoiceLogEntry[] {
  return globalLog;
}

function makeLogId(): string {
  return `voice-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export function pushVoiceLog(entry: Omit<VoiceLogEntry, "id" | "timestamp"> & Partial<Pick<VoiceLogEntry, "id" | "timestamp">>): VoiceLogEntry {
  hydrateLog();
  const full: VoiceLogEntry = {
    id: entry.id ?? makeLogId(),
    timestamp: entry.timestamp ?? Date.now(),
    transcript: entry.transcript,
    response: entry.response,
    success: entry.success,
  };
  globalLog = [full, ...globalLog].slice(0, LOG_MAX);
  persistLog();
  for (const l of [...logListeners]) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
  return full;
}

export function clearVoiceLog(): void {
  globalLog = [];
  persistLog();
  for (const l of [...logListeners]) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

/* ------------------------------------------------------------------ */
/* Friendly recognition errors                                         */
/* ------------------------------------------------------------------ */

export function friendlyVoiceError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone blocked — allow mic access in the browser address bar, then try again.";
    case "audio-capture":
      return "No microphone found on this device.";
    case "no-speech":
      return "No speech heard — speak a little louder and try again.";
    case "network":
      return "Speech service needs internet — check your connection and retry.";
    case "aborted":
      return "Listening stopped.";
    default:
      return code ? `Voice error (${code}) — please try again.` : "Voice error — please try again.";
  }
}

/* ------------------------------------------------------------------ */
/* The hook                                                            */
/* ------------------------------------------------------------------ */

export type VoiceStatus =
  | "idle"
  | "listening"
  | "processing"
  | "done"
  | "error"
  | "unsupported";

export interface UseVoiceCommandsOptions {
  /** BCP-47 override (e.g. from the /voice language selector). Defaults to settings language. */
  lang?: string;
  /** Called after a command executes (after navigation decision + speech). */
  onResult?: (result: VoiceCommandResult & { transcript: string }) => void;
  /** Called on recognition / permission errors with a friendly message. */
  onError?: (message: string, code: string) => void;
  /** Speak confirmations automatically (still gated on settings.voiceOutput). Default true. */
  autoSpeak?: boolean;
}

export interface UseVoiceCommandsResult {
  listening: boolean;
  status: VoiceStatus;
  /** Live transcript: final + interim while listening. */
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  /** Last spoken confirmation / result text. */
  response: string;
  error: string | null;
  isSupported: boolean;
  /** Effective BCP-47 recognition lang in use. */
  recLang: string;
  log: VoiceLogEntry[];
  startListening: () => void;
  stopListening: () => void;
  /** Speak arbitrary text with the effective lang (rate 0.95). */
  speak: (text: string) => boolean;
  stopSpeaking: () => void;
}

export function useVoiceCommands(
  options?: UseVoiceCommandsOptions,
): UseVoiceCommandsResult {
  const settingsLanguage = useFarmStore((s) => s.settings.language);

  const [isSupported] = useState<boolean>(() => isVoiceSupported());
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  const log = useSyncExternalStore(subscribeLog, getLogSnapshot, getLogServerSnapshot);

  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const autoSpeak = options?.autoSpeak ?? true;

  const effectiveLang =
    options?.lang ?? settingsLangToSpeechLang(settingsLanguage);
  // Latest-value refs (synced in effects, never written during render).
  const langRef = useRef(effectiveLang);
  const onResultRef = useRef(options?.onResult);
  const onErrorRef = useRef(options?.onError);
  const autoSpeakRef = useRef(autoSpeak);

  useEffect(() => {
    langRef.current = effectiveLang;
  }, [effectiveLang]);
  useEffect(() => {
    onResultRef.current = options?.onResult;
  }, [options?.onResult]);
  useEffect(() => {
    onErrorRef.current = options?.onError;
  }, [options?.onError]);
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  // Warm up synthesis voices once (Chrome loads them async).
  useEffect(() => {
    warmUpVoices();
  }, []);

  // Abort recognition on unmount so the mic LED never sticks on.
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    };
  }, []);

  // Capability never changes mid-session — derive instead of syncing state.
  const displayStatus: VoiceStatus = !isSupported ? "unsupported" : status;

  const stopListening = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore — onend will settle state */
    }
  }, []);

  const speak = useCallback(
    (text: string): boolean => speakText(text, { lang: langRef.current }),
    [],
  );

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      const msg = "Voice not supported in this browser — try Chrome on Android or desktop.";
      setError(msg);
      setStatus("unsupported");
      onErrorRef.current?.(msg, "unsupported");
      return;
    }
    if (recRef.current) return; // already listening — single shot

    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setFinalTranscript("");
    finalRef.current = "";
    interimRef.current = "";

    let rec: SpeechRecognitionInstance;
    try {
      rec = new Ctor();
    } catch {
      const msg = "Could not start the microphone — check browser permissions.";
      setError(msg);
      setStatus("error");
      onErrorRef.current?.(msg, "start-failed");
      return;
    }

    // Spec: single-shot recognition with live interim results.
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = langRef.current;
    rec.maxAlternatives = 1;

    rec.onresult = (ev) => {
      let interim = "";
      let fin = "";
      try {
        for (let i = 0; i < ev.results.length; i++) {
          const r = ev.results[i];
          const text = r?.[0]?.transcript ?? "";
          if (!text) continue;
          if (r.isFinal) fin += text;
          else interim += text;
        }
      } catch {
        /* keep whatever we gathered */
      }
      finalRef.current = fin ? `${finalRef.current} ${fin}`.trim() : finalRef.current;
      interimRef.current = interim;
      const live = `${finalRef.current} ${interim}`.trim();
      setFinalTranscript(finalRef.current);
      setInterimTranscript(interim);
      setTranscript(live);
    };

    rec.onerror = (ev) => {
      const code = typeof ev?.error === "string" ? ev.error : "unknown";
      // "aborted" fires on intentional stop() — not an error worth surfacing.
      if (code === "aborted") {
        recRef.current = null;
        setListening(false);
        setStatus((prev) => (prev === "listening" ? "idle" : prev));
        return;
      }
      const msg = friendlyVoiceError(code);
      recRef.current = null;
      setListening(false);
      setError(msg);
      setStatus("error");
      onErrorRef.current?.(msg, code);
    };

    rec.onend = () => {
      recRef.current = null;
      setListening(false);
      const said = `${finalRef.current} ${interimRef.current}`.trim();
      if (!said) {
        // Silence — back to idle without logging noise.
        setStatus((prev) => (prev === "listening" ? "idle" : prev));
        return;
      }
      setStatus("processing");
      // Execute synchronously so pump actions feel instant.
      let result: VoiceCommandResult;
      try {
        result = executeVoiceCommand(said, langRef.current);
      } catch {
        result = {
          key: "unknown",
          spoken: "Something went wrong running that command — please try again.",
          success: false,
        };
      }
      setResponse(result.spoken);
      setStatus("done");
      pushVoiceLog({
        transcript: said,
        response: result.spoken,
        success: result.success,
      });
      // Speak the confirmation when voice output is enabled.
      try {
        const voiceOn = useFarmStore.getState().settings.voiceOutput;
        if (autoSpeakRef.current && voiceOn) {
          speakText(result.spoken, { lang: langRef.current });
        }
      } catch {
        /* speech must never break commands */
      }
      onResultRef.current?.({ ...result, transcript: said });
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
      setStatus("listening");
    } catch {
      recRef.current = null;
      const msg = "Could not start the microphone — check browser permissions.";
      setError(msg);
      setStatus("error");
      onErrorRef.current?.(msg, "start-failed");
    }
  }, []);

  return {
    listening,
    status: displayStatus,
    transcript,
    interimTranscript,
    finalTranscript,
    response,
    error,
    isSupported,
    recLang: effectiveLang,
    log,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
