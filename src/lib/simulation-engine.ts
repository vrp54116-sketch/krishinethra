/**
 * simulation-engine.ts
 * Realistic farm simulator for KrishiNethra AI (SIMULATION mode, no hardware).
 *
 * Pure physics + agronomy rules live here so the zustand store (store.ts)
 * stays a thin orchestration layer: every second it calls tick() and applies
 * auto-pump decisions, alerts and health scoring.
 */

import type {
  Alert,
  AppSettings,
  PumpState,
  SensorSnapshot,
  Zone,
} from "./types";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const TANK_CAPACITY_L = 10;
export const FLOW_RATE_LPM = 0.4;
export const PUMP_CURRENT_A = 0.25;
export const EVAPORATION_PER_SEC = 0.05; // soil moisture % lost per sec
export const IRRIGATION_PER_SEC = 1.5; // soil moisture % gained per sec while pumping
export const TANK_MIN_RUN_PERCENT = 5; // below this the pump cannot run
export const AUTO_PUMP_TANK_ON = 15; // tank must be above this to auto-start
export const AUTO_PUMP_TANK_OFF = 10; // tank below this forces auto-stop
export const ALERT_DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const ZONE_A_BASELINE = 45; // % soil moisture
export const ZONE_B_BASELINE = 22; // % soil moisture (dry problem zone)

export interface TickResult {
  snapshot: SensorSnapshot;
  /** Litres consumed during this tick. */
  waterUsedL: number;
  /** True when the pump was requested ON but the tank is too low to run. */
  blocked: boolean;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function noise(amount: number): number {
  return (Math.random() - 0.5) * 2 * amount;
}

/** Unique id without external dependencies. */
export function uid(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(
    Math.random() * 1e9,
  ).toString(36)}`;
}

/* ------------------------------------------------------------------ */
/* Environmental curves                                                */
/* ------------------------------------------------------------------ */

/**
 * Daily temperature curve: min 26°C at 5am, max 36°C at 2pm.
 * Smooth cosine interpolation between the two anchor points.
 */
export function temperatureForHour(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h <= 14) {
    const t = (h - 5) / 9; // 0 → 1 across the morning rise
    return 26 + 10 * ((1 - Math.cos(Math.PI * t)) / 2);
  }
  // Afternoon/evening fall from 2pm back round to 5am (15h span).
  const t = (h >= 14 ? h - 14 : h + 24 - 14) / 15;
  return 36 - 10 * ((1 - Math.cos(Math.PI * t)) / 2);
}

/** Humidity is the inverse of temperature: 45–75%. */
export function humidityForTemp(tempC: number): number {
  return clamp(75 - 3 * (tempC - 26), 45, 75);
}

/** Light: 0 at night, up to 900 lux during daytime (6am–7pm). */
export function lightForHour(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  if (h < 6 || h > 19) return 0;
  return Math.max(0, 900 * Math.sin((Math.PI * (h - 6)) / 13));
}

export function zoneStatusForMoisture(
  moisture: number,
  low: number,
  high: number,
): Zone["status"] {
  if (moisture < 20 || moisture > 98) return "critical";
  if (moisture < low || moisture > high) return "warning";
  return "healthy";
}

/* ------------------------------------------------------------------ */
/* Snapshot seeding                                                    */
/* ------------------------------------------------------------------ */

export function createInitialSnapshot(now: number = Date.now()): SensorSnapshot {
  const hour = new Date(now).getHours() + new Date(now).getMinutes() / 60;
  const tempC = temperatureForHour(hour);
  return {
    timestamp: now,
    tempC: Math.round(tempC * 10) / 10,
    humidity: Math.round(humidityForTemp(tempC) * 10) / 10,
    aqi: 85,
    lightLux: Math.round(lightForHour(hour)),
    rainMm: 0,
    tankLevelPercent: 85,
    flowRateLpm: 0,
    pumpCurrentA: 0,
    soilMoistureA: ZONE_A_BASELINE,
    soilMoistureB: ZONE_B_BASELINE,
  };
}

/* ------------------------------------------------------------------ */
/* Core physics tick                                                   */
/* ------------------------------------------------------------------ */

/**
 * Advance the farm simulation by dtSeconds.
 * Returns the new snapshot plus the water consumed (litres) in this tick.
 */
export function tick(
  snapshot: SensorSnapshot,
  settings: AppSettings,
  pump: PumpState,
  dtSeconds: number,
): TickResult {
  void settings;
  const dt = Math.max(0, dtSeconds);
  const canRun = snapshot.tankLevelPercent >= TANK_MIN_RUN_PERCENT;
  const running = pump.running && canRun;

  // --- Soil moisture ---
  const irrigate = (m: number) =>
    running
      ? clamp(m + IRRIGATION_PER_SEC * dt + noise(0.02), 0, 100)
      : clamp(m - EVAPORATION_PER_SEC * dt + noise(0.02), 0, 100);
  const soilMoistureA = Math.round(irrigate(snapshot.soilMoistureA) * 100) / 100;
  const soilMoistureB = Math.round(irrigate(snapshot.soilMoistureB) * 100) / 100;

  // --- Temperature / humidity / light from the simulated clock ---
  const timestamp = snapshot.timestamp + dt * 1000;
  const date = new Date(timestamp);
  const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const tempC =
    Math.round((temperatureForHour(hour) + noise(0.25)) * 10) / 10;
  const humidity =
    Math.round(clamp(humidityForTemp(tempC) + noise(1.5), 30, 90) * 10) / 10;
  const lightLux = Math.max(0, Math.round(lightForHour(hour) + noise(12)));

  // --- AQI random walk between 60 and 120 ---
  const aqi = Math.round(clamp(snapshot.aqi + noise(3), 60, 120));

  // --- Rain: occasional light shower, also tops the tank up slightly ---
  let rainMm = 0;
  let tankLevelPercent = snapshot.tankLevelPercent;
  if (Math.random() < 0.02 * dt) {
    rainMm = Math.round((0.5 + Math.random() * 2.5) * 10) / 10;
    tankLevelPercent = clamp(tankLevelPercent + rainMm * 0.2, 0, 100);
  }

  // --- Tank + pump electrics ---
  let waterUsedL = 0;
  let flowRateLpm = 0;
  let pumpCurrentA = 0;
  if (running) {
    flowRateLpm = FLOW_RATE_LPM;
    pumpCurrentA = PUMP_CURRENT_A;
    waterUsedL = (FLOW_RATE_LPM / 60) * dt;
    tankLevelPercent = clamp(
      tankLevelPercent - (waterUsedL / TANK_CAPACITY_L) * 100,
      0,
      100,
    );
  }
  tankLevelPercent = Math.round(tankLevelPercent * 100) / 100;

  return {
    snapshot: {
      timestamp,
      tempC,
      humidity,
      aqi,
      lightLux,
      rainMm,
      tankLevelPercent,
      flowRateLpm,
      pumpCurrentA,
      soilMoistureA,
      soilMoistureB,
    },
    waterUsedL: Math.round(waterUsedL * 10000) / 10000,
    blocked: pump.running && !canRun,
  };
}

/* ------------------------------------------------------------------ */
/* AUTO mode logic                                                     */
/* ------------------------------------------------------------------ */

/**
 * Decide the pump relay for AUTO mode.
 * - ON when Zone B moisture < moistureLow AND tank > 15%.
 * - OFF when moisture > moistureHigh OR tank < 10%.
 * Returns "on" | "off" | null (null = hold current state).
 */
export function evaluateAutoPump(
  snapshot: SensorSnapshot,
  settings: AppSettings,
  pump: PumpState,
): "on" | "off" | null {
  if (pump.mode !== "auto") return null;
  const { moistureLow, moistureHigh } = settings.thresholds;
  if (
    !pump.running &&
    snapshot.soilMoistureB < moistureLow &&
    snapshot.tankLevelPercent > AUTO_PUMP_TANK_ON
  ) {
    return "on";
  }
  if (
    pump.running &&
    (snapshot.soilMoistureB > moistureHigh ||
      snapshot.tankLevelPercent < AUTO_PUMP_TANK_OFF)
  ) {
    return "off";
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Alert generation                                                    */
/* ------------------------------------------------------------------ */

function isDuplicate(
  existing: Alert[],
  title: string,
  now: number,
  windowMs: number = ALERT_DEDUP_WINDOW_MS,
): boolean {
  return existing.some(
    (a) => a.title === title && now - a.timestamp < windowMs,
  );
}

export function makeAlert(
  level: Alert["level"],
  title: string,
  message: string,
  timestamp: number = Date.now(),
  zone?: string,
): Alert {
  return {
    id: uid("alert"),
    level,
    title,
    message,
    timestamp,
    read: false,
    ...(zone ? { zone } : {}),
  };
}

/**
 * Generate threshold-crossing alerts for a fresh snapshot.
 * Same-type alerts are deduplicated within a 10-minute window.
 * Pass pumpEvent "started" when the pump just turned on to log the event.
 */
export function generateAlerts(
  snapshot: SensorSnapshot,
  settings: AppSettings,
  existing: Alert[],
  pumpEvent: "started" | "blocked" | null = null,
): Alert[] {
  const t = settings.thresholds;
  const now = snapshot.timestamp;
  const out: Alert[] = [];
  const consider = (alert: Alert) => {
    const already = [...existing, ...out];
    if (!isDuplicate(already, alert.title, now)) out.push(alert);
  };

  if (snapshot.soilMoistureB < 20) {
    consider(
      makeAlert(
        "critical",
        "Critical soil moisture — Zone B",
        `Zone B moisture is ${snapshot.soilMoistureB.toFixed(1)}%. Immediate irrigation needed.`,
        now,
        "B",
      ),
    );
  } else if (snapshot.soilMoistureA < 20) {
    consider(
      makeAlert(
        "critical",
        "Critical soil moisture — Zone A",
        `Zone A moisture is ${snapshot.soilMoistureA.toFixed(1)}%. Immediate irrigation needed.`,
        now,
        "A",
      ),
    );
  } else if (
    snapshot.soilMoistureB < t.moistureLow ||
    snapshot.soilMoistureA < t.moistureLow
  ) {
    const lowZone = snapshot.soilMoistureB < t.moistureLow ? "B" : "A";
    const value =
      lowZone === "B" ? snapshot.soilMoistureB : snapshot.soilMoistureA;
    consider(
      makeAlert(
        "warning",
        "Low soil moisture",
        `Zone ${lowZone} moisture is ${value.toFixed(1)}% (below ${t.moistureLow}%). Consider irrigating.`,
        now,
        lowZone,
      ),
    );
  }

  if (snapshot.tempC > t.tempHigh) {
    consider(
      makeAlert(
        "warning",
        "High temperature",
        `Field temperature ${snapshot.tempC.toFixed(1)}°C exceeds ${t.tempHigh}°C. Mulch or shade sensitive crops.`,
        now,
      ),
    );
  }

  if (snapshot.aqi > t.aqiHigh) {
    consider(
      makeAlert(
        "warning",
        "Poor air quality",
        `AQI ${snapshot.aqi} exceeds ${t.aqiHigh}. Delay foliar spraying until air clears.`,
        now,
      ),
    );
  }

  if (snapshot.tankLevelPercent < t.tankLow) {
    consider(
      makeAlert(
        snapshot.tankLevelPercent < TANK_MIN_RUN_PERCENT
          ? "critical"
          : "warning",
        "Low water tank",
        `Tank is at ${snapshot.tankLevelPercent.toFixed(0)}% (below ${t.tankLow}%). Refill soon to keep irrigating.`,
        now,
      ),
    );
  }

  if (pumpEvent === "started") {
    consider(
      makeAlert(
        "info",
        "Pump started",
        `Irrigation pump turned ON. Flow ${FLOW_RATE_LPM} L/min from a ${snapshot.tankLevelPercent.toFixed(0)}% tank.`,
        now,
      ),
    );
  }

  if (pumpEvent === "blocked") {
    consider(
      makeAlert(
        "critical",
        "Pump blocked — tank empty",
        `Pump cannot run: tank below ${TANK_MIN_RUN_PERCENT}%. Refill the tank.`,
        now,
      ),
    );
  }

  return out;
}

/** Alert raised when a disease scan finds an infection. */
export function diseaseAlert(
  disease: string,
  severity: string,
  zone?: string,
  timestamp: number = Date.now(),
): Alert {
  const level: Alert["level"] =
    severity === "severe" ? "critical" : severity === "medium" ? "warning" : "info";
  return makeAlert(
    level,
    "Disease detected",
    `${disease} detected (${severity} severity)${zone ? ` in Zone ${zone}` : ""}. Open Crop Doctor for treatment.`,
    timestamp,
    zone,
  );
}

/* ------------------------------------------------------------------ */
/* Farm health score (0–100)                                           */
/* ------------------------------------------------------------------ */

/**
 * Weighted health: moisture closeness to 45% (40%), temperature comfort
 * (20%), humidity comfort (20%), AQI (20%) — minus 15 per active
 * unresolved disease scan. Clamped to 0–100.
 */
export function computeFarmHealthScore(
  snapshot: SensorSnapshot,
  zones: Zone[],
  unresolvedDiseaseCount: number,
): number {
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

  const raw =
    moistureScore * 0.4 + tempScore * 0.2 + humidityScore * 0.2 + aqiScore * 0.2;
  return Math.round(clamp(raw - unresolvedDiseaseCount * 15, 0, 100));
}
