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
export const TANK_CAPACITY_L = 10;
export const FLOW_RATE_LPM = 0.4;
export const PUMP_CURRENT_A = 0.25;
export const EVAPORATION_PER_SEC = 0.05; // soil moisture % lost per sec
export const IRRIGATION_PER_SEC = 1.5; // soil moisture % gained per sec while pumping
export const TANK_MIN_RUN_PERCENT = 5; // below this the pump cannot run
export const AUTO_PUMP_TANK_ON = 15; // tank must be above this to auto-start
export const AUTO_PUMP_TANK_OFF = 10; // tank below this forces auto-stop
export const ALERT_DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const ZONE_A_BASELINE = 55; // % soil moisture
export const ZONE_B_BASELINE = 42; // % soil moisture
export const SOIL_BASELINE = 42;

export interface TickResult {
  snapshot: SensorSnapshot;
  /** Litres consumed during this tick. */
  waterUsedL: number;
  /** True when the pump was blocked. */
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

/**
 * Worst-of calculation: moisture status, active disease in that zone, active pest in that zone.
 * Zone with active leaf-rust or active disease/pest plan shows "warning" or "critical", never "healthy".
 */
export function computeZoneStatus(
  zoneId: string,
  moisture: number,
  thresholds: { moistureLow: number; moistureHigh: number },
  sprayPlans?: Array<{ zone: string; disease: string; status: string }>,
  alerts?: Array<{ zone?: string; level: string; read: boolean }>,
): Zone["status"] {
  const moistureStatus = zoneStatusForMoisture(
    moisture,
    thresholds.moistureLow,
    thresholds.moistureHigh,
  );

  let diseasePestStatus: Zone["status"] = "healthy";

  if (sprayPlans) {
    const activePlans = sprayPlans.filter(
      (p) => p.zone.toUpperCase() === zoneId.toUpperCase() && p.status === "active",
    );
    for (const p of activePlans) {
      const d = p.disease.toLowerCase();
      if (
        d.includes("rust") ||
        d.includes("blight") ||
        d.includes("rot") ||
        d.includes("severe") ||
        d.includes("critical")
      ) {
        diseasePestStatus = "critical";
        break;
      }
      diseasePestStatus = "warning";
    }
  }

  if (alerts) {
    for (const a of alerts) {
      if (!a.read && a.zone && a.zone.toUpperCase() === zoneId.toUpperCase()) {
        if (a.level === "critical") {
          diseasePestStatus = "critical";
          break;
        }
        if (a.level === "warning" && diseasePestStatus !== "critical") {
          diseasePestStatus = "warning";
        }
      }
    }
  }

  // Worst-of logic: critical > warning > healthy
  if (moistureStatus === "critical" || diseasePestStatus === "critical") {
    return "critical";
  }
  if (moistureStatus === "warning" || diseasePestStatus === "warning") {
    return "warning";
  }
  return "healthy";
}

/* ------------------------------------------------------------------ */
/* Snapshot seeding                                                    */
/* ------------------------------------------------------------------ */

export function createInitialSnapshot(now: number = Date.now()): SensorSnapshot {
  const hour = new Date(now).getHours() + new Date(now).getMinutes() / 60;
  const tempC = temperatureForHour(hour);
  const temp = Math.round(tempC * 10) / 10;
  const hum = Math.round(humidityForTemp(tempC) * 10) / 10;
  return {
    timestamp: now,
    tempC: temp,
    humidity: hum,
    aqi: 85,
    lightLux: Math.round(lightForHour(hour)),
    tankLevelPercent: 85,
    flowRateLpm: 0,
    pumpCurrentA: 0,
    soilMoistureA: ZONE_A_BASELINE,
    soilMoistureB: ZONE_B_BASELINE,
    soil: ZONE_B_BASELINE,
    temp,
    hum,
    rain: false,
    pump: false,
    mode: "AUTO",
    rssi: -55,
    stale: false,
    uptime: 120,
    soilRaw: 540,
    mqRaw: 230,
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
  const tank = snapshot.tankLevelPercent ?? 85;
  const canRun = tank >= TANK_MIN_RUN_PERCENT;
  const running = pump.running && canRun;

  // --- Soil moisture: in SIMULATION mode must drift smoothly between 30% and 70% and never show 0.0% ---
  const irrigate = (m: number) =>
    running
      ? clamp(m + 0.45 * dt + noise(0.02), 30.0, 70.0)
      : clamp(m - 0.05 * dt + noise(0.02), 30.0, 70.0);

  const prevA = clamp(snapshot.soilMoistureA ?? ZONE_A_BASELINE, 30.0, 70.0);
  const prevB = clamp(snapshot.soilMoistureB ?? snapshot.soil ?? ZONE_B_BASELINE, 30.0, 70.0);
  const soilMoistureA = Math.round(irrigate(prevA) * 10) / 10;
  const soilMoistureB = Math.round(irrigate(prevB) * 10) / 10;

  // --- Temperature / humidity / light from the simulated clock ---
  const timestamp = snapshot.timestamp + dt * 1000;
  const date = new Date(timestamp);
  const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const tempC = Math.round((temperatureForHour(hour) + noise(0.25)) * 10) / 10;
  const humidity = Math.round(clamp(humidityForTemp(tempC) + noise(1.5), 30, 90) * 10) / 10;
  const lightLux = Math.max(0, Math.round(lightForHour(hour) + noise(12)));

  // --- AQI random walk between 60 and 120 ---
  const aqi = Math.round(clamp(snapshot.aqi + noise(3), 60, 120));

  // --- Rain: boolean only (occasional shower) ---
  let rain = snapshot.rain ?? false;
  let tankLevelPercent = tank;
  if (Math.random() < 0.005 * dt) {
    rain = !rain;
  }
  if (rain) {
    tankLevelPercent = clamp(tankLevelPercent + 0.05 * dt, 0, 100);
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

  // Raw analog values (ESP32 10-bit ADC 0-1023)
  const soilRaw = Math.round(850 - (soilMoistureB / 100) * 650);
  const mqRaw = Math.round(aqi * 2.7);

  const uptime = (snapshot.uptime || 0) + Math.round(dt);

  return {
    snapshot: {
      timestamp,
      tempC,
      humidity,
      aqi,
      lightLux,
      tankLevelPercent,
      flowRateLpm,
      pumpCurrentA,
      soilMoistureA,
      soilMoistureB,
      soil: soilMoistureB,
      temp: tempC,
      hum: humidity,
      rain,
      pump: running,
      mode: (pump.mode === "auto" ? "AUTO" : "MANUAL") as "AUTO" | "MANUAL",
      rssi: snapshot.rssi ?? -55,
      stale: snapshot.stale ?? false,
      uptime,
      soilRaw,
      mqRaw,
    },
    waterUsedL: Math.round(waterUsedL * 10000) / 10000,
    blocked: pump.running && !canRun,
  };
}

/* ------------------------------------------------------------------ */
/* Jal Agent logic                                                    */
/* ------------------------------------------------------------------ */

/**
 * Decide the pump relay for AUTO mode (Jal Agent).
 * - if soil < 30% AND rain === false → pump ON
 * - if soil > 75% OR rain === true → pump OFF
 * Returns "on" | "off" | null (null = hold current state).
 */
export function evaluateAutoPump(
  snapshot: SensorSnapshot,
  settings: AppSettings,
  pump: PumpState,
): "on" | "off" | null {
  if (pump.mode !== "auto") return null;
  const { moistureLow, moistureHigh } = settings.thresholds;
  const soil = snapshot.soil ?? snapshot.soilMoistureA ?? 45;
  const rain = Boolean(snapshot.rain);

  if (!pump.running && soil < moistureLow && !rain) {
    return "on";
  }
  if (pump.running && (soil > moistureHigh || rain)) {
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
  const currentBucket = Math.floor(now / (10 * 60 * 1000));
  return existing.some(
    (a) =>
      a.title === title &&
      (Math.floor(a.timestamp / (10 * 60 * 1000)) === currentBucket ||
        now - a.timestamp < windowMs),
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

  const soil = snapshot.soil ?? snapshot.soilMoistureA ?? 45;
  const temp = snapshot.temp ?? snapshot.tempC ?? 30;

  if (soil < 20) {
    consider(
      makeAlert(
        "critical",
        "Critical soil moisture",
        `Soil moisture is ${soil.toFixed(1)}%. Immediate irrigation needed.`,
        now,
      ),
    );
  } else if (soil < t.moistureLow) {
    consider(
      makeAlert(
        "warning",
        "Low soil moisture",
        `Soil moisture is ${soil.toFixed(1)}% (below ${t.moistureLow}% threshold). Consider irrigating.`,
        now,
      ),
    );
  }

  if (temp > t.tempHigh) {
    consider(
      makeAlert(
        "warning",
        "High temperature",
        `Field temperature ${temp.toFixed(1)}°C exceeds ${t.tempHigh}°C threshold. Mulch or shade sensitive crops.`,
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

  const tank = snapshot.tankLevelPercent ?? 85;
  const tankLow = t.tankLow ?? 20;
  if (tank < tankLow) {
    consider(
      makeAlert(
        "critical",
        "Low water tank",
        `Water tank is at ${tank.toFixed(0)}% (below ${tankLow}% threshold). Refill soon.`,
        now,
      ),
    );
  }

  if (pumpEvent === "started") {
    consider(
      makeAlert(
        "info",
        "Pump started",
        `Irrigation pump turned ON.`,
        now,
      ),
    );
  }

  if (pumpEvent === "blocked") {
    consider(
      makeAlert(
        "critical",
        "Pump blocked",
        `Pump blocked: tank level is too low to run safely.`,
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
 * Rebalanced health score weights:
 * moisture 25, temperature 20, humidity 15, AQI 15, disease/pest 25 (total 100).
 */
export interface HealthBreakdownResult {
  moisturePts: number;
  tempPts: number;
  humidityPts: number;
  aqiPts: number;
  diseasePts: number;
  totalScore: number;
  chipString: string;
}

interface SensorSubScores {
  moistureScore: number;
  tempScore: number;
  humidityScore: number;
  aqiScore: number;
}

const subScoreHistory: SensorSubScores[] = [];

export function recordAndAverageSubScores(
  moistureScore: number,
  tempScore: number,
  humidityScore: number,
  aqiScore: number,
): SensorSubScores {
  subScoreHistory.push({ moistureScore, tempScore, humidityScore, aqiScore });
  if (subScoreHistory.length > 5) {
    subScoreHistory.shift();
  }
  const len = subScoreHistory.length;
  return subScoreHistory.reduce(
    (acc, curr) => ({
      moistureScore: acc.moistureScore + curr.moistureScore / len,
      tempScore: acc.tempScore + curr.tempScore / len,
      humidityScore: acc.humidityScore + curr.humidityScore / len,
      aqiScore: acc.aqiScore + curr.aqiScore / len,
    }),
    { moistureScore: 0, tempScore: 0, humidityScore: 0, aqiScore: 0 },
  );
}

export function computeHealthBreakdown(
  snapshot: SensorSnapshot,
  _zones: Zone[] = [],
  unresolvedDiseaseCount: number = 0,
  activeSprayPlansCount: number = 0,
): HealthBreakdownResult {
  const soil = clamp(snapshot.soil ?? snapshot.soilMoistureA ?? 45, 30, 70);
  const temp = snapshot.temp ?? snapshot.tempC ?? 28;
  const hum = snapshot.hum ?? snapshot.humidity ?? 60;
  const rawMoistureScore = clamp(100 - Math.abs(soil - 50) * 2.5, 0, 100);

  const rawTempScore =
    temp <= 32
      ? 100
      : clamp(100 - (temp - 32) * 15, 0, 100);

  const rawHumidityScore =
    hum >= 50 && hum <= 70
      ? 100
      : hum < 50
        ? clamp(100 - (50 - hum) * 3, 0, 100)
        : clamp(100 - (hum - 70) * 3, 0, 100);

  const rawAqiScore = clamp(100 - ((snapshot.aqi - 60) * 100) / 140, 0, 100);

  // 5-sample moving average of the four sensor sub-scores
  const averaged = recordAndAverageSubScores(
    rawMoistureScore,
    rawTempScore,
    rawHumidityScore,
    rawAqiScore,
  );

  const moisturePts = Math.round((averaged.moistureScore / 100) * 25);
  const tempPts = Math.round((averaged.tempScore / 100) * 20);
  const humidityPts = Math.round((averaged.humidityScore / 100) * 15);
  const aqiPts = Math.round((averaged.aqiScore / 100) * 15);

  const totalIssues = Math.max(unresolvedDiseaseCount, activeSprayPlansCount);
  const diseaseScore = clamp(100 - totalIssues * 35, 0, 100);
  const diseasePts = Math.round((diseaseScore / 100) * 25);

  const totalScore = clamp(
    moisturePts + tempPts + humidityPts + aqiPts + diseasePts,
    0,
    100,
  );

  const chipString = `Moisture ${moisturePts}/25 • Temp ${tempPts}/20 • Humidity ${humidityPts}/15 • AQI ${aqiPts}/15 • Disease ${diseasePts}/25`;

  return {
    moisturePts,
    tempPts,
    humidityPts,
    aqiPts,
    diseasePts,
    totalScore,
    chipString,
  };
}

export function computeFarmHealthScore(
  snapshot: SensorSnapshot,
  zones: Zone[],
  unresolvedDiseaseCount: number,
  activeSprayPlansCount: number = 0,
): number {
  return computeHealthBreakdown(
    snapshot,
    zones,
    unresolvedDiseaseCount,
    activeSprayPlansCount,
  ).totalScore;
}
