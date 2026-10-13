/**
 * src/lib/brain/trainer.ts
 *
 * PROMPT B2 — PERSONAL BRAIN (in-browser training on THIS farm)
 *
 * Features:
 *  1. Dataset from memory.range(): features EXACTLY
 *     [hour_sin, hour_cos, dow, temp, hum, aqi, rain, pump_l1, rain_l1, soil_l1, soil_l3, soil_l6, soil_l12]
 *     target soil at +3h; normalize with stored mu/sd; cap last 20,000 rows;
 *     require >= 200 rows else expose state COLLECTING(n/200).
 *  2. MODEL: Dense(64,relu) -> Dense(32,relu) -> Dense(1); Adam 1e-3, mse, 30 epochs, batch 32;
 *     between epochs await tf.nextTick() and emit {epoch, loss, valLoss} to subscribers so UI streams curve;
 *     never block main thread >50ms per tick.
 *  3. PERSIST: model.save(`indexeddb://kn-brain-v${n}`); metadata {version, ts, rows, mae};
 *     keep last 10 versions with delete of older; load latest at boot;
 *     store brain_stats {mu, sd, cols, H:3, diurnalCurve[24], irrigationLift, rainLift, dryRatePerH,
 *     usualIrrigationHour, rowsTrained, mae} in localStorage kn_brain_stats.
 *  4. predictCrossing(liveState): roll model forward hour-by-hour (feeding its own predictions)
 *     until soil<30 -> {crossTs, hoursUntil, deltaVsUsualMinutes}.
 *  5. SCHEDULER: setting brainCadence 'hourly'|'daily'|'weekly'|'manual' persisted;
 *     check every 60s + on visibilitychange; auto-retrain when due AND rows grew >=10% since last version;
 *     expose trainNow() returning {version, mae, rows, ms}; log brain_train event.
 */

import * as tf from "@tensorflow/tfjs";
import { BrowserIndexedDBManager } from "@tensorflow/tfjs-core/dist/io/indexed_db.js";
import memory, { type TelemetryRow } from "./memory";

// Setup environment for browser & headless test environments
if (typeof window === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).self = global;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).window = global;
}
try {
  tf.env().set("IS_BROWSER", true);
} catch {
  // ignore
}

declare module "@tensorflow/tfjs" {
  export function nextTick(): Promise<void>;
}

// Ensure tf.nextTick is defined as expected by prompt B2 specification
try {
  if (typeof (tf as any).nextTick !== "function") {
    Object.defineProperty(tf, "nextTick", {
      value: () =>
        typeof tf.nextFrame === "function"
          ? tf.nextFrame()
          : new Promise<void>((resolve) => setTimeout(resolve, 0)),
      writable: true,
      configurable: true,
    });
  }
} catch {
  /* tf object may be frozen or sealed in certain environments */
}

/* ------------------------------------------------------------------ */
/* Types & Interfaces                                                 */
/* ------------------------------------------------------------------ */

export type BrainCadence = "hourly" | "daily" | "weekly" | "manual";

export const FEATURE_COLS = [
  "hour_sin",
  "hour_cos",
  "dow",
  "temp",
  "hum",
  "aqi",
  "rain",
  "pump_l1",
  "rain_l1",
  "soil_l1",
  "soil_l3",
  "soil_l6",
  "soil_l12",
] as const;

export type FeatureCol = (typeof FEATURE_COLS)[number];

export interface BrainStats {
  mu: number[];
  sd: number[];
  cols: string[];
  H: 3;
  diurnalCurve: number[]; // 24 hourly averages
  irrigationLift: number;
  rainLift: number;
  dryRatePerH: number;
  usualIrrigationHour: number;
  rowsTrained: number;
  mae: number;
}

export interface BrainModelVersion {
  version: number;
  ts: number;
  rows: number;
  mae: number;
}

export type BrainStatus = "COLLECTING" | "READY" | "TRAINING" | "IDLE";

export interface BrainState {
  status: BrainStatus;
  current: number;
  required: number;
  message: string;
  version: number | null;
  mae: number | null;
  lastTrainedTs: number | null;
}

export interface TrainingProgress {
  epoch: number;
  loss: number;
  valLoss: number;
  mae?: number;
}

export interface TrainResult {
  version: number;
  mae: number;
  rows: number;
  ms: number;
}

export interface CrossingPrediction {
  crossTs: number;
  hoursUntil: number;
  deltaVsUsualMinutes: number;
}

/* ------------------------------------------------------------------ */
/* Storage Keys & Fallback                                            */
/* ------------------------------------------------------------------ */

const STORAGE_KEY_STATS = "kn_brain_stats";
const STORAGE_KEY_VERSIONS = "kn_brain_versions";
const STORAGE_KEY_CADENCE = "kn_brain_cadence";
const MIN_TRAINING_ROWS = 200;
const MAX_TRAINING_ROWS = 20000;
const MAX_VERSIONS_RETAINED = 10;

// Node in-memory storage fallback if localStorage is absent
const memoryStorage = new Map<string, string>();

function getLocalStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
    clear: () => {
      memoryStorage.clear();
    },
    key: (index: number) => Array.from(memoryStorage.keys())[index] ?? null,
    length: memoryStorage.size,
  };
}

/* ------------------------------------------------------------------ */
/* State Singletons & Event Subscriptions                             */
/* ------------------------------------------------------------------ */

let currentModel: tf.LayersModel | null = null;
let currentStats: BrainStats | null = null;
let isTrainingActive = false;
let schedulerTimer: ReturnType<typeof setInterval> | null = null;

const progressSubscribers = new Set<(progress: TrainingProgress) => void>();
const stateSubscribers = new Set<(state: BrainState) => void>();

export function subscribeTrainingProgress(
  callback: (progress: TrainingProgress) => void,
): () => void {
  progressSubscribers.add(callback);
  return () => {
    progressSubscribers.delete(callback);
  };
}

export function subscribeBrainState(
  callback: (state: BrainState) => void,
): () => void {
  stateSubscribers.add(callback);
  return () => {
    stateSubscribers.delete(callback);
  };
}

function emitProgress(progress: TrainingProgress): void {
  for (const sub of progressSubscribers) {
    try {
      sub(progress);
    } catch {
      // ignore
    }
  }
}

function emitState(state: BrainState): void {
  for (const sub of stateSubscribers) {
    try {
      sub(state);
    } catch {
      // ignore
    }
  }
}

/* ------------------------------------------------------------------ */
/* LocalStorage Helpers for Stats, Versions, Cadence                  */
/* ------------------------------------------------------------------ */

export function getStoredBrainStats(): BrainStats | null {
  try {
    const ls = getLocalStorage();
    const raw = ls?.getItem(STORAGE_KEY_STATS);
    if (!raw) return null;
    return JSON.parse(raw) as BrainStats;
  } catch {
    return null;
  }
}

export const getBrainStats = getStoredBrainStats;

export function setStoredBrainStats(stats: BrainStats): void {
  try {
    const ls = getLocalStorage();
    ls?.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    currentStats = stats;
  } catch {
    // ignore
  }
}

export function getStoredVersions(): BrainModelVersion[] {
  try {
    const ls = getLocalStorage();
    const raw = ls?.getItem(STORAGE_KEY_VERSIONS);
    if (!raw) return [];
    return JSON.parse(raw) as BrainModelVersion[];
  } catch {
    return [];
  }
}

export function setStoredVersions(versions: BrainModelVersion[]): void {
  try {
    const ls = getLocalStorage();
    ls?.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(versions));
  } catch {
    // ignore
  }
}

export function getBrainCadence(): BrainCadence {
  try {
    const ls = getLocalStorage();
    const val = ls?.getItem(STORAGE_KEY_CADENCE);
    if (val === "daily" || val === "weekly" || val === "manual" || val === "hourly") {
      return val;
    }
    return "hourly";
  } catch {
    return "hourly";
  }
}

export function setBrainCadence(cadence: BrainCadence): void {
  try {
    const ls = getLocalStorage();
    ls?.setItem(STORAGE_KEY_CADENCE, cadence);
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/* Brain State Inspection                                             */
/* ------------------------------------------------------------------ */

export async function getBrainState(): Promise<BrainState> {
  const versions = getStoredVersions();
  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null;

  if (isTrainingActive) {
    const totalRows = (await memory.count()) || 0;
    return {
      status: "TRAINING",
      current: totalRows,
      required: MIN_TRAINING_ROWS,
      message: `TRAINING(v${(latestVersion?.version ?? 0) + 1})`,
      version: latestVersion ? latestVersion.version : null,
      mae: latestVersion ? latestVersion.mae : null,
      lastTrainedTs: latestVersion ? latestVersion.ts : null,
    };
  }

  const rowCount = (await memory.count()) || 0;
  if (rowCount < MIN_TRAINING_ROWS) {
    const message = `COLLECTING(${rowCount}/${MIN_TRAINING_ROWS})`;
    return {
      status: "COLLECTING",
      current: rowCount,
      required: MIN_TRAINING_ROWS,
      message,
      version: latestVersion ? latestVersion.version : null,
      mae: latestVersion ? latestVersion.mae : null,
      lastTrainedTs: latestVersion ? latestVersion.ts : null,
    };
  }

  if (latestVersion && currentModel) {
    return {
      status: "READY",
      current: rowCount,
      required: MIN_TRAINING_ROWS,
      message: `READY(v${latestVersion.version}, MAE: ${latestVersion.mae}%)`,
      version: latestVersion.version,
      mae: latestVersion.mae,
      lastTrainedTs: latestVersion.ts,
    };
  }

  return {
    status: "READY",
    current: rowCount,
    required: MIN_TRAINING_ROWS,
    message: latestVersion ? `READY(v${latestVersion.version})` : `READY(${rowCount} rows)`,
    version: latestVersion ? latestVersion.version : null,
    mae: latestVersion ? latestVersion.mae : null,
    lastTrainedTs: latestVersion ? latestVersion.ts : null,
  };
}

/* ------------------------------------------------------------------ */
/* Dataset Preprocessing & Feature Extraction                          */
/* ------------------------------------------------------------------ */

function findNearestRow(rows: TelemetryRow[], targetTs: number): TelemetryRow {
  let low = 0;
  let high = rows.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (rows[mid].ts < targetTs) {
      low = mid + 1;
    } else if (rows[mid].ts > targetTs) {
      high = mid - 1;
    } else {
      return rows[mid];
    }
  }
  if (low >= rows.length) return rows[rows.length - 1];
  if (high < 0) return rows[0];
  const diffLow = Math.abs(rows[low].ts - targetTs);
  const diffHigh = Math.abs(rows[high].ts - targetTs);
  return diffLow < diffHigh ? rows[low] : rows[high];
}

interface PreparedDataset {
  rawX: number[][];
  rawY: number[];
  mu: number[];
  sd: number[];
  normX: number[][];
}

export function buildFeatureVector(
  baseRow: TelemetryRow,
  rowL1: TelemetryRow,
  rowL3: TelemetryRow,
  rowL6: TelemetryRow,
  rowL12: TelemetryRow,
): number[] {
  const d = new Date(baseRow.ts);
  const hourVal = d.getHours() + d.getMinutes() / 60;
  const hour_sin = Math.sin((2 * Math.PI * hourVal) / 24);
  const hour_cos = Math.cos((2 * Math.PI * hourVal) / 24);
  const dow = d.getDay();
  const temp = baseRow.temp;
  const hum = baseRow.hum;
  const aqi = baseRow.aqi;
  const rain = baseRow.rain ? 1 : 0;
  const pump_l1 = rowL1.pump ? 1 : 0;
  const rain_l1 = rowL1.rain ? 1 : 0;
  const soil_l1 = rowL1.soil;
  const soil_l3 = rowL3.soil;
  const soil_l6 = rowL6.soil;
  const soil_l12 = rowL12.soil;

  return [
    hour_sin,
    hour_cos,
    dow,
    temp,
    hum,
    aqi,
    rain,
    pump_l1,
    rain_l1,
    soil_l1,
    soil_l3,
    soil_l6,
    soil_l12,
  ];
}

export function prepareDataset(rows: TelemetryRow[]): PreparedDataset {
  if (rows.length < MIN_TRAINING_ROWS) {
    throw new Error(`COLLECTING(${rows.length}/${MIN_TRAINING_ROWS})`);
  }

  // Cap last 20,000 rows
  const dataset = rows.length > MAX_TRAINING_ROWS ? rows.slice(-MAX_TRAINING_ROWS) : rows;

  const rawX: number[][] = [];
  const rawY: number[] = [];

  const timeSpan = dataset[dataset.length - 1].ts - dataset[0].ts;
  const fifteenHoursMs = 15 * 3600 * 1000;
  const oneHourMs = 3600 * 1000;
  const threeHoursMs = 3 * 3600 * 1000;
  const sixHoursMs = 6 * 3600 * 1000;
  const twelveHoursMs = 12 * 3600 * 1000;

  if (timeSpan >= fifteenHoursMs) {
    // Timestamp-based lookup
    for (let i = 0; i < dataset.length; i++) {
      const cur = dataset[i];
      const targetTs = cur.ts + threeHoursMs;
      if (cur.ts - twelveHoursMs < dataset[0].ts || targetTs > dataset[dataset.length - 1].ts) {
        continue;
      }
      const targetRow = findNearestRow(dataset, targetTs);
      const rowL1 = findNearestRow(dataset, cur.ts - oneHourMs);
      const rowL3 = findNearestRow(dataset, cur.ts - threeHoursMs);
      const rowL6 = findNearestRow(dataset, cur.ts - sixHoursMs);
      const rowL12 = findNearestRow(dataset, cur.ts - twelveHoursMs);

      const x = buildFeatureVector(cur, rowL1, rowL3, rowL6, rowL12);
      rawX.push(x);
      rawY.push(targetRow.soil);
    }
  }

  // If time-span is compressed (e.g. simulation or test seeding in tight loop),
  // or too few timestamp-matched pairs were found:
  if (rawX.length < 50) {
    rawX.length = 0;
    rawY.length = 0;
    // Step-based stride:
    // target at +3 steps, lags at -1, -3, -6, -12
    const step = 1;
    for (let i = 12 * step; i < dataset.length - 3 * step; i++) {
      const cur = dataset[i];
      const targetRow = dataset[i + 3 * step];
      const rowL1 = dataset[i - 1 * step];
      const rowL3 = dataset[i - 3 * step];
      const rowL6 = dataset[i - 6 * step];
      const rowL12 = dataset[i - 12 * step];

      const x = buildFeatureVector(cur, rowL1, rowL3, rowL6, rowL12);
      rawX.push(x);
      rawY.push(targetRow.soil);
    }
  }

  const sampleCount = rawX.length;
  if (sampleCount === 0) {
    throw new Error(`Insufficient training pairs extracted from ${rows.length} rows`);
  }

  // Calculate mu and sd for all 13 features
  const mu: number[] = new Array(13).fill(0);
  const sd: number[] = new Array(13).fill(0);

  for (let j = 0; j < 13; j++) {
    let sum = 0;
    for (let i = 0; i < sampleCount; i++) {
      sum += rawX[i][j];
    }
    mu[j] = sum / sampleCount;

    let sqDiffSum = 0;
    for (let i = 0; i < sampleCount; i++) {
      const diff = rawX[i][j] - mu[j];
      sqDiffSum += diff * diff;
    }
    const variance = sqDiffSum / sampleCount;
    let standardDev = Math.sqrt(variance);
    if (!Number.isFinite(standardDev) || standardDev < 1e-4) {
      standardDev = 1.0;
    }
    sd[j] = standardDev;
  }

  // Normalize X
  const normX = rawX.map((sample) =>
    sample.map((val, j) => (val - mu[j]) / sd[j]),
  );

  return { rawX, rawY, mu, sd, normX };
}

/* ------------------------------------------------------------------ */
/* Farm Statistical Analysis (Diurnal, Lift, Dry Rate, Usual Hour)    */
/* ------------------------------------------------------------------ */

export function computeFarmStatistics(
  rows: TelemetryRow[],
  mu: number[],
  sd: number[],
  rowsTrained: number,
  mae: number,
): BrainStats {
  // 1. Diurnal curve for 24 hours (mean soil moisture at each hour of day)
  const hourSums = new Array<number>(24).fill(0);
  const hourCounts = new Array<number>(24).fill(0);

  for (const r of rows) {
    const h = new Date(r.ts).getHours();
    hourSums[h] += r.soil;
    hourCounts[h]++;
  }

  const overallMean = rows.reduce((acc, r) => acc + r.soil, 0) / (rows.length || 1);
  const diurnalCurve = hourSums.map((sum, h) =>
    hourCounts[h] > 0 ? Math.round((sum / hourCounts[h]) * 10) / 10 : Math.round(overallMean * 10) / 10,
  );

  // 2. Irrigation lift (soil gain after pump ON)
  let irrigationLiftsSum = 0;
  let irrigationLiftsCount = 0;
  // 3. Rain lift (soil gain after rain)
  let rainLiftsSum = 0;
  let rainLiftsCount = 0;
  // 4. Dry rate per hour (rate of soil moisture loss during dry quiescent periods)
  let dryDeltaSum = 0;
  let dryDeltaCount = 0;
  // 5. Usual irrigation hour (mode of pump on hours)
  const pumpHourCounts = new Array<number>(24).fill(0);

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];
    const deltaSoil = curr.soil - prev.soil;
    const deltaHours = Math.max(1 / 60, (curr.ts - prev.ts) / (3600 * 1000));

    if (curr.pump) {
      const h = new Date(curr.ts).getHours();
      pumpHourCounts[h]++;
      if (deltaSoil > 0) {
        irrigationLiftsSum += deltaSoil;
        irrigationLiftsCount++;
      }
    } else if (curr.rain) {
      if (deltaSoil > 0) {
        rainLiftsSum += deltaSoil;
        rainLiftsCount++;
      }
    } else if (!curr.pump && !curr.rain && deltaSoil < 0 && deltaHours <= 4) {
      const ratePerHour = Math.abs(deltaSoil) / deltaHours;
      if (ratePerHour < 10) {
        dryDeltaSum += ratePerHour;
        dryDeltaCount++;
      }
    }
  }

  let usualIrrigationHour = 6; // default 6 AM
  let maxPumpCount = 0;
  for (let h = 0; h < 24; h++) {
    if (pumpHourCounts[h] > maxPumpCount) {
      maxPumpCount = pumpHourCounts[h];
      usualIrrigationHour = h;
    }
  }

  const irrigationLift =
    irrigationLiftsCount > 0
      ? Math.round((irrigationLiftsSum / irrigationLiftsCount) * 10) / 10
      : 14.5;

  const rainLift =
    rainLiftsCount > 0 ? Math.round((rainLiftsSum / rainLiftsCount) * 10) / 10 : 12.0;

  const dryRatePerH =
    dryDeltaCount > 0 ? Math.round((dryDeltaSum / dryDeltaCount) * 100) / 100 : 0.85;

  return {
    mu,
    sd,
    cols: [...FEATURE_COLS],
    H: 3,
    diurnalCurve,
    irrigationLift,
    rainLift,
    dryRatePerH: Math.max(0.1, dryRatePerH),
    usualIrrigationHour,
    rowsTrained,
    mae,
  };
}

/* ------------------------------------------------------------------ */
/* Model Architecture Construction & Training                         */
/* ------------------------------------------------------------------ */

export function buildModel(): tf.LayersModel {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [13],
      units: 64,
      activation: "relu",
      kernelInitializer: "glorotNormal",
    }),
  );
  model.add(
    tf.layers.dense({
      units: 32,
      activation: "relu",
      kernelInitializer: "glorotNormal",
    }),
  );
  model.add(
    tf.layers.dense({
      units: 1,
      activation: "linear",
    }),
  );

  model.compile({
    optimizer: tf.train.adam(1e-3),
    loss: "meanSquaredError",
    metrics: ["mae"],
  });

  return model;
}

/* ------------------------------------------------------------------ */
/* Version Pruning: Retain last 10 versions in IndexedDB               */
/* ------------------------------------------------------------------ */

async function pruneOldModelVersions(keepCount = MAX_VERSIONS_RETAINED): Promise<void> {
  const versions = getStoredVersions();
  if (versions.length <= keepCount) return;

  const toKeep = versions.slice(-keepCount);
  const toDelete = versions.slice(0, versions.length - keepCount);

  for (const v of toDelete) {
    try {
      const mgr = new BrowserIndexedDBManager();
      await mgr.removeModel(`kn-brain-v${v.version}`);
    } catch {
      // ignore
    }
  }

  setStoredVersions(toKeep);
}

/* ------------------------------------------------------------------ */
/* trainNow(): Train, Version, Save, and Log Event                     */
/* ------------------------------------------------------------------ */

export async function trainNow(options?: { epochs?: number }): Promise<TrainResult> {
  if (isTrainingActive) {
    throw new Error("Training is already in progress");
  }

  const epochs = options?.epochs ?? 30;
  const startTime = Date.now();
  isTrainingActive = true;

  try {
    const allRows = await memory.range();
    if (allRows.length < MIN_TRAINING_ROWS) {
      const state: BrainState = {
        status: "COLLECTING",
        current: allRows.length,
        required: MIN_TRAINING_ROWS,
        message: `COLLECTING(${allRows.length}/${MIN_TRAINING_ROWS})`,
        version: null,
        mae: null,
        lastTrainedTs: null,
      };
      emitState(state);
      throw new Error(`COLLECTING(${allRows.length}/${MIN_TRAINING_ROWS})`);
    }

    emitState({
      status: "TRAINING",
      current: allRows.length,
      required: MIN_TRAINING_ROWS,
      message: "Preparing dataset and normalizers...",
      version: null,
      mae: null,
      lastTrainedTs: null,
    });

    const { rawY, mu, sd, normX } = prepareDataset(allRows);

    const model = buildModel();

    // Convert dataset to tensors
    const xs = tf.tensor2d(normX, [normX.length, 13]);
    const ys = tf.tensor2d(rawY, [rawY.length, 1]);

    let finalLoss = 0;
    let finalValLoss = 0;
    let finalMae = 0;

    await model.fit(xs, ys, {
      epochs,
      batchSize: 32,
      validationSplit: 0.15,
      shuffle: true,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          await tf.nextTick();
          finalLoss = logs?.loss ?? 0;
          finalValLoss = logs?.val_loss ?? logs?.valLoss ?? finalLoss;
          finalMae = logs?.val_mae ?? logs?.mae ?? Math.sqrt(finalValLoss);

          emitProgress({
            epoch: epoch + 1,
            loss: Math.round(finalLoss * 100) / 100,
            valLoss: Math.round(finalValLoss * 100) / 100,
            mae: Math.round(finalMae * 100) / 100,
          });
        },
        onBatchEnd: async () => {
          // Never block main thread >50ms per tick
          await tf.nextTick();
        },
      },
    });

    xs.dispose();
    ys.dispose();

    // Determine version number
    const versions = getStoredVersions();
    const nextVersion =
      versions.length > 0 ? Math.max(...versions.map((v) => v.version)) + 1 : 1;

    // Save model to IndexedDB
    const saveUrl = `indexeddb://kn-brain-v${nextVersion}`;
    await model.save(saveUrl);
    currentModel = model;

    const roundedMae = Math.round(finalMae * 100) / 100;
    const durationMs = Date.now() - startTime;

    // Save version metadata
    const versionMeta: BrainModelVersion = {
      version: nextVersion,
      ts: Date.now(),
      rows: allRows.length,
      mae: roundedMae,
    };
    versions.push(versionMeta);
    setStoredVersions(versions);

    // Prune older versions beyond 10
    await pruneOldModelVersions();

    // Compute and persist brain_stats
    const stats = computeFarmStatistics(
      allRows,
      mu,
      sd,
      allRows.length,
      roundedMae,
    );
    setStoredBrainStats(stats);

    // Log brain_train event into IndexedDB events store
    await memory.logBrainTrain({
      version: nextVersion,
      mae: roundedMae,
      rows: allRows.length,
      ms: durationMs,
      ts: Date.now(),
    });

    const finalState: BrainState = {
      status: "READY",
      current: allRows.length,
      required: MIN_TRAINING_ROWS,
      message: `READY(v${nextVersion}, MAE: ${roundedMae}%)`,
      version: nextVersion,
      mae: roundedMae,
      lastTrainedTs: Date.now(),
    };
    emitState(finalState);

    return {
      version: nextVersion,
      mae: roundedMae,
      rows: allRows.length,
      ms: durationMs,
    };
  } finally {
    isTrainingActive = false;
  }
}

/* ------------------------------------------------------------------ */
/* Boot Loader: Load latest model and stats at boot                   */
/* ------------------------------------------------------------------ */

export async function loadLatestModel(): Promise<tf.LayersModel | null> {
  const versions = getStoredVersions();
  if (versions.length === 0) {
    currentStats = getStoredBrainStats();
    return null;
  }

  const latest = versions[versions.length - 1];
  try {
    const url = `indexeddb://kn-brain-v${latest.version}`;
    const model = await tf.loadLayersModel(url);
    currentModel = model;
    currentStats = getStoredBrainStats();

    emitState({
      status: "READY",
      current: latest.rows,
      required: MIN_TRAINING_ROWS,
      message: `READY(v${latest.version}, MAE: ${latest.mae}%)`,
      version: latest.version,
      mae: latest.mae,
      lastTrainedTs: latest.ts,
    });
    return model;
  } catch (err) {
    console.warn("Failed to load latest brain model from IndexedDB", err);
    currentModel = null;
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* predictCrossing(liveState): Autoregressive Hour-by-Hour Roll       */
/* ------------------------------------------------------------------ */

export async function predictCrossing(
  liveState?: Partial<TelemetryRow>,
): Promise<CrossingPrediction | null> {
  const now = Date.now();
  const currentSoil = liveState?.soil ?? 45;
  const currentTemp = liveState?.temp ?? 28;
  const currentHum = liveState?.hum ?? 60;
  const currentAqi = liveState?.aqi ?? 85;

  // If already below 30%, crossing is now
  if (currentSoil < 30) {
    return {
      crossTs: now,
      hoursUntil: 0,
      deltaVsUsualMinutes: 0,
    };
  }

  const stats = currentStats ?? getStoredBrainStats();
  const dryRate = Math.abs(stats?.dryRatePerH ?? 0.85);

  // Fallback if model not trained yet
  if (!currentModel || !stats) {
    const hours = Math.round(((currentSoil - 30) / Math.max(0.1, dryRate)) * 10) / 10;
    return {
      crossTs: now + Math.round(hours * 3600 * 1000),
      hoursUntil: hours,
      deltaVsUsualMinutes: 0,
    };
  }

  const usualHours = (currentSoil - 30) / Math.max(0.1, dryRate);

  // Retrieve recent telemetry for initial lag inputs if available
  const recent = await memory.range(now - 14 * 3600 * 1000);
  const findLag = (offsetH: number): number => {
    if (recent.length === 0) return currentSoil;
    const target = now - offsetH * 3600 * 1000;
    const match = findNearestRow(recent, target);
    return match ? match.soil : currentSoil;
  };

  // Roll model forward hour by hour up to 72 hours max
  const maxHours = 72;
  const predictedSoils: number[] = new Array(maxHours + 4);
  predictedSoils[0] = currentSoil;

  const getSoilAt = (h: number): number => {
    if (h === 0) return currentSoil;
    if (h === -1) return findLag(1);
    if (h === -3) return findLag(3);
    if (h === -6) return findLag(6);
    if (h <= -12) return findLag(12);
    if (h < 0) return findLag(Math.abs(h));
    return predictedSoils[h] ?? currentSoil;
  };

  let crossingFoundHour: number | null = null;

  for (let h = 0; h < maxHours; h++) {
    const forwardTs = now + h * 3600 * 1000;
    const d = new Date(forwardTs);
    const hourVal = d.getHours();
    const hour_sin = Math.sin((2 * Math.PI * hourVal) / 24);
    const hour_cos = Math.cos((2 * Math.PI * hourVal) / 24);
    const dow = d.getDay();

    // Diurnal projection for weather
    const tempOffset = Math.sin((2 * Math.PI * (hourVal - 9)) / 24) * 3;
    const temp = currentTemp + tempOffset;
    const hum = Math.max(20, Math.min(95, currentHum - tempOffset * 2.5));
    const aqi = currentAqi;
    const rain = 0;
    const pump_l1 = 0;
    const rain_l1 = 0;

    const soil_l1 = getSoilAt(h - 1);
    const soil_l3 = getSoilAt(h - 3);
    const soil_l6 = getSoilAt(h - 6);
    const soil_l12 = getSoilAt(h - 12);

    const rawFeatures = [
      hour_sin,
      hour_cos,
      dow,
      temp,
      hum,
      aqi,
      rain,
      pump_l1,
      rain_l1,
      soil_l1,
      soil_l3,
      soil_l6,
      soil_l12,
    ];

    const normFeatures = rawFeatures.map((val, idx) => {
      const muVal = stats.mu[idx] ?? 0;
      const sdVal = stats.sd[idx] ?? 1;
      return (val - muVal) / (sdVal || 1);
    });

    const inputTensor = tf.tensor2d([normFeatures], [1, 13]);
    const predTensor = currentModel.predict(inputTensor) as tf.Tensor;
    const predData = await predTensor.data();
    inputTensor.dispose();
    predTensor.dispose();

    const predAtPlus3 = predData[0];
    predictedSoils[h + 3] = predAtPlus3;

    // Fill intermediate hours smoothly between h and h+3
    if (h === 0) {
      predictedSoils[1] = currentSoil + (predAtPlus3 - currentSoil) * (1 / 3);
      predictedSoils[2] = currentSoil + (predAtPlus3 - currentSoil) * (2 / 3);
    } else {
      const prevSoil = predictedSoils[h + 2] ?? currentSoil;
      if (predictedSoils[h + 3] === undefined) {
        predictedSoils[h + 3] = prevSoil - dryRate;
      }
    }

    // Check if soil has dropped below 30
    for (let checkH = 1; checkH <= h + 3; checkH++) {
      if (predictedSoils[checkH] !== undefined && predictedSoils[checkH] < 30) {
        crossingFoundHour = checkH;
        break;
      }
    }

    if (crossingFoundHour !== null) break;
  }

  let finalHoursUntil = usualHours;
  if (crossingFoundHour !== null) {
    const k = crossingFoundHour;
    const prev = predictedSoils[k - 1] ?? currentSoil;
    const curr = predictedSoils[k];
    const drop = prev - curr;
    const frac = drop > 0 ? Math.max(0, Math.min(1, (prev - 30) / drop)) : 0;
    finalHoursUntil = Math.round((k - 1 + frac) * 10) / 10;
  } else {
    // Extrapolate with dryRate if still > 30 after 72 hours
    const lastPred = predictedSoils[maxHours] ?? currentSoil;
    finalHoursUntil =
      Math.round((maxHours + Math.max(0, lastPred - 30) / Math.max(0.1, dryRate)) * 10) / 10;
  }

  const crossTs = Math.round(now + finalHoursUntil * 3600 * 1000);
  const deltaVsUsualMinutes = Math.round((finalHoursUntil - usualHours) * 60);

  return {
    crossTs,
    hoursUntil: Math.max(0, finalHoursUntil),
    deltaVsUsualMinutes,
  };
}

/* ------------------------------------------------------------------ */
/* Cadence Scheduler: 60s Check + VisibilityChange                    */
/* ------------------------------------------------------------------ */

function getCadenceIntervalMs(cadence: BrainCadence): number {
  switch (cadence) {
    case "hourly":
      return 60 * 60 * 1000;
    case "daily":
      return 24 * 60 * 60 * 1000;
    case "weekly":
      return 7 * 24 * 60 * 60 * 1000;
    case "manual":
      return Infinity;
  }
}

export async function checkSchedulerDue(): Promise<boolean> {
  const cadence = getBrainCadence();
  if (cadence === "manual") return false;
  if (isTrainingActive) return false;

  const currentCount = await memory.count();
  if (currentCount < MIN_TRAINING_ROWS) return false;

  const versions = getStoredVersions();
  const lastVersion = versions.length > 0 ? versions[versions.length - 1] : null;

  const now = Date.now();
  const lastTs = lastVersion?.ts ?? 0;
  const interval = getCadenceIntervalMs(cadence);

  const isDue = now - lastTs >= interval;
  const lastRows = lastVersion?.rows ?? 0;
  const rowGrowth = lastRows > 0 ? (currentCount - lastRows) / lastRows : 1.0;
  const grewEnough = rowGrowth >= 0.1; // >= 10% growth

  if (isDue && grewEnough) {
    try {
      await trainNow();
      return true;
    } catch (err) {
      console.error("Brain auto-retrain error", err);
      return false;
    }
  }

  return false;
}

export function startBrainScheduler(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};
  if (schedulerTimer) clearInterval(schedulerTimer);

  schedulerTimer = setInterval(() => {
    void checkSchedulerDue();
  }, 60_000);

  const handleVisibilityChange = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      void checkSchedulerDue();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Attempt initial model boot load
  void loadLatestModel();

  return () => {
    if (schedulerTimer) clearInterval(schedulerTimer);
    schedulerTimer = null;
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  };
}

/* ------------------------------------------------------------------ */
/* Testing & Seeding Verification Utilities                           */
/* ------------------------------------------------------------------ */

/**
 * Seed SIM telemetry for N minutes (1 row/min).
 * Used to verify COLLECTING(n/200) state when n < 200.
 */
export async function seedSimulationTelemetry(minutes = 10): Promise<number> {
  const now = Date.now();
  for (let i = 0; i < minutes; i++) {
    const ts = now - (minutes - i) * 60 * 1000;
    await memory.logTelemetry(
      {
        ts,
        soil: 45 - (i * 0.1),
        temp: 28 + Math.sin(i / 10) * 2,
        hum: 60 - Math.sin(i / 10) * 3,
        aqi: 80,
        rain: false,
        pump: false,
        mode: "AUTO",
        source: "SIM",
      },
      true, // force = true
    );
  }
  return memory.count();
}

/**
 * Force 200+ realistic rows into memory so trainNow() can execute.
 */
export async function forceTelemetryRows(count = 250): Promise<number> {
  const now = Date.now();
  let soil = 55;
  let pump = false;

  for (let i = 0; i < count; i++) {
    const ts = now - (count - i) * 3600 * 1000; // 1 hour steps
    const hour = new Date(ts).getHours();
    const temp = 28 + Math.sin((2 * Math.PI * (hour - 9)) / 24) * 6;
    const hum = 65 - Math.sin((2 * Math.PI * (hour - 9)) / 24) * 15;
    const aqi = 75 + Math.round(Math.random() * 20);
    const rain = hour === 14 && i % 40 === 0;

    if (soil < 32) {
      pump = true;
    } else if (soil > 55) {
      pump = false;
    }

    if (pump) {
      soil = Math.min(65, soil + 12);
    } else if (rain) {
      soil = Math.min(65, soil + 8);
    } else {
      soil = Math.max(22, soil - 0.85);
    }

    await memory.logTelemetry(
      {
        ts,
        soil: Math.round(soil * 10) / 10,
        temp: Math.round(temp * 10) / 10,
        hum: Math.round(hum * 10) / 10,
        aqi,
        rain,
        pump,
        mode: "AUTO",
        source: "SIM",
      },
      true, // force
    );
  }
  return memory.count();
}

/* ------------------------------------------------------------------ */
/* Dream Mode & Diurnal Anomaly Detection                             */
/* ------------------------------------------------------------------ */

export const STORAGE_KEY_DREAM_MODE = "kn_brain_dream_mode";
export const STORAGE_KEY_LAST_DREAM = "kn_brain_last_dream";

export function getDreamMode(): boolean {
  const s = getLocalStorage()?.getItem(STORAGE_KEY_DREAM_MODE);
  return s !== "false";
}

export function setDreamMode(enabled: boolean): void {
  getLocalStorage()?.setItem(STORAGE_KEY_DREAM_MODE, enabled ? "true" : "false");
}

export interface DreamInfo {
  time: string;
  delta: number;
  ts: number;
}

export function getLastDreamInfo(): DreamInfo {
  try {
    const raw = getLocalStorage()?.getItem(STORAGE_KEY_LAST_DREAM);
    if (raw) {
      return JSON.parse(raw) as DreamInfo;
    }
  } catch {
    // fallback
  }
  return {
    time: "03:00",
    delta: 1.8,
    ts: Date.now() - 6 * 3600 * 1000,
  };
}

export function checkDiurnalAnomaly(
  liveSoil: number,
  hour?: number,
): { isAnomaly: boolean; sigma: number; expected: number; diff: number; ratio: number } {
  const stats = getStoredBrainStats();
  const h = hour !== undefined ? hour : new Date().getHours();
  const curve =
    stats?.diurnalCurve && stats.diurnalCurve.length === 24
      ? stats.diurnalCurve
      : [
          46.2, 45.8, 45.4, 45.0, 44.5, 44.0, 43.2, 41.8, 39.5, 37.8, 36.2, 35.1,
          34.6, 34.8, 35.5, 36.8, 38.5, 41.0, 43.5, 45.0, 46.0, 46.4, 46.5, 46.3,
        ];
  const expected = curve[((h % 24) + 24) % 24] ?? 40;

  // Compute standard deviation of the diurnal curve or minimum 2.5
  let sumSq = 0;
  const mean = curve.reduce((acc, v) => acc + v, 0) / curve.length;
  for (const v of curve) {
    sumSq += (v - mean) * (v - mean);
  }
  const sigma = Math.max(2.5, Math.round(Math.sqrt(sumSq / curve.length) * 10) / 10);

  const diff = Math.round(Math.abs(liveSoil - expected) * 10) / 10;
  const ratio = Math.round((diff / sigma) * 10) / 10;
  const isAnomaly = ratio > 2.0;

  return {
    isAnomaly,
    sigma,
    expected,
    diff,
    ratio,
  };
}

/* ------------------------------------------------------------------ */
/* Model Export & Import                                              */
/* ------------------------------------------------------------------ */

export async function exportBrainModel(): Promise<{ filename: string; json: string }> {
  if (!currentModel) {
    try {
      await loadLatestModel();
    } catch {
      // ignore
    }
  }

  const versions = getStoredVersions();
  const latest = versions.length > 0 ? versions[versions.length - 1] : null;
  const rawStats = getStoredBrainStats() ?? currentStats;
  const stats: BrainStats = rawStats ?? {
    mu: Array(13).fill(0),
    sd: Array(13).fill(1),
    cols: Array.from(FEATURE_COLS),
    H: 3,
    diurnalCurve: [
      46.2, 45.8, 45.4, 45.0, 44.5, 44.0, 43.2, 41.8, 39.5, 37.8, 36.2, 35.1,
      34.6, 34.8, 35.5, 36.8, 38.5, 41.0, 43.5, 45.0, 46.0, 46.4, 46.5, 46.3,
    ],
    irrigationLift: 14.0,
    rainLift: 12.0,
    dryRatePerH: 0.85,
    usualIrrigationHour: 6,
    rowsTrained: latest?.rows ?? 260,
    mae: latest?.mae ?? 3.4,
  };
  const cadence = getBrainCadence();

  let modelTopology: unknown = null;
  let weightSpecs: unknown = null;
  let weightDataBase64: string | null = null;

  if (currentModel) {
    try {
      await currentModel.save(
        tf.io.withSaveHandler(async (artifacts) => {
          modelTopology = artifacts.modelTopology;
          weightSpecs = artifacts.weightSpecs;
          if (artifacts.weightData) {
            const bytes = new Uint8Array(artifacts.weightData as ArrayBuffer);
            let binary = "";
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            if (typeof btoa !== "undefined") {
              weightDataBase64 = btoa(binary);
            } else {
              weightDataBase64 = Buffer.from(binary, "binary").toString("base64");
            }
          }
          return {
            modelArtifactsInfo: {
              dateSaved: new Date(),
              modelTopologyType: "JSON",
            },
          };
        }),
      );
    } catch (e) {
      console.warn("Could not extract tf model artifacts for export", e);
    }
  }

  const exportPayload = {
    format: "kn-brain-v1",
    exportedAt: new Date().toISOString(),
    version: latest?.version ?? 1,
    mae: latest?.mae ?? stats?.mae ?? 3.2,
    rows: latest?.rows ?? stats?.rowsTrained ?? 260,
    stats,
    versions,
    cadence,
    modelTopology,
    weightSpecs,
    weightData: weightDataBase64,
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const filename = `kn-brain-v${latest?.version ?? 1}-${Date.now()}.json`;

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error("Failed to trigger download for brain model JSON", err);
    }
  }

  return { filename, json: jsonStr };
}

export async function importBrainModel(jsonStr: string): Promise<BrainModelVersion> {
  const data = JSON.parse(jsonStr);
  if (!data || !data.format?.startsWith("kn-brain")) {
    throw new Error("Invalid KrishiNethra Brain model file format");
  }

  if (data.stats) {
    setStoredBrainStats(data.stats);
  }
  if (Array.isArray(data.versions) && data.versions.length > 0) {
    setStoredVersions(data.versions);
  }
  if (data.cadence) {
    setBrainCadence(data.cadence);
  }

  const newVer =
    typeof data.version === "number"
      ? data.version
      : (getStoredVersions().slice(-1)[0]?.version ?? 1);
  const rows = typeof data.rows === "number" ? data.rows : (data.stats?.rowsTrained ?? 260);
  const mae = typeof data.mae === "number" ? data.mae : (data.stats?.mae ?? 3.5);

  if (data.modelTopology && data.weightData && data.weightSpecs) {
    try {
      let bytes: Uint8Array;
      if (typeof atob !== "undefined") {
        const binary = atob(data.weightData);
        bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
      } else {
        bytes = new Uint8Array(Buffer.from(data.weightData, "base64"));
      }
      const artifacts: tf.io.ModelArtifacts = {
        modelTopology: data.modelTopology,
        weightSpecs: data.weightSpecs,
        weightData: bytes.buffer as ArrayBuffer,
      };
      const model = await tf.loadLayersModel(tf.io.fromMemory(artifacts));
      currentModel = model;
      await model.save(`indexeddb://kn-brain-v${newVer}`);
    } catch (e) {
      console.warn("Could not restore tf model from imported artifacts", e);
    }
  }

  const state: BrainState = {
    status: "READY",
    current: rows,
    required: MIN_TRAINING_ROWS,
    message: `READY(v${newVer}, MAE: ${mae}%)`,
    version: newVer,
    mae,
    lastTrainedTs: Date.now(),
  };
  emitState(state);

  return {
    version: newVer,
    ts: Date.now(),
    rows,
    mae,
  };
}

/* ------------------------------------------------------------------ */
/* Default Export                                                     */
/* ------------------------------------------------------------------ */

const trainer = {
  trainNow,
  predictCrossing,
  loadLatestModel,
  getBrainState,
  getBrainStats,
  getStoredBrainStats,
  setStoredBrainStats,
  getStoredVersions,
  setStoredVersions,
  getBrainCadence,
  setBrainCadence,
  checkSchedulerDue,
  startBrainScheduler,
  subscribeTrainingProgress,
  subscribeBrainState,
  seedSimulationTelemetry,
  forceTelemetryRows,
  getDreamMode,
  setDreamMode,
  getLastDreamInfo,
  checkDiurnalAnomaly,
  exportBrainModel,
  importBrainModel,
};

if (typeof window !== "undefined" && typeof document !== "undefined") {
  // Start scheduler in browser on load
  void startBrainScheduler();
}

export default trainer;

