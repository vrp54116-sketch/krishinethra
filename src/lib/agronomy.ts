/**
 * agronomy.ts
 * Static fertilizer rule table + calculator for the /fertilizer page.
 *
 * Pure functions — no React, no store. Realistic per-crop, per-stage
 * doses for both an organic option (vermicompost + neem cake +
 * jeevamrut) and a chemical option (NPK grade + g/plant + frequency).
 */

import type { DiaryEntry } from "./types";

export type FertilizerCrop =
  | "tomato"
  | "chili"
  | "spinach"
  | "cotton"
  | "wheat"
  | "onion";

export type GrowthStage = "seedling" | "vegetative" | "flowering" | "fruiting";

export type SoilType = "sandy" | "loamy" | "clay";

export const FERTILIZER_CROPS: { id: FertilizerCrop; label: string }[] = [
  { id: "tomato", label: "Tomato" },
  { id: "chili", label: "Chili" },
  { id: "spinach", label: "Spinach" },
  { id: "cotton", label: "Cotton" },
  { id: "wheat", label: "Wheat" },
  { id: "onion", label: "Onion" },
];

export const GROWTH_STAGES: { id: GrowthStage; label: string }[] = [
  { id: "seedling", label: "Seedling" },
  { id: "vegetative", label: "Vegetative" },
  { id: "flowering", label: "Flowering" },
  { id: "fruiting", label: "Fruiting" },
];

export const SOIL_TYPES: { id: SoilType; label: string }[] = [
  { id: "sandy", label: "Sandy" },
  { id: "loamy", label: "Loamy" },
  { id: "clay", label: "Clay" },
];

export interface FertilizerInput {
  crop: FertilizerCrop;
  stage: GrowthStage;
  plantCount: number;
  soilType: SoilType;
  /** Days since the last fertilization (prefilled from diary). */
  daysSinceLastFertilized?: number | null;
}

interface StageDose {
  /** g/plant */
  vermicompostG: number;
  /** g/plant */
  neemCakeG: number;
  jeevamrut: string;
  /** e.g. "19:19:19" */
  npkGrade: string;
  /** g/plant per application */
  chemicalGPerPlant: number;
  /** days between chemical applications */
  frequencyDays: number;
  chemicalNote: string;
  method: string;
}

type CropTable = Record<GrowthStage, StageDose>;

/**
 * Static agronomy rule table. Doses are per plant per application for
 * widely-spaced crops; for dense wheat treat "per plant" as per clump
 * and prefer broadcast (see method notes).
 */
const RULES: Record<FertilizerCrop, CropTable> = {
  tomato: {
    seedling: {
      vermicompostG: 50,
      neemCakeG: 10,
      jeevamrut: "1:10 dilution, 250 ml/plant soil drench",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 2,
      frequencyDays: 15,
      chemicalNote: "Dissolve in water and drench — gentle starter dose.",
      method: "Ring method 5 cm from stem, mix lightly into topsoil, water immediately after.",
    },
    vegetative: {
      vermicompostG: 100,
      neemCakeG: 20,
      jeevamrut: "1:10 dilution, 500 ml/plant soil drench",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 4,
      frequencyDays: 15,
      chemicalNote: "Balanced NPK for leaf + stem growth.",
      method: "Ring method 8 cm from stem, mix lightly into topsoil, water immediately after.",
    },
    flowering: {
      vermicompostG: 150,
      neemCakeG: 25,
      jeevamrut: "1:10 dilution, 750 ml/plant + handful of wood ash for potash",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 5,
      frequencyDays: 15,
      chemicalNote: "Balanced feed every 15 days through flowering.",
      method: "Side-dress in a ring 10 cm from stem, cover with soil, irrigate in the evening.",
    },
    fruiting: {
      vermicompostG: 200,
      neemCakeG: 30,
      jeevamrut: "1:10 dilution, 750 ml/plant every 15 days",
      npkGrade: "13:0:45",
      chemicalGPerPlant: 5,
      frequencyDays: 12,
      chemicalNote: "High-potash feed for fruit size and colour; ease off nitrogen.",
      method: "Side-dress 10 cm from stem, cover with soil, irrigate in the evening.",
    },
  },
  chili: {
    seedling: {
      vermicompostG: 40,
      neemCakeG: 10,
      jeevamrut: "1:10 dilution, 200 ml/plant soil drench",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 1.5,
      frequencyDays: 15,
      chemicalNote: "Light starter dose — chili seedlings burn easily.",
      method: "Ring method 5 cm from stem, water immediately after.",
    },
    vegetative: {
      vermicompostG: 80,
      neemCakeG: 15,
      jeevamrut: "1:10 dilution, 400 ml/plant soil drench",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 3,
      frequencyDays: 15,
      chemicalNote: "Balanced NPK for branching.",
      method: "Ring method 8 cm from stem, mix into topsoil, irrigate.",
    },
    flowering: {
      vermicompostG: 120,
      neemCakeG: 20,
      jeevamrut: "1:10 dilution, 500 ml/plant + wood ash",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 4,
      frequencyDays: 15,
      chemicalNote: "Hold nitrogen steady — excess N drops flowers.",
      method: "Side-dress 10 cm from stem, cover, evening irrigation.",
    },
    fruiting: {
      vermicompostG: 150,
      neemCakeG: 25,
      jeevamrut: "1:10 dilution, 500 ml/plant every 15 days",
      npkGrade: "13:0:45",
      chemicalGPerPlant: 4,
      frequencyDays: 12,
      chemicalNote: "Potash-heavy feed for pungency and fruit weight.",
      method: "Side-dress 10 cm from stem, cover, evening irrigation.",
    },
  },
  spinach: {
    seedling: {
      vermicompostG: 30,
      neemCakeG: 5,
      jeevamrut: "1:15 dilution, 150 ml/plant",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 1,
      frequencyDays: 10,
      chemicalNote: "Very light foliar-safe dose for tender leaves.",
      method: "Broadcast between rows and water gently — avoid leaf contact.",
    },
    vegetative: {
      vermicompostG: 60,
      neemCakeG: 10,
      jeevamrut: "1:10 dilution, 300 ml/plant",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 2,
      frequencyDays: 10,
      chemicalNote: "Leafy growth loves nitrogen — keep the 10-day rhythm.",
      method: "Broadcast between rows in the evening, irrigate after.",
    },
    flowering: {
      vermicompostG: 60,
      neemCakeG: 10,
      jeevamrut: "1:10 dilution, 300 ml/plant",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 2,
      frequencyDays: 12,
      chemicalNote: "Bolting started — harvest leaves now rather than pushing feed.",
      method: "Light broadcast, evening irrigation. Prefer harvest over feeding.",
    },
    fruiting: {
      vermicompostG: 50,
      neemCakeG: 10,
      jeevamrut: "1:10 dilution, 250 ml/plant (seed crop only)",
      npkGrade: "13:0:45",
      chemicalGPerPlant: 2,
      frequencyDays: 12,
      chemicalNote: "Only for seed crop; stop feeding leaf-harvest beds.",
      method: "Light broadcast for seed beds only.",
    },
  },
  cotton: {
    seedling: {
      vermicompostG: 60,
      neemCakeG: 15,
      jeevamrut: "1:10 dilution, 300 ml/plant",
      npkGrade: "20:20:0",
      chemicalGPerPlant: 4,
      frequencyDays: 20,
      chemicalNote: "Phosphorus-rich basal for root establishment.",
      method: "Basal ring 8 cm from plant, cover with soil, irrigate.",
    },
    vegetative: {
      vermicompostG: 120,
      neemCakeG: 25,
      jeevamrut: "1:10 dilution, 500 ml/plant",
      npkGrade: "20:20:0",
      chemicalGPerPlant: 6,
      frequencyDays: 20,
      chemicalNote: "Split urea + DAP equivalent through squaring.",
      method: "Side-dress 12 cm from stem, cover, irrigate.",
    },
    flowering: {
      vermicompostG: 150,
      neemCakeG: 30,
      jeevamrut: "1:10 dilution, 750 ml/plant + wood ash",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 6,
      frequencyDays: 15,
      chemicalNote: "Balanced feed at peak flowering for boll setting.",
      method: "Side-dress between rows, cover, evening irrigation.",
    },
    fruiting: {
      vermicompostG: 180,
      neemCakeG: 30,
      jeevamrut: "1:10 dilution, 750 ml/plant",
      npkGrade: "13:0:45",
      chemicalGPerPlant: 6,
      frequencyDays: 15,
      chemicalNote: "Potash for boll weight; stop nitrogen to avoid rank growth.",
      method: "Side-dress between rows, cover, evening irrigation.",
    },
  },
  wheat: {
    seedling: {
      vermicompostG: 20,
      neemCakeG: 5,
      jeevamrut: "1:10 dilution, 100 ml/clump",
      npkGrade: "Urea 46:0:0",
      chemicalGPerPlant: 1.5,
      frequencyDays: 21,
      chemicalNote: "First nitrogen at crown-root initiation (~21 days).",
      method: "Broadcast evenly before a light irrigation (per clump dose).",
    },
    vegetative: {
      vermicompostG: 40,
      neemCakeG: 8,
      jeevamrut: "1:10 dilution, 200 ml/clump",
      npkGrade: "Urea 46:0:0",
      chemicalGPerPlant: 2.5,
      frequencyDays: 21,
      chemicalNote: "Tillering dose — apply before irrigation, never on dry soil.",
      method: "Broadcast before irrigation in the evening.",
    },
    flowering: {
      vermicompostG: 50,
      neemCakeG: 10,
      jeevamrut: "1:15 dilution foliar, 250 ml/clump",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 2,
      frequencyDays: 15,
      chemicalNote: "Light balanced dose at heading — do not over-apply nitrogen.",
      method: "Foliar spray early morning or broadcast before light irrigation.",
    },
    fruiting: {
      vermicompostG: 50,
      neemCakeG: 10,
      jeevamrut: "Stop jeevamrut at grain-fill; compost only",
      npkGrade: "13:0:45",
      chemicalGPerPlant: 2,
      frequencyDays: 15,
      chemicalNote: "Potash only for grain weight; excess N lodges the crop.",
      method: "Single light broadcast; avoid late nitrogen.",
    },
  },
  onion: {
    seedling: {
      vermicompostG: 30,
      neemCakeG: 8,
      jeevamrut: "1:15 dilution, 150 ml/plant",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 1.5,
      frequencyDays: 15,
      chemicalNote: "Gentle starter for transplants.",
      method: "Broadcast between rows, light irrigation after.",
    },
    vegetative: {
      vermicompostG: 70,
      neemCakeG: 15,
      jeevamrut: "1:10 dilution, 300 ml/plant",
      npkGrade: "19:19:19",
      chemicalGPerPlant: 3,
      frequencyDays: 15,
      chemicalNote: "Steady NPK for leaf growth — leaves feed the bulb.",
      method: "Broadcast between rows in the evening, irrigate.",
    },
    flowering: {
      vermicompostG: 100,
      neemCakeG: 20,
      jeevamrut: "1:10 dilution, 400 ml/plant + wood ash",
      npkGrade: "13:0:45",
      chemicalGPerPlant: 3,
      frequencyDays: 15,
      chemicalNote: "Bulb initiation — potash for bulb size, ease off nitrogen.",
      method: "Side-dress along rows, cover lightly, evening irrigation.",
    },
    fruiting: {
      vermicompostG: 100,
      neemCakeG: 20,
      jeevamrut: "Stop all feeding at bulb maturity — cure in the field",
      npkGrade: "Stop chemical",
      chemicalGPerPlant: 0,
      frequencyDays: 0,
      chemicalNote: "Stop all fertilizer 3 weeks before harvest for bulb quality.",
      method: "No application — stop feeding, reduce irrigation for curing.",
    },
  },
};

export interface OrganicResult {
  vermicompostGPerPlant: number;
  neemCakeGPerPlant: number;
  jeevamrut: string;
  totalVermicompostKg: number;
  totalNeemCakeKg: number;
}

export interface ChemicalResult {
  grade: string;
  gPerPlant: number;
  frequencyDays: number;
  totalKg: number;
  note: string;
  stopped: boolean;
}

export interface FertilizerResult {
  crop: FertilizerCrop;
  stage: GrowthStage;
  plantCount: number;
  soilType: SoilType;
  organic: OrganicResult;
  chemical: ChemicalResult;
  method: string;
  bestTime: string;
  nextDueInDays: number;
  /** YYYY-MM-DD */
  nextDueDate: string;
  warnings: string[];
  soilNote: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isoPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Map plant age in days to a growth stage (per-crop bands). */
export function stageFromAgeDays(
  crop: FertilizerCrop,
  ageDays: number,
): GrowthStage {
  const bands: Record<FertilizerCrop, [number, number, number]> = {
    // [seedlingEnd, vegetativeEnd, floweringEnd]
    tomato: [20, 45, 70],
    chili: [25, 55, 85],
    spinach: [12, 30, 40],
    cotton: [30, 70, 110],
    wheat: [21, 60, 90],
    onion: [25, 60, 90],
  };
  const [s, v, f] = bands[crop];
  if (ageDays <= s) return "seedling";
  if (ageDays <= v) return "vegetative";
  if (ageDays <= f) return "flowering";
  return "fruiting";
}

/** Days since the most recent diary entry of type "fertilizer". */
export function daysSinceLastFertilizer(
  diary: DiaryEntry[],
): number | null {
  const fert = diary.filter((d) => d.type === "fertilizer");
  if (fert.length === 0) return null;
  let min = Number.POSITIVE_INFINITY;
  const now = Date.now();
  for (const e of fert) {
    const t = new Date(`${e.date}T00:00:00`).getTime();
    if (Number.isNaN(t)) continue;
    min = Math.min(min, (now - t) / (24 * 3600 * 1000));
  }
  if (!Number.isFinite(min)) return null;
  return Math.max(0, Math.floor(min));
}

/* ------------------------------------------------------------------ */
/* Main calculator                                                     */
/* ------------------------------------------------------------------ */

export function calculateFertilizer(input: FertilizerInput): FertilizerResult {
  const base = RULES[input.crop][input.stage];
  const count = Math.max(1, Math.floor(input.plantCount) || 1);

  // Soil adjustments.
  let vermiFactor = 1;
  let chemFactor = 1;
  let soilNote = "Loamy soil holds nutrients well — apply the standard dose.";
  let frequencyDays = base.frequencyDays;
  if (input.soilType === "sandy") {
    vermiFactor = 1.2;
    soilNote =
      "Sandy soil leaches fast — split the dose into 2 halves 3 days apart and add extra compost + mulch.";
    frequencyDays = Math.max(7, base.frequencyDays - 3);
  } else if (input.soilType === "clay") {
    chemFactor = 0.9;
    soilNote =
      "Clay holds nutrients long — use 10% less chemical, single dose, and ensure drainage before applying.";
  }

  const vermiG = round1(base.vermicompostG * vermiFactor);
  const neemG = round1(base.neemCakeG * vermiFactor);
  const chemG = round2(base.chemicalGPerPlant * chemFactor);
  const stopped = base.chemicalGPerPlant === 0 || base.frequencyDays === 0;

  const warnings: string[] = [
    "Never apply on dry soil — water first, fertilize moist soil only.",
    "Don't exceed the dose — extra fertilizer burns roots and wastes money.",
  ];
  if (stopped) {
    warnings.push(
      "Feeding window is over — stop fertilizer and prepare for harvest/curing.",
    );
  } else {
    warnings.push(
      `Keep a 7–10 day waiting gap before harvest when using ${base.npkGrade}. Wash produce before use.`,
    );
  }
  if (input.soilType === "sandy") {
    warnings.push("Sandy soil: mulch after feeding so nutrients don't wash away.");
  }
  if (input.stage === "flowering" || input.stage === "fruiting") {
    warnings.push("Flowering/fruiting: favour potash over nitrogen — excess nitrogen drops flowers.");
  }

  const nextDueInDays = stopped ? 0 : frequencyDays;

  return {
    crop: input.crop,
    stage: input.stage,
    plantCount: count,
    soilType: input.soilType,
    organic: {
      vermicompostGPerPlant: vermiG,
      neemCakeGPerPlant: neemG,
      jeevamrut: base.jeevamrut,
      totalVermicompostKg: round2((vermiG * count) / 1000),
      totalNeemCakeKg: round2((neemG * count) / 1000),
    },
    chemical: {
      grade: base.npkGrade,
      gPerPlant: chemG,
      frequencyDays,
      totalKg: round2((chemG * count) / 1000),
      note: base.chemicalNote,
      stopped,
    },
    method: base.method,
    bestTime: "Early morning (6–8 AM) or evening (5–7 PM) — never at midday heat.",
    nextDueInDays,
    nextDueDate: stopped ? isoPlusDays(0) : isoPlusDays(nextDueInDays),
    warnings,
    soilNote,
  };
}
