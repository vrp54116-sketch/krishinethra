export type LanguageCode = "en" | "hi" | "gu" | "mr";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
];

export interface Zone {
  id: "A" | "B" | "C";
  name: string;
  crop: string;
  soilMoisture: number;
  status: "healthy" | "warning" | "critical";
}

export interface SensorSnapshot {
  timestamp: number;
  tempC: number;
  humidity: number;
  aqi: number;
  lightLux: number;
  rainMm: number;
  tankLevelPercent: number;
  flowRateLpm: number;
  pumpCurrentA: number;
  soilMoistureA: number;
  soilMoistureB: number;
}

export interface PumpState {
  running: boolean;
  mode: "manual" | "auto" | "schedule";
  totalRunSeconds: number;
  lastRunAt: number | null;
}

export interface Alert {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  zone?: string;
}

export interface DiseaseScan {
  id: string;
  timestamp: number;
  source: "sample" | "upload";
  imageName: string;
  disease: string;
  confidence: number;
  severity: "none" | "mild" | "medium" | "severe";
  affectedPercent: number;
  severityGrid: number[][];
  treatmentNatural: string[];
  treatmentChemical: string[];
  resolved: boolean;
}

export interface DiaryEntry {
  id: string;
  date: string;
  type: "irrigation" | "disease" | "fertilizer" | "spray" | "harvest" | "general";
  details: string;
  zone?: string;
  scanId?: string;
  /** Optional photo stored as a base64 data URL. */
  photo?: string;
}

export interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
  done: boolean;
  source: "ai" | "manual";
  /** Optional zone tag, e.g. "A" | "B" | "C". */
  zone?: string;
  /** Timestamp (ms) when the task was marked done. */
  completedAt?: number | null;
}

export interface SprayPlan {
  id: string;
  disease: string;
  zone: string;
  startDate: string;
  steps: { day: number; action: string; done: boolean }[];
  status: "active" | "completed" | "cancelled";
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  /** Optional KrishiGPT action chips persisted with the reply. */
  actions?: { id: string; label: string; kind: "pump10" | "link" | "ask"; href?: string }[];
}

export interface SensorHistoryPoint {
  timestamp: number;
  tempC: number;
  humidity: number;
  aqi: number;
  soilMoistureA: number;
  soilMoistureB: number;
  waterUsedL: number;
}

/**
 * One row of the /reports 30-day backfill.
 * Synthetic-but-plausible daily rollup so 7-day / 30-day views look full
 * even on a fresh install. Today's row is refreshed live from the store
 * (see `ensureDailySummaries` in store.ts).
 */
export interface DailySummary {
  /** YYYY-MM-DD (local). */
  date: string;
  /** 0–100 farm health score for the day. */
  healthScore: number;
  /** Smart-pump water used that day (litres). */
  waterUsedL: number;
  /** Pump energy that day (kWh). */
  energyKwh: number;
  /** Pump energy cost that day (₹). */
  energyCostRs: number;
  /** Total leaf scans logged that day. */
  scans: number;
  /** …of which resolved. */
  scansResolved: number;
  /** Disease label → count (includes "Healthy"). */
  diseaseCounts: Record<string, number>;
  /** Irrigation runs that day. */
  irrigationEvents: number;
  /** Tasks completed / total assigned that day. */
  tasksDone: number;
  tasksTotal: number;
  /** Day-average climate. */
  avgTempC: number;
  avgHumidity: number;
  /** Diary entries filed that day. */
  diaryCount: number;
}

export type ReportRange = "today" | "7d" | "30d";

export interface Thresholds {
  moistureLow: number;
  moistureHigh: number;
  tempHigh: number;
  humidityLow: number;
  aqiHigh: number;
  tankLow: number;
  pumpDurationSec: number;
}

export interface IrrigationScheduleSlot {
  id: string;
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  /** 24h "HH:MM" local time */
  time: string;
  /** Run length in minutes */
  durationMin: number;
}

export interface FarmLocation {
  /** Decimal degrees, default Ahmedabad. */
  latitude: number;
  longitude: number;
  label: string;
}

export interface FarmProfile {
  /** Display name of the farm (Settings → Farm Profile). */
  farmName: string;
  /** Farmer / owner name. */
  farmerName: string;
  state: string;
  farmSizeAcres: number;
  hasPump: boolean;
  /** crop slugs, e.g. ["tomato","chili","spinach"] */
  crops: string[];
}

export interface AppSettings {
  language: "en" | "hi" | "gu" | "mr";
  mode: "simulation" | "live";
  hardwareGatewayUrl: string;
  cameraSource: "simulation" | "stream";
  cameraStreamUrl: string;
  /** Pan-tilt glide speed (deg per tick, 1–10). Used by Settings → Camera. */
  cameraPanSpeed: number;
  thresholds: Thresholds;
  voiceOutput: boolean;
  /** BCP-47 recognition lang for voice input, e.g. "hi-IN". */
  voiceLang: string;
  /** Critical-alert beep (WebAudio). When false, alerts stay silent. */
  soundEnabled: boolean;
  /** Weekly auto-run slots used by pump "schedule" mode. */
  irrigationSchedule: IrrigationScheduleSlot[];
  /** Farm coordinates used by the /climate Open-Meteo forecast. */
  location: FarmLocation;
  /** Farm profile used by /schemes recommendations + /market "Your Crops". */
  farmProfile: FarmProfile;
  telegram: {
    botToken: string;
    chatId: string;
    enabled: boolean;
  };
}
