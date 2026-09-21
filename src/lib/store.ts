/**
 * store.ts
 * ONE zustand store for KrishiNethra AI with persist middleware
 * (localStorage key "krishinethra-v1").
 *
 * Holds the whole farm in SIMULATION mode: settings, zones, live snapshot,
 * sensor history, pump, alerts, disease scans, diary, tasks, spray plans,
 * chat and the computed farm health score. A 1-second interval drives the
 * simulation engine so everything updates live, and it auto-starts whenever
 * the app loads with settings.mode === "simulation".
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Alert,
  AppSettings,
  ChatMessage,
  DailySummary,
  DiaryEntry,
  DiseaseScan,
  LanguageCode,
  PumpState,
  SensorHistoryPoint,
  SensorSnapshot,
  SprayPlan,
  Task,
  Zone,
} from "./types";
import {
  ALERT_DEDUP_WINDOW_MS,
  computeFarmHealthScore,
  computeZoneStatus,
  createInitialSnapshot,
  diseaseAlert,
  evaluateAutoPump,
  generateAlerts,
  makeAlert,
  tick,
  uid,
  zoneStatusForMoisture,
  ZONE_A_BASELINE,
  ZONE_B_BASELINE,
} from "./simulation-engine";
import {
  fetchHwSensors,
  fetchHwStatus,
  sendHwPump,
  sendHwServo,
} from "./hw-client";

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

function todayISO(): string {
  return isoDate(new Date());
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  mode: "simulation",
  hardwareGatewayUrl: "",
  mqttToken: "patelfarm01",
  mqttBrokerUrl: "wss://broker.emqx.io:8084/mqtt",
  cameraSource: "simulation",
  cameraStreamUrl: "",
  cameraPanSpeed: 5,
  thresholds: {
    moistureLow: 30,
    moistureHigh: 75,
    tempHigh: 35,
    humidityLow: 40,
    aqiHigh: 150,
    tankLow: 20,
    pumpDurationSec: 10,
  },
  voiceOutput: true,
  voiceLang: "hi-IN",
  soundEnabled: true,
  irrigationSchedule: [
    { id: "sched-mon", day: 1, time: "06:00", durationMin: 8 },
    { id: "sched-thu", day: 4, time: "06:00", durationMin: 8 },
  ],
  location: {
    latitude: 23.02,
    longitude: 72.57,
    label: "Ahmedabad",
  },
  farmProfile: {
    farmName: "Patel Farm",
    farmerName: "",
    phone: "",
    role: "Farmer",
    avatar: "🧑‍🌾",
    state: "Gujarat",
    district: "Ahmedabad",
    village: "",
    location: null,
    farmSizeAcres: 1,
    size: 1,
    sizeUnit: "Acres",
    soilType: "Black cotton",
    waterSource: "Borewell",
    irrigationMethod: "Drip",
    powerSource: "Electricity",
    hasPump: true,
    crops: ["tomato", "chili", "spinach"],
  },
  /** Live mandi source — Settings → Data Sources can override without env vars. */
  dataGovApiKey: "",
  commodityResourceId: "9ef84268-d588-465a-a308-a864a43d0070",
  telegram: {
    botToken: "",
    chatId: "",
    enabled: false,
  },
};

function seedZones(): Zone[] {
  return [
    {
      id: "A",
      name: "Zone A",
      crop: "Tomato",
      soilMoisture: ZONE_A_BASELINE,
      status: "healthy",
    },
    {
      id: "B",
      name: "Zone B",
      crop: "Chili",
      soilMoisture: ZONE_B_BASELINE,
      status: "warning",
    },
    {
      id: "C",
      name: "Zone C",
      crop: "Spinach",
      soilMoisture: Math.round(((ZONE_A_BASELINE + ZONE_B_BASELINE) / 2) * 10) / 10,
      status: "warning",
    },
  ];
}

function seedDiary(): DiaryEntry[] {
  return [
    {
      id: uid("diary"),
      date: daysAgo(1),
      type: "irrigation",
      details:
        "Irrigated Zone B (Chili) for 12 min — soil moisture rose from 21% to 38%.",
      zone: "B",
    },
    {
      id: uid("diary"),
      date: daysAgo(3),
      type: "fertilizer",
      details:
        "Applied vermicompost 10 kg + neem cake 2 kg in Zone A (Tomato) before evening irrigation.",
      zone: "A",
    },
    {
      id: uid("diary"),
      date: daysAgo(5),
      type: "disease",
      details:
        "Aphids spotted on Spinach leaves in Zone C — started neem-oil spray schedule.",
      zone: "C",
    },
    {
      id: uid("diary"),
      date: daysAgo(7),
      type: "general",
      details:
        "Soil pH tested 6.8 — healthy range. Tank cleaned and refilled to full.",
    },
  ];
}

function seedTasks(): Task[] {
  return [
    {
      id: uid("task"),
      title: "Irrigate Zone B — moisture below 30%",
      priority: "high",
      dueDate: todayISO(),
      done: false,
      source: "ai",
      zone: "B",
    },
    {
      id: uid("task"),
      title: "Apply neem spray Zone C — Aphids Day 2",
      priority: "high",
      dueDate: todayISO(),
      done: false,
      source: "ai",
      zone: "C",
    },
    {
      id: uid("task"),
      title: "Inspect Zone C spinach leaves for pests",
      priority: "medium",
      dueDate: todayISO(),
      done: false,
      source: "ai",
      zone: "C",
    },
    {
      id: uid("task"),
      title: "Refill fertilizer stock — urea running low",
      priority: "low",
      dueDate: tomorrowISO(),
      done: false,
      source: "ai",
    },
    {
      id: uid("task"),
      title: "Morning field scouting — all zones",
      priority: "medium",
      dueDate: daysAgo(1),
      done: true,
      source: "manual",
      completedAt: Date.now() - 26 * 3600 * 1000,
    },
  ];
}

function seedSprayPlans(): SprayPlan[] {
  return [
    {
      id: uid("spray"),
      disease: "Aphids",
      zone: "C",
      startDate: daysAgo(1),
      steps: [
        {
          day: 1,
          action: "Mix 5 ml neem oil per litre of water + spray leaf undersides",
          done: true,
        },
        { day: 2, action: "Observe leaves — count aphids on 10 sample plants", done: false },
        { day: 3, action: "Second neem-oil spray in the cool evening hours", done: false },
        { day: 5, action: "Final spray + check for ladybird (natural predator) activity", done: false },
        { day: 7, action: "Review infestation level and close or extend the plan", done: false },
      ],
      status: "active",
    },
  ];
}

function seedScans(now: number): DiseaseScan[] {
  const day = 24 * 3600 * 1000;
  return [
    {
      id: uid("scan"),
      timestamp: now - 1 * day - 3 * 3600 * 1000,
      source: "sample",
      imageName: "spinach-leaf-aphids.jpg",
      disease: "Aphids (pest)",
      confidence: 0.91,
      severity: "mild",
      affectedPercent: 8,
      severityGrid: [
        [0, 0, 1, 0, 0, 0],
        [0, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 0],
        [0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ],
      treatmentNatural: [
        "Spray 5 ml neem oil per litre of water on leaf undersides in the evening",
        "Release ladybird beetles — natural aphid predators — near Zone C",
      ],
      treatmentChemical: [
        "If infestation crosses 15%: Imidacloprid 17.8% SL @ 0.3 ml/L (evening spray)",
      ],
      resolved: false,
    },
    {
      id: uid("scan"),
      timestamp: now - 5 * day - 2 * 3600 * 1000,
      source: "sample",
      imageName: "tomato-leaf-spot.jpg",
      disease: "Leaf Spot (fungal)",
      confidence: 0.87,
      severity: "medium",
      affectedPercent: 18,
      severityGrid: [
        [0, 1, 1, 0, 0, 0],
        [1, 2, 1, 1, 0, 0],
        [0, 1, 2, 1, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0],
      ],
      treatmentNatural: [
        "Remove worst-affected leaves and destroy away from the field",
        "Spray buttermilk solution (100 ml/L water) every 4 days, morning hours",
      ],
      treatmentChemical: [
        "Mancozeb 75% WP @ 2.5 g/L water — protective spray, 10-day interval",
      ],
      resolved: true,
    },
  ];
}

function seedAlerts(now: number): Alert[] {
  const hour = 3600 * 1000;
  const day = 24 * hour;
  return [
    {
      id: uid("alert"),
      level: "critical",
      title: "Critical soil moisture — Zone B",
      message: "Zone B (Chili) at 21% moisture — below the 30% threshold. Irrigation recommended today.",
      timestamp: now - 2 * hour,
      read: false,
      zone: "B",
    },
    {
      id: uid("alert"),
      level: "warning",
      title: "Aphids detected — Zone C",
      message: "Mild aphid infestation (8% leaf area) on Spinach. Neem-oil spray plan is active.",
      timestamp: now - 5 * hour,
      read: false,
      zone: "C",
    },
    {
      id: uid("alert"),
      level: "info",
      title: "Irrigation completed — Zone B",
      message: "Morning run finished: 12 min, soil moisture rose from 21% to 38%.",
      timestamp: now - 1 * day - 1 * hour,
      read: true,
      zone: "B",
    },
    {
      id: uid("alert"),
      level: "warning",
      title: "High temperature advisory",
      message: "Field touched 36.4°C yesterday — mulch Zone A tomato beds and irrigate early morning.",
      timestamp: now - 2 * day,
      read: true,
    },
    {
      id: uid("alert"),
      level: "info",
      title: "Leaf Spot resolved — Zone A",
      message: "Tomato leaf-spot scan from 5 days ago marked resolved after treatment.",
      timestamp: now - 4 * day,
      read: true,
      zone: "A",
    },
    {
      id: uid("alert"),
      level: "info",
      title: "System online",
      message: "KrishiNethra simulation started — all sensors streaming live.",
      timestamp: now - 6 * day,
      read: true,
    },
  ];
}

function seedChat(now: number): ChatMessage[] {
  return [
    {
      role: "assistant",
      text: "Namaste! I am KrishiNethra, your farm's AI doctor. Ask me about irrigation, crop disease, or today's tasks.",
      timestamp: now,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Reports — 30-day daily summaries backfill                           */
/* ------------------------------------------------------------------ */

/** Manual flood-irrigation habit the savings math compares against. */
export const REPORT_MANUAL_BASELINE_L_PER_DAY = 6;
/** Main pump spec (matches WaterCard: 230V × 0.25A). */
export const REPORT_PUMP_WATTS = 230 * 0.25;
export const REPORT_WATER_RATE_RS_PER_L = 0.02;
export const REPORT_ENERGY_RATE_RS_PER_KWH = 8;
/** kWh per litre at 0.4 LPM flow. */
export const REPORT_KWH_PER_LITRE =
  (REPORT_PUMP_WATTS * 150) / 3_600_000;
/** India grid emission factor. */
export const REPORT_KG_CO2_PER_KWH = 0.82;

function hashSeedStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REPORT_DISEASE_POOL = [
  "Healthy",
  "Healthy",
  "Healthy",
  "Leaf Spot (fungal)",
  "Leaf Rust",
  "Aphids (pest)",
  "Nutrient Deficiency / Water Stress",
] as const;

/** Plausible synthetic history for one past day (deterministic per date). */
function makeHistoricalSummary(dateISO: string, indexFromToday: number): DailySummary {
  const rng = mulberry32(hashSeedStr(`krishi-report-${dateISO}`));
  const wave = Math.sin(indexFromToday / 4.5) * 7;
  const dip = rng() < 0.14 ? -(6 + rng() * 10) : 0; // occasional bad day
  const healthScore = Math.max(
    52,
    Math.min(94, Math.round(79 + wave + dip + (rng() - 0.5) * 9)),
  );

  let waterUsedL = 1.7 + rng() * 2.6;
  if (rng() > 0.86) waterUsedL += 0.8 + rng() * 0.9; // thirsty day
  waterUsedL = Math.round(waterUsedL * 100) / 100;

  const energyKwh =
    Math.round(waterUsedL * REPORT_KWH_PER_LITRE * 1_000_000) / 1_000_000;
  const energyCostRs = Math.round(energyKwh * REPORT_ENERGY_RATE_RS_PER_KWH * 100) / 100;

  const roll = rng();
  const scans = roll < 0.45 ? 0 : roll < 0.75 ? 1 : roll < 0.92 ? 2 : 3;
  const diseaseCounts: Record<string, number> = {};
  for (let i = 0; i < scans; i++) {
    const pick =
      REPORT_DISEASE_POOL[Math.floor(rng() * REPORT_DISEASE_POOL.length)];
    diseaseCounts[pick] = (diseaseCounts[pick] ?? 0) + 1;
  }
  // Some days log a healthy confirmation scan even with 0 disease scans.
  if (scans === 0 && rng() < 0.25) {
    diseaseCounts["Healthy"] = 1;
  }
  const totalScans = Object.values(diseaseCounts).reduce((a, b) => a + b, 0);
  const sick = totalScans - (diseaseCounts["Healthy"] ?? 0);
  const scansResolved =
    sick <= 0 ? (diseaseCounts["Healthy"] ?? 0) : Math.min(
      totalScans,
      (diseaseCounts["Healthy"] ?? 0) + Math.floor(sick * (0.4 + rng() * 0.6)),
    );

  const irrigationEvents =
    waterUsedL > 3.8 ? 2 : waterUsedL > 2.4 ? (rng() < 0.6 ? 2 : 1) : rng() < 0.55 ? 1 : 0;

  const tasksTotal = 3 + Math.floor(rng() * 4);
  const tasksDone = Math.min(
    tasksTotal,
    Math.floor(tasksTotal * (0.45 + rng() * 0.55)),
  );

  const avgTempC = Math.round((28.5 + rng() * 6.5 + Math.sin(indexFromToday / 6) * 1.2) * 10) / 10;
  const avgHumidity = Math.round((50 + rng() * 20) * 10) / 10;
  const diaryCount = rng() < 0.3 ? 0 : rng() < 0.7 ? 1 : 2;

  return {
    date: dateISO,
    healthScore,
    waterUsedL,
    energyKwh,
    energyCostRs,
    scans: totalScans,
    scansResolved,
    diseaseCounts,
    irrigationEvents,
    tasksDone,
    tasksTotal,
    avgTempC,
    avgHumidity,
    diaryCount,
  };
}

function stampToISODate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Store shape                                                         */
/* ------------------------------------------------------------------ */

export type SettingsPatch = Partial<
  Omit<AppSettings, "thresholds" | "telegram" | "language" | "location" | "farmProfile">
> & {
  language?: AppSettings["language"];
  thresholds?: Partial<AppSettings["thresholds"]>;
  telegram?: Partial<AppSettings["telegram"]>;
  location?: Partial<AppSettings["location"]>;
  farmProfile?: Partial<AppSettings["farmProfile"]>;
};

/** djb2 hash for the optional 4-digit app PIN (obfuscation, not crypto). */
export function hashPin(pin: string): string {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) {
    h = ((h << 5) + h + pin.charCodeAt(i)) | 0;
  }
  return `pin_${(h >>> 0).toString(16)}`;
}

/** Convert a display size+unit back to canonical acres. */
export function sizeToAcres(size: number, unit: string): number {
  const s = Number.isFinite(size) ? size : 0;
  switch (unit) {
    case "Hectare":
      return Math.round(s * 2.47105 * 100) / 100;
    case "Bigha":
      return Math.round(s * 0.625 * 100) / 100;
    case "Guntha":
      return Math.round(s * 0.025 * 100) / 100;
    default:
      return Math.round(s * 100) / 100;
  }
}

interface FarmState {
  /** True once persisted state has finished rehydrating on client. */
  hydrated: boolean;
  // Landing / onboarding surface (mirrored with settings.language).
  language: LanguageCode;
  isAuthenticated: boolean;
  /** True once the 5-step wizard has been completed. Forces routing. */
  onboardingDone: boolean;
  /** Hashed optional 4-digit app PIN (null = no PIN). */
  appPinHash: string | null;
  setLanguage: (lang: LanguageCode) => void;
  unlock: () => void;
  lock: () => void;
  setOnboardingDone: (done: boolean) => void;
  setAppPin: (pin: string | null) => void;
  verifyPin: (pin: string) => boolean;
  /** Persist a completed wizard: profile + zones + location + flags. */
  completeOnboarding: (opts?: { pin?: string | null }) => void;
  /** Re-open the wizard for editing (Settings → Edit Registration). */
  resetOnboarding: () => void;

  // Core farm state.
  settings: AppSettings;
  zones: Zone[];
  snapshot: SensorSnapshot;
  sensorHistory: SensorHistoryPoint[];
  pump: PumpState;
  manualPumpRemainingSec: number | null;
  totalWaterUsedL: number;
  alerts: Alert[];
  scans: DiseaseScan[];
  diary: DiaryEntry[];
  tasks: Task[];
  sprayPlans: SprayPlan[];
  chat: ChatMessage[];
  farmHealthScore: number;
  simRunning: boolean;

  // Hardware bridge (LIVE mode) — ephemeral connection state, never persisted.
  hwConnected: boolean;
  hwLastSeen: number | null;
  hwFirmware: string | null;
  hwUptimeSec: number | null;
  hwLatencyMs: number | null;

  // Wireless edge bridge (MQTT) — TRUE WIRELESS live mode. Ephemeral link
  // state, never persisted (token/broker live in settings and DO persist).
  // liveSource === "mqtt" means telemetry flows from the ESP32 over MQTT.
  liveSource: "sim" | "mqtt";
  mqttStatus: "connecting" | "online" | "offline";
  mqttMsgCount: number;
  mqttLastSeen: number | null;
  mqttRssi: number | null;
  /** Edge-reported stale flag (telemetry.stale === 1 → sensor node silent). */
  edgeStale: boolean;
  /** Edge relay R2 + servo mirror (from telemetry, optimistic on toggle). */
  edgeR2: boolean;
  edgeServo: number;
  edgeMode: string | null;
  setLiveSource: (src: "sim" | "mqtt") => void;
  setEdgeR2: (on: boolean) => void;
  sendEdgeBuzz: () => void;
  sendEdgeSweep: () => void;
  sendEdgeServo: (angle: number) => void;

  // Pan-tilt camera state (degrees, default looks straight at the field).
  panAngle: number;
  tiltAngle: number;
  setPanAngle: (angle: number) => void;
  setTiltAngle: (angle: number) => void;
  setCameraAngles: (pan: number, tilt?: number) => void;

  // Simulation control.
  startSimulation: () => void;
  stopSimulation: () => void;

  // Hardware bridge (LIVE mode) — 2s poller merging gateway data into the
  // same slices the simulator writes to, so every page works unchanged.
  startLivePolling: () => void;
  stopLivePolling: () => void;
  /** Merge one gateway snapshot into snapshot/zones/history/alerts/health. */
  applyLiveSensors: (snapshot: SensorSnapshot) => void;
  setHwConnection: (
    connected: boolean,
    info?: { firmware?: string | null; uptimeSec?: number | null; latencyMs?: number | null },
  ) => void;

  // Actions.
  setPumpManual: (on: boolean, durationSec?: number) => void;
  setPumpMode: (mode: PumpState["mode"]) => void;
  /** Start a timed run while STAYING in schedule mode (fired by a slot). */
  startScheduledRun: (durationSec: number) => void;
  addAlert: (
    alert: Omit<Alert, "id" | "timestamp" | "read"> &
      Partial<Pick<Alert, "id" | "timestamp" | "read">>,
  ) => string;
  markAlertsRead: () => void;
  markAlertRead: (id: string) => void;
  addScan: (
    scan: Omit<DiseaseScan, "id" | "timestamp"> &
      Partial<Pick<DiseaseScan, "id" | "timestamp">>,
  ) => string;
  resolveScan: (id: string) => void;
  addDiary: (
    entry: Omit<DiaryEntry, "id" | "date"> & Partial<Pick<DiaryEntry, "id" | "date">>,
  ) => string;
  addTask: (
    task: Omit<Task, "id"> & Partial<Pick<Task, "id">>,
  ) => string;
  toggleTask: (id: string) => void;
  addSprayPlan: (
    plan: Omit<SprayPlan, "id" | "status"> & Partial<Pick<SprayPlan, "id" | "status">>,
  ) => string;
  updateSprayStep: (planId: string, day: number, done: boolean) => void;
  addChatMessage: (
    message: Omit<ChatMessage, "timestamp"> & Partial<Pick<ChatMessage, "timestamp">>,
  ) => string;
  updateSettings: (patch: SettingsPatch) => void;
  resetFarm: () => void;
  generateDailyTasks: () => void;

  // Reports — 30-day daily rollups (backfilled on first /reports visit).
  dailySummaries: DailySummary[];
  ensureDailySummaries: () => void;
  /** First-run exhibition seed — fills empty slices, never overwrites user data. */
  ensureDemoSeed: () => void;
}

/* ------------------------------------------------------------------ */
/* Simulation interval (module-global so HMR can't double-start)       */
/* ------------------------------------------------------------------ */

const SIM_INTERVAL_KEY = "__krishinethraSimInterval";

function getSimInterval(): ReturnType<typeof setInterval> | null {
  if (typeof globalThis === "undefined") return null;
  return (globalThis as Record<string, unknown>)[SIM_INTERVAL_KEY] as ReturnType<
    typeof setInterval
  > | null;
}

function setSimInterval(id: ReturnType<typeof setInterval> | null): void {
  if (typeof globalThis === "undefined") return;
  (globalThis as Record<string, unknown>)[SIM_INTERVAL_KEY] = id;
}

/* ------------------------------------------------------------------ */
/* LIVE hardware polling (module-global so HMR can't double-start)     */
/* Merges gateway snapshots into the SAME slices doTick() writes to.   */
/* ------------------------------------------------------------------ */

const LIVE_INTERVAL_KEY = "__krishinethraLiveInterval";
const LIVE_POLL_MS = 2000;

function getLiveInterval(): ReturnType<typeof setInterval> | null {
  if (typeof globalThis === "undefined") return null;
  return (globalThis as Record<string, unknown>)[LIVE_INTERVAL_KEY] as ReturnType<
    typeof setInterval
  > | null;
}

function setLiveInterval(id: ReturnType<typeof setInterval> | null): void {
  if (typeof globalThis === "undefined") return;
  (globalThis as Record<string, unknown>)[LIVE_INTERVAL_KEY] = id;
}

/** Re-entrancy guard: a slow gateway must never stack overlapping polls. */
let livePollInFlight = false;

function numOr(fallback: number, v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

/**
 * Merge one gateway snapshot into the store — same slices doTick() writes:
 * snapshot, zones, sensorHistory, pump (derived from flow/current),
 * totalWaterUsedL (estimated from flowRate on the 2s cadence), alerts,
 * diary (completed runs) and farmHealthScore.
 */
function applyLiveSnapshot(raw: SensorSnapshot): void {
  const s = useFarmStore.getState();
  const now = Date.now();
  const snapshot: SensorSnapshot = {
    timestamp: raw.timestamp > 0 ? raw.timestamp : now,
    tempC: numOr(s.snapshot.tempC, raw.tempC),
    humidity: numOr(s.snapshot.humidity, raw.humidity),
    aqi: numOr(s.snapshot.aqi, raw.aqi),
    lightLux: numOr(s.snapshot.lightLux, raw.lightLux),
    rainMm: numOr(s.snapshot.rainMm, raw.rainMm),
    tankLevelPercent: numOr(s.snapshot.tankLevelPercent, raw.tankLevelPercent),
    flowRateLpm: numOr(s.snapshot.flowRateLpm, raw.flowRateLpm),
    pumpCurrentA: numOr(s.snapshot.pumpCurrentA, raw.pumpCurrentA),
    soilMoistureA: numOr(s.snapshot.soilMoistureA, raw.soilMoistureA),
    soilMoistureB: numOr(s.snapshot.soilMoistureB, raw.soilMoistureB),
  };

  // Pump relay state is derived from live electrics (no separate flag
  // in the contract): flowing water or current draw means RUNNING.
  const wasRunning = s.pump.running;
  const running = snapshot.flowRateLpm > 0.005 || snapshot.pumpCurrentA > 0.005;
  let pump = s.pump;
  if (running !== wasRunning) {
    pump = { ...pump, running, lastRunAt: running ? now : pump.lastRunAt };
  }

  // Water/energy estimates on the fixed poll cadence.
  const dtSec = LIVE_POLL_MS / 1000;
  let totalWaterUsedL = s.totalWaterUsedL;
  if (running) {
    totalWaterUsedL =
      Math.round((totalWaterUsedL + (snapshot.flowRateLpm / 60) * dtSec) * 10000) /
      10000;
    pump = { ...pump, totalRunSeconds: pump.totalRunSeconds + dtSec };
  }

  const pumpEvent: "started" | "blocked" | null =
    !wasRunning && running ? "started" : null;

  const t = s.settings.thresholds;
  const zoneCMoisture =
    Math.round(((snapshot.soilMoistureA + snapshot.soilMoistureB) / 2) * 100) / 100;
  const zones: Zone[] = s.zones.map((z) => {
    const moisture =
      z.id === "A" ? snapshot.soilMoistureA : z.id === "B" ? snapshot.soilMoistureB : zoneCMoisture;
    return {
      ...z,
      soilMoisture: moisture,
      status: computeZoneStatus(z.id, moisture, t, s.sprayPlans, s.alerts),
    };
  });

  const fresh = generateAlerts(snapshot, s.settings, s.alerts, pumpEvent);
  const alerts = [...fresh, ...s.alerts].slice(0, 100);

  const last = s.sensorHistory[s.sensorHistory.length - 1];
  let sensorHistory = s.sensorHistory;
  if (!last || snapshot.timestamp - last.timestamp >= 5000) {
    const point: SensorHistoryPoint = {
      timestamp: snapshot.timestamp,
      tempC: snapshot.tempC,
      humidity: snapshot.humidity,
      aqi: snapshot.aqi,
      soilMoistureA: snapshot.soilMoistureA,
      soilMoistureB: snapshot.soilMoistureB,
      waterUsedL: totalWaterUsedL,
    };
    sensorHistory = [...s.sensorHistory, point].slice(-500);
  }

  const unresolved = s.scans.filter((scan) => !scan.resolved).length;
  const farmHealthScore = computeFarmHealthScore(snapshot, zones, unresolved);

  // Completed live run → diary entry (mirrors the simulator behaviour).
  let diary = s.diary;
  if (wasRunning && !running) {
    const startAt = s.pump.lastRunAt ?? now;
    const runSec = Math.max(1, Math.round((now - startAt) / 1000));
    const label =
      runSec >= 60
        ? `${Math.floor(runSec / 60)} min ${runSec % 60 > 0 ? `${runSec % 60} sec` : ""}`.trim()
        : `${runSec} sec`;
    diary = [
      {
        id: uid("diary"),
        date: new Date(now).toISOString().slice(0, 10),
        type: "irrigation",
        details: `Irrigated Zone B for ${label} (live hardware) — soil moisture B ${snapshot.soilMoistureB.toFixed(1)}%, tank at ${snapshot.tankLevelPercent.toFixed(0)}% after the run.`,
        zone: "B",
      } as DiaryEntry,
      ...s.diary,
    ].slice(0, 200);
  }

  useFarmStore.setState({
    pump,
    snapshot,
    totalWaterUsedL,
    zones,
    alerts,
    sensorHistory,
    farmHealthScore,
    diary,
    hwConnected: true,
    hwLastSeen: now,
  });
}

async function doLivePoll(): Promise<void> {
  const s = useFarmStore.getState();
  if (s.settings.mode !== "live") return;
  const gw = s.settings.hardwareGatewayUrl.trim();
  if (!gw) {
    // LIVE with no gateway configured → show disconnected, keep last data.
    if (s.hwConnected) useFarmStore.setState({ hwConnected: false });
    return;
  }
  if (livePollInFlight) return;
  livePollInFlight = true;
  const t0 = Date.now();
  try {
    const [sensors, status] = await Promise.all([
      fetchHwSensors(gw),
      fetchHwStatus(gw),
    ]);
    const latencyMs = Date.now() - t0;
    const cur = useFarmStore.getState();
    if (cur.settings.mode !== "live") return;
    if (sensors.ok && sensors.data && typeof sensors.data === "object") {
      applyLiveSnapshot(sensors.data as unknown as SensorSnapshot);
    } else if (cur.hwConnected) {
      useFarmStore.setState({ hwConnected: false });
    }
    if (status.ok && status.data && typeof status.data === "object") {
      const d = status.data as Record<string, unknown>;
      const uptime =
        typeof d["uptime"] === "number" && Number.isFinite(d["uptime"])
          ? d["uptime"]
          : null;
      const firmware = typeof d["firmware"] === "string" ? d["firmware"] : null;
      useFarmStore.setState({
        hwConnected: sensors.ok,
        hwLastSeen: sensors.ok ? Date.now() : cur.hwLastSeen,
        hwFirmware: firmware ?? cur.hwFirmware,
        hwUptimeSec: uptime ?? cur.hwUptimeSec,
        hwLatencyMs: latencyMs,
      });
    }
  } finally {
    livePollInFlight = false;
  }
}

/* Throttled servo forwarding: hold-to-move pads emit ~16/s, the gateway
   only needs ~2/s — last angle wins via the next allowed send. */
const SERVO_MIN_INTERVAL_MS = 400;
const lastServoSent: Record<"pan" | "tilt", { angle: number; at: number }> = {
  pan: { angle: -1, at: 0 },
  tilt: { angle: -1, at: 0 },
};

function maybeSendServo(axis: "pan" | "tilt", angle: number): void {
  if (typeof window === "undefined") return;
  const st = useFarmStore.getState();
  if (st.settings.mode !== "live") return;
  const rounded = Math.min(180, Math.max(0, Math.round(angle)));
  const now = Date.now();
  // Wireless edge path: pan servo mirrors over MQTT (tilt is local-only —
  // the edge node carries a single pan servo).
  if (st.liveSource === "mqtt" && st.mqttStatus === "online") {
    if (axis !== "pan") return;
    const last = lastServoSent[axis];
    if (rounded === last.angle) return;
    if (now - last.at < SERVO_MIN_INTERVAL_MS) return;
    lastServoSent[axis] = { angle: rounded, at: now };
    void import("./mqtt-bridge").then((m) => m.cmdServo(rounded));
    return;
  }
  const gw = st.settings.hardwareGatewayUrl.trim();
  if (!gw) return;
  const last = lastServoSent[axis];
  if (rounded === last.angle) return;
  if (now - last.at < SERVO_MIN_INTERVAL_MS) return;
  lastServoSent[axis] = { angle: rounded, at: now };
  void sendHwServo(gw, axis, rounded);
}

/* ------------------------------------------------------------------ */
/* One simulation step                                                 */
/* ------------------------------------------------------------------ */

function doTick(): void {
  const s = useFarmStore.getState();
  if (s.settings.mode !== "simulation") return;

  const dt = 1;

  // Manual / schedule pump countdown.
  let pump = s.pump;
  let manualRemaining = s.manualPumpRemainingSec;
  if (
    (pump.mode === "manual" || pump.mode === "schedule") &&
    manualRemaining != null
  ) {
    manualRemaining -= dt;
    if (manualRemaining <= 0) {
      pump = { ...pump, running: false };
      manualRemaining = null;
    }
  }

  // AUTO mode relay decision (uses the latest snapshot).
  if (pump.mode === "auto") {
    const decision = evaluateAutoPump(s.snapshot, s.settings, pump);
    if (decision === "on" && !pump.running) {
      pump = { ...pump, running: true, lastRunAt: Date.now() };
    } else if (decision === "off" && pump.running) {
      pump = { ...pump, running: false };
    }
  }

  const wasRunning = s.pump.running;
  const result = tick(s.snapshot, s.settings, pump, dt);

  // Tank empty → pump cannot run.
  let pumpEvent: "started" | "blocked" | null = null;
  if (result.blocked) {
    pump = { ...pump, running: false };
    manualRemaining = null;
    pumpEvent = "blocked";
  } else if (!wasRunning && pump.running) {
    pumpEvent = "started";
  }

  if (pump.running) {
    pump = {
      ...pump,
      totalRunSeconds: pump.totalRunSeconds + dt,
      lastRunAt: pump.lastRunAt ?? result.snapshot.timestamp,
    };
  }

  const snapshot = result.snapshot;
  const totalWaterUsedL =
    Math.round((s.totalWaterUsedL + result.waterUsedL) * 10000) / 10000;

  // Zones mirror the snapshot sensors (Zone C tracks the field average).
  const t = s.settings.thresholds;
  const zoneCMoisture =
    Math.round(((snapshot.soilMoistureA + snapshot.soilMoistureB) / 2) * 100) / 100;
  const zones: Zone[] = s.zones.map((z) => {
    const moisture =
      z.id === "A" ? snapshot.soilMoistureA : z.id === "B" ? snapshot.soilMoistureB : zoneCMoisture;
    return {
      ...z,
      soilMoisture: moisture,
      status: computeZoneStatus(z.id, moisture, t, s.sprayPlans, s.alerts),
    };
  });

  // Alerts (deduplicated inside the generator) capped at 100.
  const fresh = generateAlerts(snapshot, s.settings, s.alerts, pumpEvent);
  const alerts = [...fresh, ...s.alerts].slice(0, 100);

  // History: one point every 5 simulated seconds, keep last 500.
  const last = s.sensorHistory[s.sensorHistory.length - 1];
  let sensorHistory = s.sensorHistory;
  if (!last || snapshot.timestamp - last.timestamp >= 5000) {
    const point: SensorHistoryPoint = {
      timestamp: snapshot.timestamp,
      tempC: snapshot.tempC,
      humidity: snapshot.humidity,
      aqi: snapshot.aqi,
      soilMoistureA: snapshot.soilMoistureA,
      soilMoistureB: snapshot.soilMoistureB,
      waterUsedL: totalWaterUsedL,
    };
    sensorHistory = [...s.sensorHistory, point].slice(-500);
  }

  const unresolved = s.scans.filter((scan) => !scan.resolved).length;
  const farmHealthScore = computeFarmHealthScore(snapshot, zones, unresolved);

  // Auto-diary: every completed irrigation run files an irrigation entry.
  // (wasRunning → stopped, and not a tank-blocked abort.)
  const wasManualRemaining = s.manualPumpRemainingSec;
  const completedRun = wasRunning && !pump.running && !result.blocked;
  let diary = s.diary;
  if (completedRun) {
    const startAt = s.pump.lastRunAt ?? snapshot.timestamp;
    const runSec = Math.max(1, Math.round((snapshot.timestamp - startAt) / 1000));
    const label =
      runSec >= 60
        ? `${Math.floor(runSec / 60)} min ${runSec % 60 > 0 ? `${runSec % 60} sec` : ""}`.trim()
        : `${runSec} sec`;
    const entry: DiaryEntry = {
      id: uid("diary"),
      date: todayISO(),
      type: "irrigation",
      details: `Irrigated Zone B for ${label} — soil moisture B ${snapshot.soilMoistureB.toFixed(1)}%, tank at ${snapshot.tankLevelPercent.toFixed(0)}% after the run.`,
      zone: "B",
    };
    diary = [entry, ...s.diary].slice(0, 200);
  }
  void wasManualRemaining;

  useFarmStore.setState({
    pump,
    manualPumpRemainingSec: manualRemaining,
    snapshot,
    totalWaterUsedL,
    zones,
    alerts,
    sensorHistory,
    farmHealthScore,
    diary,
  });
}

/* ------------------------------------------------------------------ */
/* Fresh-state factory (used for init + resetFarm)                     */
/* ------------------------------------------------------------------ */

function seedSensorHistory(
  snapshot: SensorSnapshot,
  totalWaterUsedL: number,
  points = 60,
): SensorHistoryPoint[] {
  // 60 points, 5s apart, ending at the snapshot — charts look alive instantly.
  // Values wiggle gently around the live reading (deterministic, no jitter).
  const out: SensorHistoryPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const ts = snapshot.timestamp - i * 5000;
    const k = i / Math.max(1, points - 1); // 0 newest → 1 oldest
    const wob = (seed: number, amp: number) =>
      Math.sin(ts / 37000 + seed) * amp * (0.3 + k * 0.7);
    out.push({
      timestamp: ts,
      tempC: Math.round((snapshot.tempC + wob(1, 0.7)) * 10) / 10,
      humidity: Math.round((snapshot.humidity + wob(2, 2.2)) * 10) / 10,
      aqi: Math.round(snapshot.aqi + wob(3, 4)),
      soilMoistureA:
        Math.round((snapshot.soilMoistureA + wob(4, 1.1)) * 10) / 10,
      soilMoistureB:
        Math.round((snapshot.soilMoistureB + wob(5, 1.4)) * 10) / 10,
      waterUsedL:
        Math.round(
          Math.max(0, totalWaterUsedL - (i * totalWaterUsedL) / points) * 10000,
        ) / 10000,
    });
  }
  return out;
}

function seedDailySummaries(
  now: number,
  snapshot: SensorSnapshot,
  farmHealthScore: number,
  totalWaterUsedL: number,
  pumpRunSeconds: number,
  tasks: Task[],
  diary: DiaryEntry[],
): DailySummary[] {
  const today = isoDate(new Date(now));
  const rows: DailySummary[] = [];
  for (let i = 29; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = isoDate(d);
    rows.push(makeHistoricalSummary(date, i));
  }
  const energyKwh =
    Math.round(((REPORT_PUMP_WATTS * pumpRunSeconds) / 3_600_000) * 1_000_000) /
    1_000_000;
  const scope = tasks.filter((t) => t.dueDate <= today);
  const tasksScope = scope.length > 0 ? scope : tasks;
  const diaryToday = diary.filter((d) => d.date === today);
  rows.push({
    date: today,
    healthScore: Math.round(farmHealthScore),
    waterUsedL: Math.round(totalWaterUsedL * 100) / 100,
    energyKwh,
    energyCostRs:
      Math.round(energyKwh * REPORT_ENERGY_RATE_RS_PER_KWH * 100) / 100,
    scans: 0,
    scansResolved: 0,
    diseaseCounts: {},
    irrigationEvents: 1,
    tasksDone: tasksScope.filter((t) => t.done).length,
    tasksTotal: tasksScope.length,
    avgTempC: Math.round(snapshot.tempC * 10) / 10,
    avgHumidity: Math.round(snapshot.humidity * 10) / 10,
    diaryCount: diaryToday.length,
  });
  return rows.sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
}

function freshFarmState(now: number) {
  const snapshot = createInitialSnapshot(now);
  const zones = seedZones();
  const scans = seedScans(now);
  const diary = seedDiary();
  const tasks = seedTasks();
  const unresolved = scans.filter((s) => !s.resolved).length;
  const farmHealthScore = computeFarmHealthScore(snapshot, zones, unresolved);
  // A lived-in demo: morning irrigation already ran today.
  const totalWaterUsedL = 2.4;
  const pumpRunSeconds = 580;
  return {
    snapshot,
    zones,
    sensorHistory: seedSensorHistory(snapshot, totalWaterUsedL),
    pump: {
      running: false,
      mode: "auto",
      totalRunSeconds: pumpRunSeconds,
      lastRunAt: now - 5 * 3600 * 1000,
    } as PumpState,
    manualPumpRemainingSec: null as number | null,
    totalWaterUsedL,
    alerts: seedAlerts(now),
    scans,
    diary,
    tasks,
    sprayPlans: seedSprayPlans(),
    chat: seedChat(now),
    farmHealthScore,
    simRunning: false,
    panAngle: 90,
    tiltAngle: 90,
    dailySummaries: seedDailySummaries(
      now,
      snapshot,
      farmHealthScore,
      totalWaterUsedL,
      pumpRunSeconds,
      tasks,
      diary,
    ),
  };
}

/* ------------------------------------------------------------------ */
/* The store                                                           */
/* ------------------------------------------------------------------ */

export const useFarmStore = create<FarmState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      language: "en",
      isAuthenticated: false,
      onboardingDone: false,
      appPinHash: null,
      setLanguage: (language) =>
        set((s) => ({
          language,
          settings: { ...s.settings, language },
        })),
      unlock: () => set({ isAuthenticated: true }),
      lock: () => set({ isAuthenticated: false }),
      setOnboardingDone: (done) => set({ onboardingDone: done }),
      setAppPin: (pin) =>
        set({
          appPinHash: pin && /^\d{4}$/.test(pin) ? hashPin(pin) : null,
        }),
      verifyPin: (pin) => {
        const h = get().appPinHash;
        if (!h) return true;
        return h === hashPin(pin);
      },
      completeOnboarding: (opts) => {
        const pin = opts?.pin ?? null;
        set((s) => {
          const fp = s.settings.farmProfile;
          const gps = fp.location ?? null;
          const capFallback = { latitude: 23.0225, longitude: 72.5714, label: "Ahmedabad" };
          const location = gps
            ? {
                latitude: gps.lat,
                longitude: gps.lng,
                label: [fp.district, fp.state].filter(Boolean).join(", ") || "Farm",
              }
            : s.settings.location;
          void capFallback;
          // First 3 crops → Zones A/B/C display names.
          const cropNames = (fp.crops ?? []).slice(0, 3).map((c) => {
            const titled = c.charAt(0).toUpperCase() + c.slice(1);
            return titled;
          });
          const zones: Zone[] = s.zones.map((z, i) =>
            i < cropNames.length && cropNames[i] ? { ...z, crop: cropNames[i] } : z,
          );
          return {
            zones,
            settings: { ...s.settings, location },
            onboardingDone: true,
            isAuthenticated: true,
            appPinHash:
              pin && /^\d{4}$/.test(pin) ? hashPin(pin) : s.appPinHash,
          };
        });
      },
      resetOnboarding: () => set({ onboardingDone: false }),

      settings: DEFAULT_SETTINGS,
      ...freshFarmState(Date.now()),

      // Hardware bridge starts disconnected; the live poller owns it.
      hwConnected: false,
      hwLastSeen: null,
      hwFirmware: null,
      hwUptimeSec: null,
      hwLatencyMs: null,

      // Wireless edge bridge starts offline; MqttManager owns it.
      liveSource: "sim",
      mqttStatus: "offline",
      mqttMsgCount: 0,
      mqttLastSeen: null,
      mqttRssi: null,
      edgeStale: false,
      edgeR2: false,
      edgeServo: 90,
      edgeMode: null,
      setLiveSource: (src) => set({ liveSource: src }),
      setEdgeR2: (on) => {
        set({ edgeR2: on });
        const st = get();
        if (st.liveSource === "mqtt" && st.mqttStatus === "online") {
          void import("./mqtt-bridge").then((m) => m.cmdR2(on));
        }
      },
      sendEdgeBuzz: () => {
        const st = get();
        if (st.liveSource === "mqtt" && st.mqttStatus === "online") {
          void import("./mqtt-bridge").then((m) => m.cmdBuzz());
        }
      },
      sendEdgeSweep: () => {
        const st = get();
        if (st.liveSource === "mqtt" && st.mqttStatus === "online") {
          void import("./mqtt-bridge").then((m) => m.cmdSweep());
        }
      },
      sendEdgeServo: (angle) => {
        const rounded = Math.min(180, Math.max(0, Math.round(angle)));
        set({ edgeServo: rounded, panAngle: rounded });
        const st = get();
        if (st.liveSource === "mqtt" && st.mqttStatus === "online") {
          void import("./mqtt-bridge").then((m) => m.cmdServo(rounded));
        } else {
          maybeSendServo("pan", rounded);
        }
      },

      setPanAngle: (angle) => {
        set({ panAngle: Math.min(180, Math.max(0, Math.round(angle))) });
        maybeSendServo("pan", angle);
      },
      setTiltAngle: (angle) => {
        set({ tiltAngle: Math.min(180, Math.max(0, Math.round(angle))) });
        maybeSendServo("tilt", angle);
      },
      setCameraAngles: (pan, tilt) => {
        set((s) => ({
          panAngle: Math.min(180, Math.max(0, Math.round(pan))),
          tiltAngle: tilt == null ? s.tiltAngle : Math.min(180, Math.max(0, Math.round(tilt))),
        }));
        maybeSendServo("pan", pan);
        if (tilt != null) maybeSendServo("tilt", tilt);
      },

      startSimulation: () => {
        if (typeof window === "undefined") return;
        if (getSimInterval() != null) {
          if (!get().simRunning) set({ simRunning: true });
          return;
        }
        const id = setInterval(doTick, 1000);
        setSimInterval(id);
        set({ simRunning: true });
      },

      stopSimulation: () => {
        const id = getSimInterval();
        if (id != null) clearInterval(id);
        setSimInterval(null);
        set({ simRunning: false });
      },

      startLivePolling: () => {
        if (typeof window === "undefined") return;
        if (getLiveInterval() == null) {
          const id = setInterval(() => void doLivePoll(), LIVE_POLL_MS);
          setLiveInterval(id);
        }
        // Immediate first poll so the header pill resolves without waiting.
        void doLivePoll();
      },

      stopLivePolling: () => {
        const id = getLiveInterval();
        if (id != null) clearInterval(id);
        setLiveInterval(null);
        livePollInFlight = false;
        set({ hwConnected: false });
      },

      applyLiveSensors: (snapshot) => {
        applyLiveSnapshot(snapshot);
      },

      setHwConnection: (connected, info) =>
        set((s) => ({
          hwConnected: connected,
          hwLastSeen: connected ? Date.now() : s.hwLastSeen,
          hwFirmware: info?.firmware ?? s.hwFirmware,
          hwUptimeSec: info?.uptimeSec ?? s.hwUptimeSec,
          hwLatencyMs: info?.latencyMs ?? s.hwLatencyMs,
        })),

      setPumpManual: (on, durationSec) => {
        // LIVE mode: mirror the relay command to hardware (fire-and-forget;
        // local state still applies optimistically). Wireless edge (MQTT)
        // takes precedence; the legacy HTTP gateway is the fallback.
        const pre = get();
        const mqttLive =
          pre.settings.mode === "live" &&
          pre.liveSource === "mqtt" &&
          pre.mqttStatus === "online";
        const liveGw =
          pre.settings.mode === "live" && !mqttLive
            ? pre.settings.hardwareGatewayUrl.trim()
            : "";
        const runDuration =
          durationSec ?? pre.settings.thresholds.pumpDurationSec;
        set((s) => {
          const duration =
            durationSec ?? s.settings.thresholds.pumpDurationSec;
          if (on && s.snapshot.tankLevelPercent < 5) {
            // Tank too low — refuse to start and log it.
            const blocked = makeAlert(
              "critical",
              "Pump blocked — tank empty",
              "Pump cannot run: tank below 5%. Refill the tank.",
              Date.now(),
            );
            const exists = s.alerts.some(
              (a) =>
                a.title === blocked.title &&
                Date.now() - a.timestamp < ALERT_DEDUP_WINDOW_MS,
            );
            return {
              pump: { ...s.pump, mode: "manual", running: false },
              manualPumpRemainingSec: null,
              alerts: exists ? s.alerts : [blocked, ...s.alerts].slice(0, 100),
            };
          }
          // Manual OFF after a run → file the completed irrigation in the diary.
          if (!on && s.pump.running) {
            const startAt = s.pump.lastRunAt ?? Date.now();
            const runSec = Math.max(1, Math.round((Date.now() - startAt) / 1000));
            const label =
              runSec >= 60
                ? `${Math.floor(runSec / 60)} min ${runSec % 60 > 0 ? `${runSec % 60} sec` : ""}`.trim()
                : `${runSec} sec`;
            const entry: DiaryEntry = {
              id: uid("diary"),
              date: todayISO(),
              type: "irrigation",
              details: `Irrigated Zone B for ${label} (manual stop) — soil moisture B ${s.snapshot.soilMoistureB.toFixed(1)}%, tank at ${s.snapshot.tankLevelPercent.toFixed(0)}%.`,
              zone: "B",
            };
            return {
              pump: { ...s.pump, mode: "manual", running: false },
              manualPumpRemainingSec: null,
              diary: [entry, ...s.diary].slice(0, 200),
            };
          }
          return {
            pump: {
              ...s.pump,
              mode: "manual",
              running: on,
              lastRunAt: on ? Date.now() : s.pump.lastRunAt,
            },
            manualPumpRemainingSec: on ? duration : null,
          };
        });
        if (liveGw) {
          void sendHwPump(liveGw, on ? "on" : "off", on ? runDuration : undefined);
        }
        if (mqttLive) {
          void import("./mqtt-bridge").then((m) => {
            if (on && durationSec != null) m.cmdPumpTimed(durationSec);
            else if (on) m.cmdPumpOn();
            else m.cmdPumpOff();
          });
        }
      },

      setPumpMode: (mode) => {
        const pre = get();
        set((s) => ({
          pump: {
            ...s.pump,
            mode,
            running: mode === "auto" ? s.pump.running : s.pump.running,
          },
          manualPumpRemainingSec: null,
        }));
        if (
          pre.settings.mode === "live" &&
          pre.liveSource === "mqtt" &&
          pre.mqttStatus === "online"
        ) {
          void import("./mqtt-bridge").then((m) => {
            if (mode === "auto") m.cmdMode("AUTO");
            else if (mode === "manual") m.cmdMode("MANUAL");
            // schedule mode has no edge equivalent — edge stays in last mode.
          });
        }
      },

      startScheduledRun: (durationSec) => {
        const pre = get();
        const mqttLive =
          pre.settings.mode === "live" &&
          pre.liveSource === "mqtt" &&
          pre.mqttStatus === "online";
        const liveGw =
          pre.settings.mode === "live" && !mqttLive
            ? pre.settings.hardwareGatewayUrl.trim()
            : "";
        set((s) => {
          if (s.snapshot.tankLevelPercent < 5) {
            const blocked = makeAlert(
              "critical",
              "Pump blocked — tank empty",
              "Scheduled run skipped: tank below 5%. Refill the tank.",
              Date.now(),
            );
            const exists = s.alerts.some(
              (a) =>
                a.title === blocked.title &&
                Date.now() - a.timestamp < ALERT_DEDUP_WINDOW_MS,
            );
            return {
              pump: { ...s.pump, mode: "schedule", running: false },
              manualPumpRemainingSec: null,
              alerts: exists ? s.alerts : [blocked, ...s.alerts].slice(0, 100),
            };
          }
          return {
            pump: {
              ...s.pump,
              mode: "schedule",
              running: true,
              lastRunAt: Date.now(),
            },
            manualPumpRemainingSec: Math.max(1, Math.round(durationSec)),
          };
        });
        if (liveGw) {
          void sendHwPump(liveGw, "on", Math.max(1, Math.round(durationSec)));
        }
        if (mqttLive) {
          void import("./mqtt-bridge").then((m) =>
            m.cmdPumpTimed(Math.max(1, Math.round(durationSec))),
          );
        }
      },

      addAlert: (alert) => {
        const now = alert.timestamp ?? Date.now();
        const full: Alert = {
          id: alert.id ?? uid("alert"),
          timestamp: now,
          read: alert.read ?? false,
          level: alert.level,
          title: alert.title,
          message: alert.message,
          ...(alert.zone ? { zone: alert.zone } : {}),
        };
        let alertId = full.id;
        set((s) => {
          if (full.title.startsWith("Pump mode")) {
            const dup = s.alerts.find(
              (a) =>
                a.title === full.title &&
                now - a.timestamp < ALERT_DEDUP_WINDOW_MS,
            );
            if (dup) {
              alertId = dup.id;
              return s;
            }
          }
          return { alerts: [full, ...s.alerts].slice(0, 100) };
        });
        return alertId;
      },

      markAlertsRead: () =>
        set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, read: true })) })),

      markAlertRead: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
        })),

      addScan: (scan) => {
        const full: DiseaseScan = {
          id: scan.id ?? uid("scan"),
          timestamp: scan.timestamp ?? Date.now(),
          source: scan.source,
          imageName: scan.imageName,
          disease: scan.disease,
          confidence: scan.confidence,
          severity: scan.severity,
          affectedPercent: scan.affectedPercent,
          severityGrid: scan.severityGrid,
          treatmentNatural: scan.treatmentNatural,
          treatmentChemical: scan.treatmentChemical,
          resolved: scan.resolved ?? false,
        };
        set((s) => {
          const scans = [full, ...s.scans];
          const extras: Alert[] = [];
          // Disease found → alert + diary entry so everything updates live.
          if (full.severity !== "none" && full.disease.toLowerCase() !== "healthy") {
            const alert = diseaseAlert(full.disease, full.severity, undefined, full.timestamp);
            const dup = [...s.alerts, ...extras].some(
              (a) =>
                a.title === alert.title &&
                full.timestamp - a.timestamp < ALERT_DEDUP_WINDOW_MS,
            );
            if (!dup) extras.push(alert);
          }
          const diaryEntry: DiaryEntry = {
            id: uid("diary"),
            date: todayISO(),
            type: "disease",
            details: `${full.disease} detected (${full.severity}, ${full.affectedPercent}% affected, ${(full.confidence * 100).toFixed(0)}% confidence) — see scan ${full.imageName}.`,
            scanId: full.id,
          };
          const unresolved = scans.filter((x) => !x.resolved).length;
          return {
            scans,
            alerts: [...extras, ...s.alerts].slice(0, 100),
            diary: [diaryEntry, ...s.diary],
            farmHealthScore: computeFarmHealthScore(s.snapshot, s.zones, unresolved),
          };
        });
        return full.id;
      },

      resolveScan: (id) =>
        set((s) => {
          const scans = s.scans.map((scan) =>
            scan.id === id ? { ...scan, resolved: true } : scan,
          );
          const unresolved = scans.filter((x) => !x.resolved).length;
          return {
            scans,
            farmHealthScore: computeFarmHealthScore(s.snapshot, s.zones, unresolved),
          };
        }),

      addDiary: (entry) => {
        const full: DiaryEntry = {
          id: entry.id ?? uid("diary"),
          date: entry.date ?? todayISO(),
          type: entry.type,
          details: entry.details,
          ...(entry.zone ? { zone: entry.zone } : {}),
          ...(entry.scanId ? { scanId: entry.scanId } : {}),
          ...(entry.photo ? { photo: entry.photo } : {}),
        };
        set((s) => ({ diary: [full, ...s.diary].slice(0, 200) }));
        return full.id;
      },

      addTask: (task) => {
        const full: Task = {
          id: task.id ?? uid("task"),
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
          done: task.done ?? false,
          source: task.source ?? "manual",
          ...(task.zone ? { zone: task.zone } : {}),
          ...(task.completedAt !== undefined ? { completedAt: task.completedAt } : {}),
        };
        set((s) => ({ tasks: [full, ...s.tasks] }));
        return full.id;
      },

      toggleTask: (id) =>
        set((s) => {
          const now = Date.now();
          return {
            tasks: s.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    done: !t.done,
                    completedAt: !t.done ? now : null,
                  }
                : t,
            ),
          };
        }),

      addSprayPlan: (plan) => {
        const full: SprayPlan = {
          id: plan.id ?? uid("spray"),
          disease: plan.disease,
          zone: plan.zone,
          startDate: plan.startDate,
          steps: plan.steps,
          status: plan.status ?? "active",
        };
        set((s) => ({ sprayPlans: [full, ...s.sprayPlans] }));
        return full.id;
      },

      updateSprayStep: (planId, day, done) =>
        set((s) => ({
          sprayPlans: s.sprayPlans.map((p) => {
            if (p.id !== planId) return p;
            const steps = p.steps.map((step) =>
              step.day === day ? { ...step, done } : step,
            );
            const status =
              steps.length > 0 && steps.every((step) => step.done)
                ? "completed"
                : p.status === "completed"
                  ? "active"
                  : p.status;
            return { ...p, steps, status };
          }),
        })),

      addChatMessage: (message) => {
        const full: ChatMessage = {
          role: message.role,
          text: message.text,
          timestamp: message.timestamp ?? Date.now(),
          ...(message.actions ? { actions: message.actions } : {}),
        };
        set((s) => ({ chat: [...s.chat, full].slice(-200) }));
        return full.timestamp.toString();
      },

      updateSettings: (patch) =>
        set((s) => {
          const settings: AppSettings = {
            ...s.settings,
            ...patch,
            language: patch.language ?? s.settings.language,
            thresholds: { ...s.settings.thresholds, ...patch.thresholds },
            telegram: { ...s.settings.telegram, ...patch.telegram },
            location: {
              ...DEFAULT_SETTINGS.location,
              ...(s.settings.location ?? {}),
              ...patch.location,
            },
            farmProfile: {
              ...DEFAULT_SETTINGS.farmProfile,
              ...(s.settings.farmProfile ?? {}),
              ...patch.farmProfile,
            },
          };
          // Keep the pump's manual timer consistent with a changed default.
          return {
            settings,
            language: settings.language,
          };
        }),

      resetFarm: () => {
        const s = get();
        const fresh = freshFarmState(Date.now());
        set({
          settings: { ...DEFAULT_SETTINGS, language: s.settings.language },
          language: s.language,
          ...fresh,
          simRunning: s.simRunning,
          hwConnected: false,
          hwLastSeen: null,
          hwFirmware: null,
          hwUptimeSec: null,
          hwLatencyMs: null,
          liveSource: "sim",
          mqttStatus: "offline",
          mqttMsgCount: 0,
          mqttLastSeen: null,
          mqttRssi: null,
          edgeStale: false,
          edgeR2: false,
          edgeServo: 90,
          edgeMode: null,
        });
      },

      generateDailyTasks: () =>
        set((s) => {
          const today = todayISO();
          const candidates: Omit<Task, "id">[] = [];

          const parseDay = (iso: string): Date => {
            const [y, m, d] = iso.split("-").map(Number);
            return new Date(y || 1970, (m || 1) - 1, d || 1);
          };
          const diffDays = (aISO: string, bISO: string): number =>
            Math.round((parseDay(aISO).getTime() - parseDay(bISO).getTime()) / 86400000);
          const addDaysISO = (iso: string, n: number): string => {
            const d = parseDay(iso);
            d.setDate(d.getDate() + n);
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${d.getFullYear()}-${mm}-${dd}`;
          };

          // 1. Dry soil → irrigate (spec: moisture < 30 → Zone B high).
          const dryZones = s.zones.filter((z) => z.soilMoisture < 30);
          const zoneB = s.zones.find((z) => z.id === "B");
          if (zoneB && zoneB.soilMoisture < 30) {
            candidates.push({
              title: `Irrigate Zone B — moisture at ${zoneB.soilMoisture.toFixed(0)}%`,
              priority: "high",
              dueDate: today,
              done: false,
              source: "ai",
              zone: "B",
            });
          } else {
            for (const z of dryZones) {
              candidates.push({
                title: `Irrigate Zone ${z.id} — moisture at ${z.soilMoisture.toFixed(0)}%`,
                priority: "high",
                dueDate: today,
                done: false,
                source: "ai",
                zone: z.id,
              });
            }
          }

          // 2. Active spray plan with a due step → neem spray task (high).
          for (const plan of s.sprayPlans.filter((p) => p.status === "active")) {
            const dueStep = plan.steps.find((step) => {
              if (step.done) return false;
              return diffDays(addDaysISO(plan.startDate, step.day - 1), today) <= 0;
            });
            if (dueStep) {
              candidates.push({
                title: `Apply neem spray Zone ${plan.zone} — ${plan.disease} Day ${dueStep.day}`,
                priority: "high",
                dueDate: today,
                done: false,
                source: "ai",
                zone: plan.zone,
              });
            }
          }

          // 3. Low tank → refill (spec: tank < 25 → medium).
          if (s.snapshot.tankLevelPercent < 25) {
            candidates.push({
              title: `Refill water tank — ${s.snapshot.tankLevelPercent.toFixed(0)}% left`,
              priority: "medium",
              dueDate: today,
              done: false,
              source: "ai",
            });
          }

          // 4. Fertilizer next-due within 2 days → task (15-day cycle from diary).
          const fertDates = s.diary
            .filter((d) => d.type === "fertilizer")
            .map((d) => d.date)
            .sort();
          if (fertDates.length > 0) {
            const last = fertDates[fertDates.length - 1];
            const nextDue = addDaysISO(last, 15);
            if (diffDays(nextDue, today) <= 2) {
              candidates.push({
                title:
                  diffDays(nextDue, today) < 0
                    ? `Apply fertilizer dose — overdue since ${nextDue}`
                    : diffDays(nextDue, today) === 0
                      ? "Apply fertilizer dose — due today"
                      : `Apply fertilizer dose — due ${nextDue}`,
                priority: "medium",
                dueDate: diffDays(nextDue, today) < 0 ? today : nextDue,
                done: false,
                source: "ai",
              });
            }
          }
          // Unresolved severe scans still deserve attention.
          for (const scan of s.scans.filter((x) => !x.resolved && x.severity === "severe")) {
            candidates.push({
              title: `Inspect ${scan.disease} (${scan.severity}) — follow treatment plan`,
              priority: "high",
              dueDate: today,
              done: false,
              source: "ai",
            });
          }

          // 5. Always-on routine tasks (low).
          candidates.push({
            title: "Morning camera scan — check all zones",
            priority: "low",
            dueDate: today,
            done: false,
            source: "ai",
          });
          candidates.push({
            title: "Check weather forecast for spray window",
            priority: "low",
            dueDate: today,
            done: false,
            source: "ai",
          });

          // Dedupe against existing pending tasks (case-insensitive title).
          const open = new Set(
            s.tasks.filter((t) => !t.done).map((t) => t.title.trim().toLowerCase()),
          );
          const seen = new Set<string>();
          const fresh = candidates
            .filter((c) => {
              const key = c.title.trim().toLowerCase();
              if (open.has(key) || seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .map((c) => ({ ...c, id: uid("task") }));
          if (fresh.length === 0) return {};
          return { tasks: [...fresh, ...s.tasks] };
        }),

      ensureDailySummaries: () =>
        set((s) => {
          const today = todayISO();
          const byDate = new Map<string, DailySummary>();
          for (const row of s.dailySummaries ?? []) {
            if (row && typeof row.date === "string") byDate.set(row.date, row);
          }

          // Backfill the past 29 days (deterministic, stable across reloads).
          for (let i = 29; i >= 1; i--) {
            const date = daysAgo(i);
            if (!byDate.has(date)) {
              byDate.set(date, makeHistoricalSummary(date, i));
            }
          }

          // Today's row is always live-derived so KPIs match the dashboard.
          const scansToday = s.scans.filter(
            (x) => stampToISODate(x.timestamp) === today,
          );
          const diseaseCounts: Record<string, number> = {};
          for (const scan of scansToday) {
            const key = scan.disease || "Unknown";
            diseaseCounts[key] = (diseaseCounts[key] ?? 0) + 1;
          }
          const diaryToday = s.diary.filter((d) => d.date === today);
          const irrigationFromDiary = diaryToday.filter(
            (d) => d.type === "irrigation",
          ).length;
          const irrigationEvents =
            irrigationFromDiary > 0
              ? irrigationFromDiary
              : s.totalWaterUsedL > 0.05 || s.pump.totalRunSeconds > 5
                ? 1
                : 0;
          const scope = s.tasks.filter((t) => t.dueDate <= today);
          const tasksScope = scope.length > 0 ? scope : s.tasks.filter((t) => t.dueDate === today);
          const energyKwh =
            Math.round(((REPORT_PUMP_WATTS * s.pump.totalRunSeconds) / 3_600_000) * 1_000_000) /
            1_000_000;

          const todayRow: DailySummary = {
            date: today,
            healthScore: Math.round(s.farmHealthScore),
            waterUsedL: Math.round(s.totalWaterUsedL * 100) / 100,
            energyKwh,
            energyCostRs:
              Math.round(energyKwh * REPORT_ENERGY_RATE_RS_PER_KWH * 100) / 100,
            scans: scansToday.length,
            scansResolved: scansToday.filter((x) => x.resolved).length,
            diseaseCounts,
            irrigationEvents,
            tasksDone: tasksScope.filter((t) => t.done).length,
            tasksTotal: tasksScope.length,
            avgTempC: Math.round(s.snapshot.tempC * 10) / 10,
            avgHumidity: Math.round(s.snapshot.humidity * 10) / 10,
            diaryCount: diaryToday.length,
          };
          byDate.set(today, todayRow);

          const next = [...byDate.values()]
            .filter((r) => r.date <= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30);

          const prev = s.dailySummaries ?? [];
          if (
            prev.length === next.length &&
            prev.every((r, i) => {
              const n = next[i];
              return (
                r.date === n.date &&
                r.healthScore === n.healthScore &&
                r.waterUsedL === n.waterUsedL &&
                r.energyKwh === n.energyKwh &&
                r.scans === n.scans &&
                r.scansResolved === n.scansResolved &&
                r.irrigationEvents === n.irrigationEvents &&
                r.tasksDone === n.tasksDone &&
                r.tasksTotal === n.tasksTotal &&
                r.diaryCount === n.diaryCount
              );
            })
          ) {
            return {};
          }
          return { dailySummaries: next };
        }),

      ensureDemoSeed: () =>
        set((s) => {
          const now = Date.now();
          const patch: Partial<FarmState> = {};
          let changed = false;

          // Empty scans (pre-rich installs) → 2 past scans, one resolved.
          if (!Array.isArray(s.scans) || s.scans.length === 0) {
            patch.scans = seedScans(now);
            changed = true;
          }
          // Minimal alerts (fresh/legacy single "System online") → 6 mixed.
          if (!Array.isArray(s.alerts) || s.alerts.length <= 1) {
            patch.alerts = seedAlerts(now);
            changed = true;
          }
          // Missing tasks → merge rich seed tasks without duplicating titles.
          if (!Array.isArray(s.tasks) || s.tasks.length < 5) {
            const have = new Set(
              (s.tasks ?? []).map((t) => t.title.trim().toLowerCase()),
            );
            const missing = seedTasks().filter(
              (t) => !have.has(t.title.trim().toLowerCase()),
            );
            if (missing.length > 0) {
              patch.tasks = [...(s.tasks ?? []), ...missing];
              changed = true;
            }
          }
          if (!Array.isArray(s.diary) || s.diary.length < 4) {
            const have = new Set(
              (s.diary ?? []).map((d) => `${d.date}|${d.details}`),
            );
            const missing = seedDiary().filter(
              (d) => !have.has(`${d.date}|${d.details}`),
            );
            if (missing.length > 0) {
              patch.diary = [...missing, ...(s.diary ?? [])].slice(0, 200);
              changed = true;
            }
          }
          if (!Array.isArray(s.sprayPlans) || s.sprayPlans.length === 0) {
            patch.sprayPlans = seedSprayPlans();
            changed = true;
          }
          if (
            !Array.isArray(s.sensorHistory) ||
            s.sensorHistory.length < 12
          ) {
            patch.sensorHistory = seedSensorHistory(
              s.snapshot,
              s.totalWaterUsedL > 0 ? s.totalWaterUsedL : 2.4,
            );
            if (!(s.totalWaterUsedL > 0)) {
              (patch as Record<string, unknown>).totalWaterUsedL = 2.4;
            }
            changed = true;
          }
          if (!changed) return {};
          // Recompute health if scans were backfilled.
          if (patch.scans) {
            const unresolved = patch.scans.filter((x) => !x.resolved).length;
            (patch as Record<string, unknown>).farmHealthScore =
              computeFarmHealthScore(s.snapshot, s.zones, unresolved);
          }
          return patch as Partial<FarmState>;
        }),
    }),
    {
      name: "krishinethra-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // Ephemeral runtime state is never persisted: simRunning plus the
        // whole hardware-bridge connection block (re-polled on load) plus
        // the wireless MQTT link block (re-connected on demand).
        const {
          hydrated: _hydrated,
          simRunning: _omitted,
          hwConnected: _hwC,
          hwLastSeen: _hwL,
          hwFirmware: _hwF,
          hwUptimeSec: _hwU,
          hwLatencyMs: _hwLat,
          liveSource: _ls,
          mqttStatus: _mqS,
          mqttMsgCount: _mqC,
          mqttLastSeen: _mqL,
          mqttRssi: _mqR,
          edgeStale: _eS,
          edgeR2: _eR2,
          edgeServo: _eSv,
          edgeMode: _eM,
          ...rest
        } = s;
        void _hydrated;
        void _omitted;
        void _hwC;
        void _hwL;
        void _hwF;
        void _hwU;
        void _hwLat;
        void _ls;
        void _mqS;
        void _mqC;
        void _mqL;
        void _mqR;
        void _eS;
        void _eR2;
        void _eSv;
        void _eM;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
        }
        useFarmStore.setState({ hydrated: true });
        // Backfill location for stores persisted before it existed.
        if (state && !state.settings.location) {
          state.settings.location = { ...DEFAULT_SETTINGS.location };
        }
        // Backfill farmProfile for stores persisted before it existed,
        // and align legacy zone crops to tomato / chili / spinach.
        if (state && !state.settings.farmProfile) {
          state.settings.farmProfile = { ...DEFAULT_SETTINGS.farmProfile };
        }
        if (state?.settings.farmProfile) {
          const fp = state.settings.farmProfile as Partial<
            typeof DEFAULT_SETTINGS.farmProfile
          >;
          if (fp.farmName == null || fp.farmName === "") {
            // Keep empty farmer-entered "" as-is, but ensure the key exists.
            if (fp.farmName == null) fp.farmName = DEFAULT_SETTINGS.farmProfile.farmName;
          }
          if (fp.farmerName == null) fp.farmerName = DEFAULT_SETTINGS.farmProfile.farmerName;
          if (fp.phone == null) fp.phone = "";
          if (fp.role == null) fp.role = "Farmer";
          if (fp.avatar == null) fp.avatar = "🧑‍🌾";
          if (fp.village == null) fp.village = "";
          if (fp.location === undefined) fp.location = null;
          if (fp.size == null) fp.size = fp.farmSizeAcres ?? 1;
          if (fp.sizeUnit == null) fp.sizeUnit = "Acres";
          if (fp.soilType == null) fp.soilType = "Black cotton";
          if (fp.waterSource == null) fp.waterSource = "Borewell";
          if (fp.irrigationMethod == null) fp.irrigationMethod = "Drip";
          if (fp.powerSource == null) fp.powerSource = "Electricity";
        }
        if (state && state.onboardingDone == null) {
          state.onboardingDone = false;
        }
        if (state && state.appPinHash === undefined) {
          state.appPinHash = null;
        }
        // PIN set → start locked until the user unlocks (fresh visit).
        if (state && state.appPinHash && state.onboardingDone) {
          state.isAuthenticated = false;
        }
        // Backfill newer top-level settings keys.
        if (state?.settings) {
          const st = state.settings as Partial<AppSettings>;
          if (st.cameraPanSpeed == null) st.cameraPanSpeed = DEFAULT_SETTINGS.cameraPanSpeed;
          if (st.soundEnabled == null) st.soundEnabled = DEFAULT_SETTINGS.soundEnabled;
          if (st.voiceLang == null) st.voiceLang = DEFAULT_SETTINGS.voiceLang;
          if (st.hardwareGatewayUrl == null) st.hardwareGatewayUrl = "";
          if (st.mqttToken == null || st.mqttToken === "")
            st.mqttToken = DEFAULT_SETTINGS.mqttToken;
          if (st.mqttBrokerUrl == null || st.mqttBrokerUrl === "")
            st.mqttBrokerUrl = DEFAULT_SETTINGS.mqttBrokerUrl;
          if (st.cameraStreamUrl == null) st.cameraStreamUrl = "";
          if (st.cameraSource == null) st.cameraSource = "simulation";
          if (st.dataGovApiKey == null) st.dataGovApiKey = DEFAULT_SETTINGS.dataGovApiKey;
          if (st.commodityResourceId == null)
            st.commodityResourceId = DEFAULT_SETTINGS.commodityResourceId;
          if (
            st.farmProfile &&
            (st.farmProfile as Partial<AppSettings["farmProfile"]>).district == null
          ) {
            st.farmProfile = {
              ...st.farmProfile,
              district: DEFAULT_SETTINGS.farmProfile.district,
            };
          }
          // Migrate old humidityLow default (30 → 40 per agronomy spec).
          if (st.thresholds && st.thresholds.humidityLow === 30) {
            st.thresholds = { ...st.thresholds, humidityLow: 40 };
          }
        }
        // Backfill dailySummaries for stores persisted before /reports existed.
        if (state && !Array.isArray(state.dailySummaries)) {
          state.dailySummaries = [];
        }
        // Exhibition-rich backfill for pre-v1 persisted stores.
        if (state) {
          const now = Date.now();
          if (!Array.isArray(state.scans) || state.scans.length === 0) {
            state.scans = seedScans(now);
            const unresolved = state.scans.filter((x) => !x.resolved).length;
            try {
              state.farmHealthScore = computeFarmHealthScore(
                state.snapshot,
                state.zones,
                unresolved,
              );
            } catch {
              /* keep existing score */
            }
          }
          if (!Array.isArray(state.alerts) || state.alerts.length <= 1) {
            state.alerts = seedAlerts(now);
          }
          if (!Array.isArray(state.tasks) || state.tasks.length < 5) {
            const have = new Set(
              (state.tasks ?? []).map((t) => t.title.trim().toLowerCase()),
            );
            const missing = seedTasks().filter(
              (t) => !have.has(t.title.trim().toLowerCase()),
            );
            if (missing.length > 0) state.tasks = [...state.tasks, ...missing];
          }
          if (!Array.isArray(state.sensorHistory) || state.sensorHistory.length < 12) {
            try {
              state.sensorHistory = seedSensorHistory(
                state.snapshot,
                state.totalWaterUsedL > 0 ? state.totalWaterUsedL : 2.4,
              );
              if (!(state.totalWaterUsedL > 0)) {
                state.totalWaterUsedL = 2.4;
                if (state.pump && !(state.pump.totalRunSeconds > 0)) {
                  state.pump = {
                    ...state.pump,
                    totalRunSeconds: 580,
                    lastRunAt: now - 5 * 3600 * 1000,
                  };
                }
              }
            } catch {
              /* keep existing history */
            }
          }
        }
        if (state && Array.isArray(state.zones) && !state.onboardingDone) {
          const want: Record<string, string> = { A: "Tomato", B: "Chili", C: "Spinach" };
          const needsFix = state.zones.some((z) => want[z.id] && z.crop !== want[z.id]);
          if (needsFix) {
            state.zones = state.zones.map((z) =>
              want[z.id] ? { ...z, crop: want[z.id] } : z,
            );
          }
        }
        if (state && Array.isArray(state.zones)) {
          const t = state.settings?.thresholds ?? DEFAULT_SETTINGS.thresholds;
          state.zones = state.zones.map((z) => ({
            ...z,
            status: computeZoneStatus(
              z.id,
              z.soilMoisture,
              t,
              state.sprayPlans ?? [],
              state.alerts ?? [],
            ),
          }));
        }
        // Wireless link block is ephemeral — always start clean.
        if (state) {
          state.liveSource = "sim";
          state.mqttStatus = "offline";
          state.mqttMsgCount = 0;
          state.mqttLastSeen = null;
          state.mqttRssi = null;
          state.edgeStale = false;
          state.edgeR2 = false;
          state.edgeServo = 90;
          state.edgeMode = null;
          state.hwConnected = false;
        }
        // Auto-start the right engine after persisted settings load:
        // simulator in simulation mode. LIVE mode boots as simulation until
        // the wireless edge (MQTT) proves fresh — MqttManager owns the flip,
        // so a stale persisted "live" never strands the UI without data.
        if (
          typeof window !== "undefined" &&
          state?.settings.mode === "simulation"
        ) {
          state.startSimulation();
        } else if (
          typeof window !== "undefined" &&
          state?.settings.mode === "live"
        ) {
          state.startSimulation();
        }
      },
    },
  ),
);

/* ------------------------------------------------------------------ */
/* Auto-start + auto stop/start on mode changes (client only)          */
/* ------------------------------------------------------------------ */

if (typeof window !== "undefined") {
  useFarmStore.persist.onFinishHydration(() => {
    useFarmStore.setState({ hydrated: true });
  });
  if (useFarmStore.persist.hasHydrated()) {
    useFarmStore.setState({ hydrated: true });
  }

  // Fresh load (no valid persisted mode yet, or first paint): start the
  // engine matching the default/current mode. LIVE always boots the
  // simulator until the wireless edge proves fresh (MqttManager flips).
  queueMicrotask(() => {
    const s = useFarmStore.getState();
    if (s.settings.mode === "simulation" && getSimInterval() == null) {
      s.startSimulation();
    } else if (s.settings.mode === "live" && getSimInterval() == null) {
      s.startSimulation();
    }
  });

  // Follow mode / gateway switches at runtime (simulation <-> live).
  // Simulation default is untouched: the sim runs if and only if the mode
  // is simulation. Legacy HTTP-gateway polling only runs for live mode with
  // liveSource === "sim"; wireless MQTT live mode is fed by the broker, so
  // both local engines stay stopped while the edge streams.
  let prevMode = useFarmStore.getState().settings.mode;
  let prevGw = useFarmStore.getState().settings.hardwareGatewayUrl;
  let prevLiveSource = useFarmStore.getState().liveSource;
  useFarmStore.subscribe((s) => {
    const modeChanged = s.settings.mode !== prevMode;
    const gwChanged = s.settings.hardwareGatewayUrl !== prevGw;
    const srcChanged = s.liveSource !== prevLiveSource;
    if (modeChanged || (gwChanged && s.settings.mode === "live") || srcChanged) {
      prevMode = s.settings.mode;
      prevGw = s.settings.hardwareGatewayUrl;
      prevLiveSource = s.liveSource;
      if (s.settings.mode === "simulation") {
        s.stopLivePolling();
        s.startSimulation();
      } else if (s.liveSource === "mqtt") {
        // Wireless edge owns the data — halt local engines.
        s.stopSimulation();
        s.stopLivePolling();
      } else {
        s.stopSimulation();
        s.startLivePolling();
      }
    }
  });
}
