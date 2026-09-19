/**
 * ai-engine.ts
 * Rule-based AI brain for KrishiNethra dashboards (live simulation).
 *
 * Pure functions over the zustand farm state — no React, no side effects:
 * - getHealthBreakdown() mirrors the simulation-engine scoring so the
 *   dashboard can explain every factor behind the Farm Health Score.
 * - generateDailyReport() writes a natural English/Hindi summary paragraph
 *   from the current snapshot (health, soil, water, tasks, disease, weather).
 * - suggestActions() ranks agronomy suggestions (water, heat, fungus, AQI,
 *   tank, disease, fertilizer, rain-skip) for the AI Suggestions card.
 */

import type {
  Alert,
  AppSettings,
  DailySummary,
  DiaryEntry,
  DiseaseScan,
  PumpState,
  ReportRange,
  SensorHistoryPoint,
  SensorSnapshot,
  SprayPlan,
  Task,
  Zone,
} from "./types";

export interface AiQuery {
  text: string;
  language: string;
}

export async function askAiAgent(query: AiQuery): Promise<string> {
  void query;
  // TODO: wire offline + online AI agents in later milestones.
  return "AI engine foundation ready. Agents will be implemented next.";
}

/* ------------------------------------------------------------------ */
/* Shared input shape                                                  */
/* ------------------------------------------------------------------ */

/** Minimal slice of the farm store the dashboard AI functions need. */
export interface DashboardAiState {
  snapshot: SensorSnapshot;
  zones: Zone[];
  settings: AppSettings;
  farmHealthScore: number;
  totalWaterUsedL: number;
  tasks: Task[];
  scans: DiseaseScan[];
  alerts: Alert[];
  pump: PumpState;
  sensorHistory: SensorHistoryPoint[];
  diary: DiaryEntry[];
  sprayPlans: SprayPlan[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function f1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

/* ------------------------------------------------------------------ */
/* Health breakdown (mirrors simulation-engine scoring)                */
/* ------------------------------------------------------------------ */

export interface HealthFactor {
  key: "moisture" | "temperature" | "humidity" | "aqi" | "disease";
  label: string;
  /** 0–100 sub-score. */
  score: number;
  detail: string;
}

export function getHealthBreakdown(
  snapshot: SensorSnapshot,
  zones: Zone[],
  unresolvedDiseaseCount: number,
): HealthFactor[] {
  const moistureAvg =
    zones.length > 0
      ? zones.reduce((sum, z) => sum + z.soilMoisture, 0) / zones.length
      : (snapshot.soilMoistureA + snapshot.soilMoistureB) / 2;
  const moistureScore = clamp(100 - Math.abs(moistureAvg - 45) * 2.5, 0, 100);

  const tempScore =
    snapshot.tempC <= 32
      ? 100
      : clamp(100 - (snapshot.tempC - 32) * 15, 0, 100);

  const humidityScore =
    snapshot.humidity >= 50 && snapshot.humidity <= 70
      ? 100
      : snapshot.humidity < 50
        ? clamp(100 - (50 - snapshot.humidity) * 3, 0, 100)
        : clamp(100 - (snapshot.humidity - 70) * 3, 0, 100);

  const aqiScore = clamp(100 - ((snapshot.aqi - 60) * 100) / 140, 0, 100);
  const diseaseScore = clamp(100 - unresolvedDiseaseCount * 25, 0, 100);

  return [
    {
      key: "moisture",
      label: "Soil moisture",
      score: Math.round(moistureScore),
      detail: `Field average ${f1(moistureAvg)}% (ideal ≈ 45%)`,
    },
    {
      key: "temperature",
      label: "Temperature",
      score: Math.round(tempScore),
      detail: `${f1(snapshot.tempC)}°C — comfortable up to 32°C`,
    },
    {
      key: "humidity",
      label: "Humidity",
      score: Math.round(humidityScore),
      detail: `${f1(snapshot.humidity)}% — ideal band 50–70%`,
    },
    {
      key: "aqi",
      label: "Air quality",
      score: Math.round(aqiScore),
      detail: `AQI ${snapshot.aqi} — clean near 60`,
    },
    {
      key: "disease",
      label: "Crop disease",
      score: Math.round(diseaseScore),
      detail:
        unresolvedDiseaseCount === 0
          ? "No active infections"
          : `${unresolvedDiseaseCount} unresolved scan${unresolvedDiseaseCount > 1 ? "s" : ""} (−15 health each)`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Daily report                                                        */
/* ------------------------------------------------------------------ */

function healthWord(score: number, hindi: boolean): string {
  if (hindi) return score > 75 ? "अच्छी" : score >= 50 ? "सामान्य" : "खराब";
  return score > 75 ? "good" : score >= 50 ? "fair" : "poor";
}

function zoneMoistureNote(
  zone: Zone | undefined,
  low: number,
  high: number,
  hindi: boolean,
): string {
  if (!zone) return "";
  const m = f1(zone.soilMoisture);
  if (zone.soilMoisture < low) {
    return hindi
      ? `${zone.name} (${zone.crop}) में नमी ${m}% है — ${low}% की सीमा से कम, सिंचाई ज़रूरी है`
      : `${zone.name} (${zone.crop}) moisture is ${m}% — below the ${low}% threshold and needs water`;
  }
  if (zone.soilMoisture > high) {
    return hindi
      ? `${zone.name} (${zone.crop}) में नमी ${m}% है — ज़्यादा है, अभी सिंचाई रोकें`
      : `${zone.name} (${zone.crop}) moisture is ${m}% — above ${high}%, hold irrigation for now`;
  }
  return hindi
    ? `${zone.name} (${zone.crop}) में नमी ${m}% है — स्वस्थ सीमा में`
    : `${zone.name} (${zone.crop}) moisture is ${m}% — in the healthy range`;
}

function activeDiseaseScan(scans: DiseaseScan[]): DiseaseScan | undefined {
  return scans.find(
    (s) =>
      !s.resolved && s.severity !== "none" && s.disease.toLowerCase() !== "healthy",
  );
}

/**
 * Build a natural-language daily summary from live farm state.
 * English when settings.language is "en", Hindi otherwise.
 */
export function generateDailyReport(state: DashboardAiState): string {
  const { snapshot: s, zones, settings, farmHealthScore, totalWaterUsedL, tasks, scans } =
    state;
  const hindi = settings.language !== "en";
  const t = settings.thresholds;
  const pending = tasks.filter((x) => !x.done);
  const disease = activeDiseaseScan(scans);
  const zoneA = zones.find((z) => z.id === "A");
  const zoneB = zones.find((z) => z.id === "B");

  if (hindi) {
    const parts: string[] = [];
    parts.push(
      `खेत का स्वास्थ्य स्कोर 100 में से ${Math.round(farmHealthScore)} है — कुल मिलाकर ${healthWord(farmHealthScore, true)} स्थिति है।`,
    );
    parts.push(
      `${zoneMoistureNote(zoneA, t.moistureLow, t.moistureHigh, true)}; ${zoneMoistureNote(zoneB, t.moistureLow, t.moistureHigh, true)}।`,
    );
    parts.push(
      `आज अब तक ${totalWaterUsedL.toFixed(2)} लीटर पानी इस्तेमाल हुआ है और टंकी ${f1(s.tankLevelPercent)}% भरी है।`,
    );
    if (pending.length === 0) {
      parts.push("कोई कार्य बकाया नहीं है।");
    } else {
      parts.push(
        `${pending.length} कार्य बकाया हैं, सबसे पहले “${pending[0].title}” पूरा करें।`,
      );
    }
    parts.push(
      disease
        ? `सक्रिय रोग पर ध्यान दें: ${disease.disease} (${disease.severity}) — स्प्रे योजना से इलाज जारी रखें।`
        : "फसल में कोई सक्रिय रोग नहीं है।",
    );
    const weatherBits = `${f1(s.tempC)}°C तापमान और ${f1(s.humidity)}% आर्द्रता है`;
    const rainBit =
      s.rainMm > 0.2
        ? `, ${f1(s.rainMm)} मिमी बारिश हो रही है — सिंचाई छोड़ी जा सकती है`
        : ", अभी बारिश नहीं है";
    const aqiBit =
      s.aqi > t.aqiHigh ? `। AQI ${s.aqi} ज़्यादा है — पत्तों पर छिड़काव टालें` : "";
    parts.push(`${weatherBits}${rainBit} है${aqiBit}।`);
    parts.push(
      state.pump.running
        ? "पंप अभी चल रहा है — नमी बढ़ रही है।"
        : zoneB && zoneB.soilMoisture < t.moistureLow
          ? "सलाह: पंप को Auto AI मोड पर रखें ताकि Zone B को समय पर पानी मिले।"
          : "सलाह: स्थिति स्थिर है — पंप Auto AI मोड पर ही रखें।",
    );
    return parts.join(" ");
  }

  const parts: string[] = [];
  parts.push(
    `Farm health stands at ${Math.round(farmHealthScore)} out of 100 — a ${healthWord(farmHealthScore, false)} day overall.`,
  );
  parts.push(
    `${zoneMoistureNote(zoneA, t.moistureLow, t.moistureHigh, false)}; ${zoneMoistureNote(zoneB, t.moistureLow, t.moistureHigh, false)}.`,
  );
  parts.push(
    `You have used ${totalWaterUsedL.toFixed(2)} litres of water so far today, and the tank is ${f1(s.tankLevelPercent)}% full.`,
  );
  if (pending.length === 0) {
    parts.push("No tasks are pending.");
  } else {
    parts.push(
      `${pending.length} task${pending.length > 1 ? "s are" : " is"} pending, starting with “${pending[0].title}”.`,
    );
  }
  parts.push(
    disease
      ? `Active disease needs follow-up: ${disease.disease} (${disease.severity} severity) — continue the spray plan.`
      : "No active crop disease.",
  );
  const rainBit =
    s.rainMm > 0.2
      ? ` Rainfall of ${f1(s.rainMm)} mm is topping up the field, so irrigation can be skipped.`
      : " No rain at the moment.";
  const aqiBit =
    s.aqi > t.aqiHigh
      ? ` AQI ${s.aqi} is above the safe limit — postpone foliar sprays.`
      : "";
  parts.push(
    `It is ${f1(s.tempC)}°C with ${f1(s.humidity)}% humidity.${rainBit}${aqiBit}`,
  );
  parts.push(
    state.pump.running
      ? "The pump is running right now — moisture is recovering."
      : zoneB && zoneB.soilMoisture < t.moistureLow
        ? "Recommendation: keep the pump in Auto AI mode so Zone B gets watered on time."
        : "Recommendation: conditions are stable — keep the pump in Auto AI mode.",
  );
  return parts.join(" ");
}

/* ------------------------------------------------------------------ */
/* Ranked action suggestions                                           */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Leaf-scanner vision engine (simulated samples + real pixel analysis) */
/* ------------------------------------------------------------------ */

export type LeafSampleId =
  | "healthy"
  | "leaf-spot"
  | "rust"
  | "nutrient"
  | "aphids";

export type LeafSeverity = "none" | "mild" | "medium" | "severe";

export interface LeafAnalysisResult {
  disease: string;
  /** 0–1 confidence. */
  confidence: number;
  severity: LeafSeverity;
  /** 0–100 % leaf area affected. */
  affectedPercent: number;
  /** 6 rows × 8 cols of 0 (green) | 1 (yellow) | 2 (red). */
  severityGrid: number[][];
  treatmentNatural: string[];
  treatmentChemical: string[];
}

interface SampleProfile {
  disease: string;
  severity: LeafSeverity;
  affectedMin: number;
  affectedMax: number;
  natural: string[];
  chemical: string[];
}

const LEAF_TREATMENTS: Record<string, { natural: string[]; chemical: string[] }> = {
  Healthy: {
    natural: [
      "No treatment needed — crop looks healthy. Keep scouting every 3–4 days.",
      "Maintain balanced irrigation; avoid waterlogging the root zone.",
      "Mulch lightly and keep weeds down so leaves stay ventilated.",
    ],
    chemical: ["No chemical needed for a healthy leaf."],
  },
  "Leaf Spot (fungal)": {
    natural: [
      "Remove and destroy affected leaves — do not compost them.",
      "Neem oil 5 ml/L water + few drops of soap — evening spray, coat both leaf sides.",
      "Avoid overhead watering; water at the base in the morning.",
      "Garlic extract spray on neighbouring plants as a preventive barrier.",
    ],
    chemical: [
      "Mancozeb 75% WP @ 2 g/L water — spray in cool evening hours.",
      "Repeat after 10–12 days only if spots keep spreading.",
    ],
  },
  "Leaf Rust": {
    natural: [
      "Pick off rust-spotted leaves and burn or bury them away from the field.",
      "Neem oil 5 ml/L water — evening spray, repeat every 5–7 days.",
      "Space plants for airflow; avoid wetting foliage in the evening.",
      "Cow-urine bio-spray (1:10 diluted) as a traditional preventive.",
    ],
    chemical: [
      "Hexaconazole 5% EC @ 1 ml/L water — single targeted spray.",
      "Mancozeb 75% WP @ 2 g/L as an alternate if rust persists.",
    ],
  },
  "Nutrient Deficiency / Water Stress": {
    natural: [
      "Apply well-rotted compost + cow manure around the root zone.",
      "Seaweed extract foliar spray to correct micronutrient gaps.",
      "Mulch with straw to hold soil moisture; fix the irrigation schedule.",
      "Test soil pH — keep it near 6.5 so nutrients stay available.",
    ],
    chemical: [
      "19:19:19 water-soluble fertilizer @ 5 g/L as foliar feed.",
      "Zinc + Iron micronutrient mix at label dose if yellowing persists.",
    ],
  },
  "Aphids (pest)": {
    natural: [
      "Blast aphids off with a strong jet of water, early morning.",
      "Neem oil 5 ml/L + few drops of soap — evening spray on leaf undersides.",
      "Garlic-chili spray (50 g garlic + 25 g chili per litre, dilute 1:5) every 4 days.",
      "Protect ladybirds and lacewings — they eat aphids naturally.",
    ],
    chemical: [
      "Dimethoate 30% EC @ 1.5 ml/L — only if the colony explodes.",
      "Spray once, then re-scout after 7 days before any repeat.",
    ],
  },
  "Possible Pest Damage": {
    natural: [
      "Inspect leaf undersides and stem joints closely with a magnifier.",
      "Neem oil 5 ml/L water — evening spray as a broad first response.",
      "Garlic-chili spray (50 g garlic + 25 g chili per litre, dilute 1:5).",
      "Set a yellow sticky trap nearby to identify the visiting pest.",
    ],
    chemical: [
      "Hold chemicals until the pest is identified — photo-trap first.",
      "If chewing pests spread: Chlorpyrifos 20% EC @ 2 ml/L, spot spray only.",
    ],
  },
};

function treatmentsFor(disease: string): { natural: string[]; chemical: string[] } {
  return (
    LEAF_TREATMENTS[disease] ?? {
      natural: [
        "Neem oil 5 ml/L water — evening spray as a safe first response.",
        "Remove the worst-affected leaves and monitor daily.",
      ],
      chemical: ["Mancozeb 75% WP @ 2 g/L water — only if the spread worsens."],
    }
  );
}

const SAMPLE_PROFILES: Record<LeafSampleId, SampleProfile> = {
  healthy: {
    disease: "Healthy",
    severity: "none",
    affectedMin: 2,
    affectedMax: 5,
    ...treatmentsFor("Healthy"),
  },
  "leaf-spot": {
    disease: "Leaf Spot (fungal)",
    severity: "medium",
    affectedMin: 18,
    affectedMax: 32,
    ...treatmentsFor("Leaf Spot (fungal)"),
  },
  rust: {
    disease: "Leaf Rust",
    severity: "medium",
    affectedMin: 15,
    affectedMax: 30,
    ...treatmentsFor("Leaf Rust"),
  },
  nutrient: {
    disease: "Nutrient Deficiency / Water Stress",
    severity: "medium",
    affectedMin: 38,
    affectedMax: 55,
    ...treatmentsFor("Nutrient Deficiency / Water Stress"),
  },
  aphids: {
    disease: "Aphids (pest)",
    severity: "mild",
    affectedMin: 8,
    affectedMax: 18,
    ...treatmentsFor("Aphids (pest)"),
  },
};

function randIn(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** 82–95% random confidence for gallery samples. */
function sampleConfidence(): number {
  return Math.round(randIn(0.82, 0.95) * 100) / 100;
}

/** FNV-1a hash → 32-bit seed, so the same scan id always yields the same grid. */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
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

/**
 * Deterministic 6-row × 8-col severity heatmap. The number of hot cells is
 * proportional to affectedPercent; cell placement comes from a PRNG seeded
 * by `seed` (pass the scan id so history re-renders identically).
 * 0 = green (healthy), 1 = yellow (watch), 2 = red (affected).
 */
export function buildSeverityGrid(affectedPercent: number, seed: string): number[][] {
  const rows = 6;
  const cols = 8;
  const total = rows * cols;
  const affected = Math.round((clamp(affectedPercent, 0, 100) / 100) * total);
  const rng = mulberry32(hashSeed(seed || "leaf"));
  const order = Array.from({ length: total }, (_, i) => i);
  // Fisher–Yates with the seeded RNG.
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const hot = new Set(order.slice(0, affected));
  const severeRatio = affectedPercent >= 25 ? 0.65 : affectedPercent >= 12 ? 0.4 : 0.2;
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (!hot.has(idx)) {
        row.push(rng() < 0.08 ? 1 : 0);
      } else {
        row.push(rng() < severeRatio ? 2 : 1);
      }
    }
    grid.push(row);
  }
  return grid;
}

function severityForAffected(affected: number, healthy: boolean): LeafSeverity {
  if (healthy || affected < 6) return "none";
  if (affected < 12) return "mild";
  if (affected < 28) return "medium";
  return "severe";
}

/** Map a gallery sample id to its disease profile. */
export function analyzeLeafSample(
  sampleId: string,
  seed?: string,
): LeafAnalysisResult {
  const profile =
    SAMPLE_PROFILES[sampleId as LeafSampleId] ?? SAMPLE_PROFILES.healthy;
  const affectedPercent = Math.round(randIn(profile.affectedMin, profile.affectedMax));
  const key = seed ?? `${sampleId}-${Date.now()}`;
  return {
    disease: profile.disease,
    confidence: sampleConfidence(),
    severity: profile.severity,
    affectedPercent,
    severityGrid: buildSeverityGrid(affectedPercent, key),
    treatmentNatural: profile.natural,
    treatmentChemical: profile.chemical,
  };
}

/**
 * REAL client-side pixel analysis of an uploaded leaf photo. Samples the
 * canvas pixels and buckets them into green / yellow / brown-or-dark-spot,
 * then applies agronomy rules:
 * - yellow > 35% → Nutrient Deficiency / Water Stress
 * - brown/dark spots > 12% → Leaf Spot (fungal)
 * - green > 70% → Healthy
 * - else → Possible Pest Damage — inspect closely
 */
export function analyzeLeafCanvas(
  canvas: HTMLCanvasElement,
  seed?: string,
): LeafAnalysisResult {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return analyzeLeafSample("healthy", seed);
  }
  const w = canvas.width;
  const h = canvas.height;
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, w, h);
  } catch {
    return analyzeLeafSample("healthy", seed);
  }
  const px = data.data;
  let green = 0;
  let yellow = 0;
  let brown = 0;
  let counted = 0;
  // Stride sampling keeps large phone photos fast.
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 12000)));
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      const a = px[i + 3];
      if (a < 16) continue; // transparent padding
      counted++;
      const brightness = (r + g + b) / 3;
      if (brightness < 52) {
        brown++; // dark necrotic spot
        continue;
      }
      const isBrown =
        r > 70 && r < 175 && g > 30 && g < 130 && b < 110 && r >= g && r - b > 28;
      if (isBrown) {
        brown++;
        continue;
      }
      const isYellow =
        r > 140 && g > 125 && b < 140 && r - b > 35 && g - b > 25;
      if (isYellow) {
        yellow++;
        continue;
      }
      const isGreen = g > 65 && g >= r - 12 && g >= b - 8;
      if (isGreen) {
        green++;
      }
    }
  }
  if (counted === 0) return analyzeLeafSample("healthy", seed);
  const pct = (n: number) => (n / counted) * 100;
  const yellowPct = pct(yellow);
  const brownPct = pct(brown);
  const greenPct = pct(green);
  const key = seed ?? `upload-${Date.now()}`;

  let disease: string;
  let affectedPercent: number;
  let confidence: number;
  if (yellowPct > 35) {
    disease = "Nutrient Deficiency / Water Stress";
    affectedPercent = Math.round(clamp(yellowPct, 5, 95));
    confidence =
      Math.round(clamp(0.8 + ((yellowPct - 35) / 65) * 0.15, 0.8, 0.95) * 100) / 100;
  } else if (brownPct > 12) {
    disease = "Leaf Spot (fungal)";
    affectedPercent = Math.round(clamp(brownPct + yellowPct * 0.4, 5, 95));
    confidence =
      Math.round(clamp(0.8 + ((brownPct - 12) / 50) * 0.15, 0.8, 0.95) * 100) / 100;
  } else if (greenPct > 70) {
    disease = "Healthy";
    affectedPercent = Math.round(clamp(100 - greenPct, 1, 12));
    confidence =
      Math.round(clamp(0.82 + ((greenPct - 70) / 30) * 0.13, 0.82, 0.95) * 100) / 100;
  } else {
    disease = "Possible Pest Damage";
    affectedPercent = Math.round(clamp(100 - greenPct, 8, 60));
    confidence = Math.round(randIn(0.72, 0.85) * 100) / 100;
  }
  const t = treatmentsFor(disease);
  return {
    disease,
    confidence,
    severity: severityForAffected(affectedPercent, disease === "Healthy"),
    affectedPercent,
    severityGrid: buildSeverityGrid(affectedPercent, key),
    treatmentNatural: t.natural,
    treatmentChemical: t.chemical,
  };
}

/**
 * Unified entry: samples resolve from their disease profile, an uploaded
 * photo canvas goes through real pixel analysis. `seed` pins the
 * deterministic severity heatmap (pass the scan id when saving).
 */
export function analyzeLeaf(opts: {
  sampleId?: string | null;
  canvas?: HTMLCanvasElement | null;
  seed?: string;
}): LeafAnalysisResult {
  if (opts.canvas) return analyzeLeafCanvas(opts.canvas, opts.seed);
  return analyzeLeafSample(opts.sampleId ?? "healthy", opts.seed);
}

export type SuggestionSeverity = "critical" | "warning" | "info";

export type SuggestionIcon =
  | "water"
  | "heat"
  | "humidity"
  | "air"
  | "tank"
  | "disease"
  | "fertilizer"
  | "rain"
  | "scout";

export interface Suggestion {
  id: string;
  title: string;
  message: string;
  severity: SuggestionSeverity;
  icon: SuggestionIcon;
  /** Higher = more urgent. The card shows the top 5. */
  score: number;
  actionLabel?: string;
  actionHref?: string;
}

function daysSinceISO(dateISO: string, now: number): number {
  const then = new Date(`${dateISO}T00:00:00`).getTime();
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return (now - then) / (24 * 3600 * 1000);
}

/**
 * Ranked agronomy suggestions from live state. Pure + deterministic —
 * call it on every render and the list refreshes live with the sensors.
 */
export function suggestActions(state: DashboardAiState): Suggestion[] {
  const { snapshot: s, settings, scans, diary } = state;
  const t = settings.thresholds;
  const out: Suggestion[] = [];

  // 1. Water needed — dry zones.
  if (s.soilMoistureB < 20) {
    out.push({
      id: "water-b-critical",
      title: "Zone B critically dry",
      message: `Moisture ${f1(s.soilMoistureB)}% — irrigate immediately.`,
      severity: "critical",
      icon: "water",
      score: 100,
      actionLabel: "Irrigate",
      actionHref: "/irrigation",
    });
  } else if (s.soilMoistureB < t.moistureLow) {
    out.push({
      id: "water-b",
      title: "Zone B needs water",
      message: `Moisture ${f1(s.soilMoistureB)}% is below the ${t.moistureLow}% threshold.`,
      severity: "warning",
      icon: "water",
      score: 95,
      actionLabel: "Irrigate",
      actionHref: "/irrigation",
    });
  }
  if (s.soilMoistureA < t.moistureLow && s.soilMoistureA <= s.soilMoistureB) {
    out.push({
      id: "water-a",
      title: "Zone A needs water",
      message: `Moisture ${f1(s.soilMoistureA)}% is below the ${t.moistureLow}% threshold.`,
      severity: "warning",
      icon: "water",
      score: 85,
      actionLabel: "Irrigate",
      actionHref: "/irrigation",
    });
  }

  // 2. Heat stress.
  if (s.tempC > t.tempHigh) {
    out.push({
      id: "heat",
      title: "Heat stress risk",
      message: `${f1(s.tempC)}°C exceeds ${t.tempHigh}°C — mulch and shade sensitive crops.`,
      severity: s.tempC > t.tempHigh + 3 ? "critical" : "warning",
      icon: "heat",
      score: 88,
      actionLabel: "Climate",
      actionHref: "/climate",
    });
  }

  // 3. Humidity / fungus risk (high) + dry air (low).
  if (s.humidity > 70) {
    out.push({
      id: "fungus",
      title: "Fungus risk — humid air",
      message: `Humidity ${f1(s.humidity)}% favours fungal spread — scout leaves and ventilate.`,
      severity: "warning",
      icon: "humidity",
      score: 76,
      actionLabel: "Scan leaf",
      actionHref: "/camera",
    });
  } else if (s.humidity < t.humidityLow) {
    out.push({
      id: "dry-air",
      title: "Dry air spell",
      message: `Humidity ${f1(s.humidity)}% is low — a short evening irrigation will help.`,
      severity: "warning",
      icon: "humidity",
      score: 70,
      actionLabel: "Irrigate",
      actionHref: "/irrigation",
    });
  }

  // 4. AQI warning.
  if (s.aqi > t.aqiHigh) {
    out.push({
      id: "aqi",
      title: "Poor air quality",
      message: `AQI ${s.aqi} is above ${t.aqiHigh} — delay foliar spraying.`,
      severity: "warning",
      icon: "air",
      score: 72,
      actionLabel: "Climate",
      actionHref: "/climate",
    });
  }

  // 5. Tank refill.
  if (s.tankLevelPercent < 5) {
    out.push({
      id: "tank-critical",
      title: "Tank nearly empty",
      message: `Only ${f1(s.tankLevelPercent)}% left — the pump cannot run. Refill now.`,
      severity: "critical",
      icon: "tank",
      score: 98,
      actionLabel: "Irrigation",
      actionHref: "/irrigation",
    });
  } else if (s.tankLevelPercent < t.tankLow) {
    out.push({
      id: "tank",
      title: "Refill water tank",
      message: `Tank at ${f1(s.tankLevelPercent)}% (below ${t.tankLow}%) — refill soon.`,
      severity: "warning",
      icon: "tank",
      score: 90,
      actionLabel: "Irrigation",
      actionHref: "/irrigation",
    });
  }

  // 6. Disease follow-up.
  const unresolved = scans.filter(
    (x) => !x.resolved && x.severity !== "none" && x.disease.toLowerCase() !== "healthy",
  );
  for (const scan of unresolved.slice(0, 2)) {
    out.push({
      id: `disease-${scan.id}`,
      title: `${scan.disease} follow-up`,
      message: `${scan.severity} severity, ${scan.affectedPercent}% affected — continue treatment.`,
      severity: scan.severity === "severe" ? "critical" : scan.severity === "medium" ? "warning" : "info",
      icon: "disease",
      score: scan.severity === "severe" ? 99 : scan.severity === "medium" ? 86 : 60,
      actionLabel: "Spray plan",
      actionHref: "/spray",
    });
  }

  // 7. Fertilization due — no fertilizer logged in the last 14 days.
  const lastFertilizer = diary
    .filter((d) => d.type === "fertilizer")
    .map((d) => daysSinceISO(d.date, s.timestamp))
    .reduce((min, d) => Math.min(min, d), Number.POSITIVE_INFINITY);
  if (lastFertilizer > 14) {
    out.push({
      id: "fertilizer",
      title: "Fertilization due",
      message:
        lastFertilizer === Number.POSITIVE_INFINITY
          ? "No fertilizer logged yet — check the fertilizer planner."
          : `Last fertilizer was ${Math.floor(lastFertilizer)} days ago — time for the next dose.`,
      severity: "info",
      icon: "fertilizer",
      score: 45,
      actionLabel: "Planner",
      actionHref: "/fertilizer",
    });
  }

  // 8. Irrigation skip — rain is watering the field.
  if (s.rainMm >= 0.3) {
    out.push({
      id: "rain-skip",
      title: "Rain detected — skip irrigation",
      message: `${f1(s.rainMm)} mm rainfall is watering the field for free.`,
      severity: "info",
      icon: "rain",
      score: 65,
      actionLabel: "Climate",
      actionHref: "/climate",
    });
  }

  // Fallback so the card is never empty.
  out.push({
    id: "scout",
    title: "Scout all zones",
    message: "Walk the field and verify what the sensors report.",
    severity: "info",
    icon: "scout",
    score: 15,
    actionLabel: "Farm map",
    actionHref: "/map",
  });

  return out.sort((a, b) => b.score - a.score);
}

/* ------------------------------------------------------------------ */
/* Climate advisor (used by the /climate page)                         */
/* ------------------------------------------------------------------ */

export interface ClimateForecastDay {
  /** YYYY-MM-DD */
  date: string;
  tMax: number;
  tMin: number;
  /** Expected precipitation sum in mm. */
  rainMm: number;
  /** Max precipitation probability 0–100. */
  rainProb: number;
  /** WMO weathercode. */
  code: number;
  /** Optional wind speed in km/h (for the spray-window rule). */
  windKph?: number;
}

export type ClimateAdviceIcon =
  | "heat"
  | "frost"
  | "fungus"
  | "rain"
  | "air"
  | "spray"
  | "clear";

export interface ClimateAdvice {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info" | "good";
  icon: ClimateAdviceIcon;
  /** Higher = more urgent. The card shows all active advices ranked. */
  score: number;
  actionLabel?: string;
  actionHref?: string;
}

/**
 * Rule-based climate advisor over the live snapshot + 5-day forecast.
 * Pure + deterministic — call it on every render.
 *
 * Rules:
 * - heat stress if temp > 35 (shade net + evening irrigation)
 * - frost if temp < 10
 * - fungus risk if humidity > 80 (airflow, avoid evening watering)
 * - rain expected tomorrow > 5mm (skip irrigation → /irrigation)
 * - high AQI > 150 (sensitive crops warning)
 * - best spray window (wind < 10, no rain 24h, evening → /spray)
 */
export function climateAdvice(
  state: Pick<DashboardAiState, "snapshot">,
  forecast: ClimateForecastDay[],
): ClimateAdvice[] {
  const s = state.snapshot;
  const out: ClimateAdvice[] = [];

  // 1. Heat stress.
  if (s.tempC > 35) {
    out.push({
      id: "heat-stress",
      title: "Heat stress risk",
      message: `${f1(s.tempC)}°C — deploy shade net over sensitive crops and irrigate in the cool evening hours. Mulch to hold soil moisture.`,
      severity: s.tempC > 38 ? "critical" : "warning",
      icon: "heat",
      score: 98,
      actionLabel: "Irrigation",
      actionHref: "/irrigation",
    });
  }

  // 2. Frost risk.
  if (s.tempC < 10) {
    out.push({
      id: "frost",
      title: "Frost risk",
      message: `${f1(s.tempC)}°C — cover seedlings with mulch or frost cloth tonight and avoid early-morning irrigation.`,
      severity: s.tempC < 5 ? "critical" : "warning",
      icon: "frost",
      score: 97,
      actionLabel: "Climate",
      actionHref: "/climate",
    });
  }

  // 3. Fungus risk — humid air.
  if (s.humidity > 80) {
    out.push({
      id: "fungus",
      title: "Fungus risk — humid air",
      message: `Humidity ${f1(s.humidity)}% favours fungal spread — improve airflow between rows, avoid evening watering, and scout leaves daily.`,
      severity: "warning",
      icon: "fungus",
      score: 88,
      actionLabel: "Scan leaf",
      actionHref: "/camera",
    });
  }

  // 4. Rain expected tomorrow — skip irrigation.
  const tomorrow = forecast[1];
  if (tomorrow && tomorrow.rainMm > 5) {
    out.push({
      id: "rain-tomorrow",
      title: "Rain expected tomorrow — skip irrigation",
      message: `${f1(tomorrow.rainMm)} mm expected tomorrow (${Math.round(tomorrow.rainProb)}% chance) — hold the pump and let the rain water the field for free.`,
      severity: "info",
      icon: "rain",
      score: 85,
      actionLabel: "Irrigation",
      actionHref: "/irrigation",
    });
  } else if (s.rainMm >= 0.3) {
    out.push({
      id: "rain-now",
      title: "Rain watering the field",
      message: `${f1(s.rainMm)} mm rainfall right now — skip scheduled irrigation today.`,
      severity: "info",
      icon: "rain",
      score: 82,
      actionLabel: "Irrigation",
      actionHref: "/irrigation",
    });
  }

  // 5. High AQI — sensitive crops.
  if (s.aqi > 150) {
    out.push({
      id: "aqi",
      title: "High AQI — protect sensitive crops",
      message: `AQI ${s.aqi} — dust/soot settling on leaves. Delay foliar sprays, rinse sensitive vegetables, and mulch young seedlings.`,
      severity: s.aqi > 250 ? "critical" : "warning",
      icon: "air",
      score: 78,
    });
  }

  // 6. Best spray window — calm wind, no rain in 24h, cool evening.
  const todayRain = forecast[0]?.rainMm ?? s.rainMm;
  const tomorrowRain = forecast[1]?.rainMm ?? 0;
  const wind = forecast[0]?.windKph;
  const calmWind = wind == null || wind < 10;
  const dry24h = s.rainMm < 0.3 && todayRain < 1 && tomorrowRain < 1;
  const mildTemp = s.tempC >= 12 && s.tempC <= 35;
  const okHumidity = s.humidity < 85;
  if (calmWind && dry24h && mildTemp && okHumidity) {
    const windBit =
      wind != null ? `Wind ${f1(wind)} km/h is calm` : "Air is calm";
    out.push({
      id: "spray-window",
      title: "Best spray window this evening",
      message: `${windBit}, no rain in the next 24h — spray after 5 PM for maximum leaf absorption and minimum drift.`,
      severity: "good",
      icon: "spray",
      score: 60,
      actionLabel: "Spray plan",
      actionHref: "/spray",
    });
  }

  // Fallback so the card is never empty.
  if (out.length === 0) {
    out.push({
      id: "stable",
      title: "Climate stable",
      message: `No active climate threats — ${f1(s.tempC)}°C, ${f1(s.humidity)}% humidity. Keep the regular irrigation rhythm.`,
      severity: "good",
      icon: "clear",
      score: 20,
    });
  }

  return out.sort((a, b) => b.score - a.score);
}

/* ------------------------------------------------------------------ */
/* Smart Spray Planner — day-by-day rule table                         */
/* ------------------------------------------------------------------ */

export type SprayPreference = "natural" | "chemical";

export interface SprayStepTemplate {
  /** Day offset from the plan start date (1 = start day). */
  day: number;
  action: string;
}

/** Manual disease list offered by the [New Plan] wizard. */
export const SPRAY_DISEASE_OPTIONS = [
  "Leaf Spot",
  "Rust",
  "Aphids",
  "Whitefly",
  "Fungal",
] as const;

/**
 * Static agronomy rule table: disease × preference → day-by-day steps.
 * Natural-first options always lead with neem / traps / cultural control;
 * chemical options name a single targeted molecule at label dose and
 * escalate only if scouting shows the spread worsening.
 */
const SPRAY_RULES: Record<string, Record<SprayPreference, SprayStepTemplate[]>> = {
  aphids: {
    natural: [
      { day: 1, action: "Neem oil 5 ml/L water + few drops of soap — evening spray, coat leaf undersides" },
      { day: 2, action: "Scout 10 sample plants — count aphids and note ladybird activity" },
      { day: 3, action: "Install yellow sticky traps + garlic-chili spray (50 g garlic + 25 g chili/L, dilute 1:5)" },
      { day: 5, action: "Repeat neem oil 5 ml/L spray in the cool evening hours" },
      { day: 7, action: "Review infestation level — close the plan or extend by 7 days" },
    ],
    chemical: [
      { day: 1, action: "Dimethoate 30% EC @ 1.5 ml/L water — evening spot spray on colonies only" },
      { day: 3, action: "Scout 10 sample plants — check colony collapse and beneficial insects" },
      { day: 7, action: "Review — repeat once only if colonies explode, else close the plan" },
    ],
  },
  "leaf spot": {
    natural: [
      { day: 1, action: "Remove and destroy spotted leaves (do not compost) + neem oil 5 ml/L evening spray" },
      { day: 3, action: "Garlic extract spray on neighbouring plants; switch to base watering, no overhead wetting" },
      { day: 5, action: "Repeat neem oil 5 ml/L spray — coat both leaf sides" },
      { day: 7, action: "Review spread on new leaves — close the plan or extend by 7 days" },
    ],
    chemical: [
      { day: 1, action: "Mancozeb 75% WP @ 2 g/L water — spray in cool evening hours" },
      { day: 5, action: "Scout new leaves — measure whether spots stopped spreading" },
      { day: 11, action: "Repeat Mancozeb only if spots keep spreading; otherwise close the plan" },
    ],
  },
  rust: {
    natural: [
      { day: 1, action: "Pick off rust-spotted leaves (burn or bury away from field) + neem oil 5 ml/L evening spray" },
      { day: 3, action: "Cow-urine bio-spray 1:10 diluted as traditional preventive; space plants for airflow" },
      { day: 5, action: "Repeat neem oil 5 ml/L spray; avoid wetting foliage in the evening" },
      { day: 7, action: "Review pustules on new leaves — close the plan or extend by 7 days" },
    ],
    chemical: [
      { day: 1, action: "Hexaconazole 5% EC @ 1 ml/L water — single targeted evening spray" },
      { day: 7, action: "Scout for fresh pustules — close if clean" },
      { day: 14, action: "Alternate Mancozeb 75% WP @ 2 g/L only if rust persists, then close" },
    ],
  },
  whitefly: {
    natural: [
      { day: 1, action: "Neem oil 5 ml/L evening spray + install yellow sticky traps (5 per acre at canopy height)" },
      { day: 3, action: "Garlic-chili spray + shake plants in the morning to monitor adult cloud" },
      { day: 5, action: "Repeat neem oil 5 ml/L spray; clear weeds that host whitefly" },
      { day: 7, action: "Review trap counts — close the plan or extend by 7 days" },
    ],
    chemical: [
      { day: 1, action: "Acetamiprid 20% SP @ 0.5 g/L water — evening spray, rotate molecule next round" },
      { day: 3, action: "Check trap counts + sooty mould on lower leaves" },
      { day: 10, action: "Repeat once only above threshold (8–10 adults/leaf), then close" },
    ],
  },
  fungal: {
    natural: [
      { day: 1, action: "Remove affected parts (do not compost) + neem oil 5 ml/L evening spray" },
      { day: 3, action: "Improve airflow between rows; water at the base in the morning only" },
      { day: 5, action: "Repeat neem oil spray + dust wood ash on the root zone" },
      { day: 7, action: "Review new growth — close the plan or extend by 7 days" },
    ],
    chemical: [
      { day: 1, action: "Copper oxychloride 50% WP @ 3 g/L water — evening protective spray" },
      { day: 5, action: "Scout for fresh lesions on new leaves" },
      { day: 12, action: "Repeat once only if lesions spread, then close the plan" },
    ],
  },
};

/** Map scan labels ("Leaf Spot (fungal)", "Aphids (pest)", …) to rule keys. */
export function normalizeSprayDisease(disease: string): string {
  const d = disease.toLowerCase();
  if (d.includes("aphid")) return "aphids";
  if (d.includes("whitefly")) return "whitefly";
  if (d.includes("rust")) return "rust";
  if (d.includes("spot")) return "leaf spot";
  if (d.includes("fungal") || d.includes("fungus") || d.includes("mildew") || d.includes("blight"))
    return "fungal";
  if (d.includes("pest")) return "aphids";
  if (d.includes("nutrient") || d.includes("healthy") || d.includes("none")) return "fungal";
  return "fungal";
}

/**
 * Auto-generate the day-by-day spray steps for a disease + preference.
 * Always returns a fresh array (callers add `done: false` per step).
 */
export function generateSprayPlanSteps(
  disease: string,
  preference: SprayPreference,
): SprayStepTemplate[] {
  const key = normalizeSprayDisease(disease);
  const table = SPRAY_RULES[key] ?? SPRAY_RULES.fungal;
  return table[preference].map((s) => ({ ...s }));
}

/* ------------------------------------------------------------------ */
/* Period report (used by the /reports page)                           */
/* ------------------------------------------------------------------ */

const PERIOD_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${PERIOD_MONTHS[(m || 1) - 1]}`;
}

function rangeLabel(range: ReportRange): string {
  if (range === "today") return "today";
  if (range === "7d") return "the last 7 days";
  return "the last 30 days";
}

/**
 * Auto-write a plain-English period summary from daily rollups.
 * Covers best day, worst day, most common issue and next-week advice.
 * Pure + deterministic — safe to call on every render.
 */
export function generatePeriodReport(
  dailySummaries: DailySummary[],
  range: ReportRange,
): string {
  if (dailySummaries.length === 0) {
    return "Not enough history yet — run the pump, log diary entries and scan a leaf, then check back. Today's live readings will seed this report automatically.";
  }
  const rows = [...dailySummaries].sort((a, b) => a.date.localeCompare(b.date));

  let best = rows[0];
  let worst = rows[0];
  for (const r of rows) {
    if (r.healthScore > best.healthScore) best = r;
    if (r.healthScore < worst.healthScore) worst = r;
  }

  const avgHealth = rows.reduce((s, r) => s + r.healthScore, 0) / rows.length;
  const totalWater = rows.reduce((s, r) => s + r.waterUsedL, 0);
  const avgWater = totalWater / rows.length;
  const baseline = rows.length * 6;
  const saved = baseline - totalWater;
  const totalScans = rows.reduce((s, r) => s + r.scans, 0);
  const totalResolved = rows.reduce((s, r) => s + r.scansResolved, 0);
  const totalIrrigation = rows.reduce((s, r) => s + r.irrigationEvents, 0);
  const doneTasks = rows.reduce((s, r) => s + r.tasksDone, 0);
  const totalTasks = rows.reduce((s, r) => s + r.tasksTotal, 0);
  const avgTemp = rows.reduce((s, r) => s + r.avgTempC, 0) / rows.length;
  const avgHum = rows.reduce((s, r) => s + r.avgHumidity, 0) / rows.length;

  const diseaseTotals = new Map<string, number>();
  for (const r of rows) {
    for (const [k, v] of Object.entries(r.diseaseCounts ?? {})) {
      diseaseTotals.set(k, (diseaseTotals.get(k) ?? 0) + v);
    }
  }
  const sickEntries = [...diseaseTotals.entries()].filter(
    ([k]) => k.toLowerCase() !== "healthy",
  );
  sickEntries.sort((a, b) => b[1] - a[1]);
  const topDisease = sickEntries.length > 0 ? sickEntries[0] : null;

  const healthWord =
    avgHealth > 75 ? "strong" : avgHealth >= 60 ? "steady" : "under stress";

  // Trend: second half vs first half (or today vs rest for single-day ranges).
  let trendBit = "";
  if (rows.length >= 4) {
    const half = Math.floor(rows.length / 2);
    const first = rows.slice(0, half);
    const second = rows.slice(half);
    const avgFirst = first.reduce((s, r) => s + r.healthScore, 0) / first.length;
    const avgSecond = second.reduce((s, r) => s + r.healthScore, 0) / second.length;
    const delta = avgSecond - avgFirst;
    trendBit =
      delta >= 3
        ? ` Health is trending up (+${delta.toFixed(0)} points in the recent half).`
        : delta <= -3
          ? ` Health slipped (−${Math.abs(delta).toFixed(0)} points in the recent half) — worth a closer look.`
          : " Health held roughly flat across the period.";
  }

  const rangeText = rangeLabel(range);
  const parts: string[] = [];

  if (rows.length === 1) {
    const r = rows[0];
    parts.push(
      `Today (${fmtShortDate(r.date)}) the farm scored ${r.healthScore}/100 — ${healthWord} overall, with ${r.waterUsedL.toFixed(2)} L pumped against a 6 L manual baseline.`,
    );
  } else {
    parts.push(
      `Across ${rangeText} the farm averaged ${avgHealth.toFixed(0)}/100 — ${healthWord} overall.${trendBit} Best day was ${fmtShortDate(best.date)} at ${best.healthScore}/100; toughest was ${fmtShortDate(worst.date)} at ${worst.healthScore}/100.`,
    );
    parts.push(
      `Water averaged ${avgWater.toFixed(2)} L/day (${totalWater.toFixed(1)} L total vs ${baseline.toFixed(0)} L manual habit), saving about ${saved.toFixed(1)} L. ${totalIrrigation} irrigation run${totalIrrigation === 1 ? "" : "s"} kept moisture in range through ${avgTemp.toFixed(1)}°C days and ${avgHum.toFixed(0)}% humidity.`,
    );
  }

  if (totalScans === 0) {
    parts.push("No leaf scans were logged in this window — a quick camera sweep of all three zones would confirm the clean bill of health.");
  } else {
    const resPct = Math.round((totalResolved / Math.max(1, totalScans)) * 100);
    if (topDisease) {
      parts.push(
        `Most common issue: ${topDisease[0]} (${topDisease[1]} finding${topDisease[1] === 1 ? "" : "s"} across ${totalScans} scan${totalScans === 1 ? "" : "s"}, ${resPct}% resolved).`,
      );
    } else {
      parts.push(
        `All ${totalScans} scan${totalScans === 1 ? "" : "s"} came back healthy (${resPct}% marked resolved) — no active outbreak in this window.`,
      );
    }
  }

  if (totalTasks > 0) {
    const pct = Math.round((doneTasks / totalTasks) * 100);
    parts.push(
      `${doneTasks}/${totalTasks} tasks completed (${pct}%)${pct < 60 ? " — a backlog is building, clear overdue items first" : pct < 85 ? " — decent pace, keep closing the loop daily" : " — excellent follow-through"}.`,
    );
  }

  // Recommendation for next week.
  let advice: string;
  if (topDisease && topDisease[1] >= 2) {
    advice = `Next week: keep scouting for ${topDisease[0]} every 2–3 days, continue the neem-oil evening routine on affected zones, and improve airflow between rows so humidity near ${avgHum.toFixed(0)}% stops favouring spread.`;
  } else if (avgTemp > 33) {
    advice = `Next week: heat near ${avgTemp.toFixed(1)}°C is the main load — mulch exposed soil, irrigate in the cool evening hours, and hold foliar sprays for calm, dry evenings.`;
  } else if (avgHealth < 68) {
    advice = "Next week: prioritise one deep evening irrigation for the driest zone, refill the tank above 50%, and re-scan any yellowing leaves so small issues don't compound.";
  } else if (totalTasks > 0 && doneTasks / totalTasks < 0.6) {
    advice = "Next week: block 20 minutes each morning for the task list — finishing overdue irrigation and scouting tasks will lift the score faster than any input.";
  } else if (avgWater > 4.2) {
    advice = "Next week: water use is creeping toward the manual baseline — add straw mulch and shorten each run by a minute to bank the savings without stressing the crop.";
  } else {
    advice = "Next week: stay the course — same early-morning scouting rhythm, one fertilizer check on the 15-day cycle, and keep the pump in Auto AI mode.";
  }
  parts.push(advice);

  return parts.join(" ");
}
