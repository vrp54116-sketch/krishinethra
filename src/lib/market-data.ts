/**
 * market-data.ts
 * DEMO DATA — integrate Agmarknet API for production.
 *
 * Realistic Gujarat mandi (APMC) demo prices, ₹ per quintal (100 kg).
 * Source for production: https://agmarknet.gov.in — fetch daily
 * min/modal/max per commodity + market centre and replace this file's
 * loader. Values below are hand-picked plausible demo numbers, NOT live.
 */

export type PriceTrend = "up" | "flat" | "down";

export interface MandiPrice {
  /** slug, e.g. "tomato" */
  id: string;
  /** Display name */
  crop: string;
  /** APMC market centre for this quote */
  market: string;
  /** ₹ per quintal */
  min: number;
  /** ₹ per quintal — highlighted in UI */
  modal: number;
  /** ₹ per quintal */
  max: number;
  /** Last 7 days of modal prices, oldest → newest (₹/quintal) */
  history: number[];
  trend: PriceTrend;
  /** % change: last vs first of history (signed, 1 decimal) */
  changePercent: number;
  /** Simulated crop stage on YOUR farm (for harvest advice) */
  yourStage?: string;
  /** Which zone grows it on your farm, if any */
  yourZone?: "A" | "B" | "C";
}

function trendFromHistory(history: number[]): {
  trend: PriceTrend;
  changePercent: number;
} {
  const first = history[0] ?? 0;
  const last = history[history.length - 1] ?? 0;
  if (!first) return { trend: "flat", changePercent: 0 };
  const pct = Math.round(((last - first) / first) * 1000) / 10;
  return {
    trend: pct >= 3 ? "up" : pct <= -3 ? "down" : "flat",
    changePercent: pct,
  };
}

function make(entry: Omit<MandiPrice, "trend" | "changePercent">): MandiPrice {
  const { trend, changePercent } = trendFromHistory(entry.history);
  return { ...entry, trend, changePercent };
}

export const MARKET_UPDATED_LABEL = "Rates as of today (demo)";

export const MANDI_PRICES: MandiPrice[] = [
  make({
    id: "tomato",
    crop: "Tomato",
    market: "Ahmedabad (Vasna) APMC",
    min: 1400,
    modal: 1850,
    max: 2300,
    history: [1520, 1580, 1610, 1700, 1740, 1810, 1850],
    yourStage: "Fruiting — red-ripe clusters ready",
    yourZone: "A",
  }),
  make({
    id: "onion",
    crop: "Onion",
    market: "Mahesana APMC",
    min: 1100,
    modal: 1480,
    max: 1900,
    history: [1720, 1690, 1640, 1590, 1550, 1510, 1480],
    yourStage: undefined,
    yourZone: undefined,
  }),
  make({
    id: "potato",
    crop: "Potato",
    market: "Deesa APMC",
    min: 850,
    modal: 1180,
    max: 1450,
    history: [1150, 1165, 1170, 1175, 1185, 1180, 1180],
    yourStage: undefined,
    yourZone: undefined,
  }),
  make({
    id: "chili",
    crop: "Green Chili",
    market: "Anand APMC",
    min: 2800,
    modal: 3650,
    max: 4400,
    history: [3150, 3280, 3340, 3420, 3510, 3580, 3650],
    yourStage: "Flowering + early fruit set — first picking near",
    yourZone: "B",
  }),
  make({
    id: "spinach",
    crop: "Spinach",
    market: "Surat APMC",
    min: 1200,
    modal: 1950,
    max: 2600,
    history: [2350, 2280, 2200, 2120, 2050, 1990, 1950],
    yourStage: "Vegetative — leafy, ready for cut-and-regrow harvest",
    yourZone: "C",
  }),
  make({
    id: "wheat",
    crop: "Wheat",
    market: "Rajkot APMC",
    min: 2150,
    modal: 2480,
    max: 2720,
    history: [2420, 2435, 2440, 2455, 2460, 2472, 2480],
    yourStage: undefined,
    yourZone: undefined,
  }),
  make({
    id: "cotton",
    crop: "Cotton (Kapas)",
    market: "Rajkot APMC",
    min: 5600,
    modal: 6680,
    max: 7210,
    history: [6420, 6480, 6520, 6570, 6610, 6645, 6680],
    yourStage: undefined,
    yourZone: undefined,
  }),
  make({
    id: "okra",
    crop: "Okra (Bhindi)",
    market: "Vadodara APMC",
    min: 1900,
    modal: 2780,
    max: 3400,
    history: [2620, 2680, 2650, 2720, 2750, 2730, 2780],
    yourStage: undefined,
    yourZone: undefined,
  }),
];

/** Crops currently grown on YOUR farm (zones A/B/C). */
export const YOUR_CROPS: MandiPrice[] = MANDI_PRICES.filter((m) => m.yourZone);

export function mandiById(id: string): MandiPrice | undefined {
  return MANDI_PRICES.find((m) => m.id === id);
}

/** Estimated income for a yield at modal price. Modal is ₹/quintal (100 kg). */
export function estimateIncome(yieldKg: number, modalPerQuintal: number): number {
  if (!Number.isFinite(yieldKg) || yieldKg <= 0) return 0;
  return Math.round(((yieldKg / 100) * modalPerQuintal) * 100) / 100;
}

export function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/**
 * AI-style harvest advice built from price trend + simulated plant stage.
 * Pure function so the /market page stays a thin view layer.
 */
export function harvestAdviceFor(crop: MandiPrice): string {
  const income20 = formatINR(estimateIncome(20, crop.modal));
  const pct = Math.abs(crop.changePercent);
  const dirWord =
    crop.trend === "up" ? "rising" : crop.trend === "down" ? "cooling" : "steady";
  const arrow = crop.trend === "up" ? "↑" : crop.trend === "down" ? "↓" : "→";

  if (crop.id === "tomato") {
    if (crop.trend === "up")
      return `Tomato price ${arrow}${pct}% this week and ${dirWord}. Your plants are at fruiting stage — harvest within 3–4 days for the best rate. Estimated income for 20 kg at modal: ${income20}. Pick red-ripe clusters early morning and sell same day.`;
    if (crop.trend === "down")
      return `Tomato price ${arrow}${pct}% this week (${dirWord}). Your plants are at fruiting stage — harvest only fully ripe fruit now, hold semi-ripe 2–3 days for a possible rebound. Estimated income for 20 kg: ${income20}.`;
    return `Tomato price is steady (${arrow}${pct}%). Your plants are at fruiting stage — stagger harvest every 2–3 days. Estimated income for 20 kg: ${income20}.`;
  }
  if (crop.id === "chili") {
    if (crop.trend === "up")
      return `Green chili price ${arrow}${pct}% this week and ${dirWord}. Your Zone B plants are at flowering + early fruit set — first picking in ~5–7 days; keep irrigation even. Estimated income for 20 kg: ${income20}.`;
    if (crop.trend === "down")
      return `Green chili price ${arrow}${pct}% (${dirWord}). Your plants are at flowering — do NOT rush picking; let pods size up 4–5 more days. Estimated income for 20 kg: ${income20}.`;
    return `Green chili price is steady. Your plants are at flowering + fruit set — pick every 3–4 days once pods reach finger length. Estimated income for 20 kg: ${income20}.`;
  }
  // spinach
  if (crop.trend === "down")
    return `Spinach price ${arrow}${pct}% this week (${dirWord}). Your Zone C leaves are at vegetative cut stage — harvest NOW (cut-and-regrow) before the price cools further. Estimated income for 20 kg: ${income20}. Harvest early morning, sprinkle water, sell same day.`;
  if (crop.trend === "up")
    return `Spinach price ${arrow}${pct}% and ${dirWord}. Your Zone C crop is at leafy vegetative stage — cut mature outer leaves now and leave the crown to regrow for a second cut. Estimated income for 20 kg: ${income20}.`;
  return `Spinach price is steady. Your crop is at vegetative stage — cut every 10–12 days for repeat income. Estimated income for 20 kg: ${income20}.`;
}
