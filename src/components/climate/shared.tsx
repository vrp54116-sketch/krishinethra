"use client";

/* Shared climate helpers: 12h synthetic history, pressure model,
   WMO weathercode mapping, offline fallback forecast, AQI bands,
   crop comfort profiles. */

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { ClimateForecastDay } from "@/lib/ai-engine";
import {
  humidityForTemp,
  lightForHour,
  temperatureForHour,
} from "@/lib/simulation-engine";
import type { SensorHistoryPoint, SensorSnapshot } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Pressure model (hPa) — smooth function of temp/humidity/hour so it  */
/* moves live with the sensors but never jitters second-to-second.     */
/* ------------------------------------------------------------------ */

export function pressureHpaFor(
  tempC: number,
  humidity: number,
  hour: number,
): number {
  const h = ((hour % 24) + 24) % 24;
  const diurnal = 1.6 * Math.sin((2 * Math.PI * (h - 9)) / 24);
  const p = 1012.6 - 0.32 * (tempC - 28) + 0.025 * (55 - humidity) + diurnal;
  return Math.round(p * 10) / 10;
}

export function currentPressure(snapshot: SensorSnapshot): number {
  const d = new Date(snapshot.timestamp);
  const hour = d.getHours() + d.getMinutes() / 60;
  return pressureHpaFor(snapshot.tempC, snapshot.humidity, hour);
}

/* ------------------------------------------------------------------ */
/* 12-hour history series                                              */
/* ------------------------------------------------------------------ */

export interface ClimatePoint {
  timestamp: number;
  label: string;
  tempC: number;
  humidity: number;
  aqi: number;
  lightLux: number;
  rainMm: number;
  pressureHpa: number;
}

/** Deterministic 0..1 noise from an integer seed (stable across renders). */
function hash01(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function hourLabel(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${suffix}`;
}

/**
 * Build a smooth 12-hour series ending exactly at the live snapshot.
 * Recent sensorHistory anchors AQI; temp/humidity/light follow the
 * simulation-engine daily curves anchored to the current offset so the
 * tail always meets the live value with no jump.
 */
export function buildTwelveHourSeries(
  snapshot: SensorSnapshot,
  sensorHistory: SensorHistoryPoint[],
  points = 48,
): ClimatePoint[] {
  const n = Math.max(12, points);
  const now = snapshot.timestamp;
  const nowDate = new Date(now);
  const nowHour = nowDate.getHours() + nowDate.getMinutes() / 60;
  const tempOffset = snapshot.tempC - temperatureForHour(nowHour);
  const aqiTail = sensorHistory.slice(-8).map((p) => p.aqi);
  const aqiAnchor =
    aqiTail.length > 0
      ? aqiTail.reduce((a, b) => a + b, 0) / aqiTail.length
      : snapshot.aqi;

  const out: ClimatePoint[] = [];
  for (let i = 0; i < n; i++) {
    const frac = n === 1 ? 1 : i / (n - 1); // 0 oldest → 1 newest
    const ts = now - (1 - frac) * 12 * 3600 * 1000;
    const d = new Date(ts);
    const hour = d.getHours() + d.getMinutes() / 60;
    const isLive = i === n - 1;

    const wobble = (seed: number, amp: number) =>
      (hash01(i * 31 + seed) - 0.5) * 2 * amp * (1 - frac * 0.55);

    const tempC = isLive
      ? snapshot.tempC
      : Math.round(
          (temperatureForHour(hour) + tempOffset + wobble(7, 0.9)) * 10,
        ) / 10;

    const humidity = isLive
      ? snapshot.humidity
      : Math.round(
          clamp(humidityForTemp(tempC) + wobble(13, 3.2), 28, 92) * 10,
        ) / 10;

    // AQI drifts gently toward the live anchor near the tail.
    const drift =
      (snapshot.aqi - aqiAnchor) * Math.pow(frac, 2) +
      Math.sin(frac * Math.PI * 3 + 1) * 4 * (1 - frac);
    const aqi = isLive
      ? snapshot.aqi
      : Math.round(clamp(aqiAnchor + drift + wobble(29, 5), 55, 130));

    const lightLux = isLive
      ? snapshot.lightLux
      : Math.max(0, Math.round(lightForHour(hour) + wobble(41, 26)));

    // Rain: dry history, ramping into the live value at the tail.
    const rainMm =
      isLive || frac > 0.94
        ? snapshot.rainMm * (isLive ? 1 : (frac - 0.94) / 0.06)
        : 0;

    out.push({
      timestamp: Math.round(ts),
      label: hourLabel(ts),
      tempC,
      humidity,
      aqi,
      lightLux,
      rainMm: Math.round(rainMm * 10) / 10,
      pressureHpa: isLive
        ? currentPressure(snapshot)
        : pressureHpaFor(tempC, humidity, hour),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* WMO weathercode → icon + label                                      */
/* ------------------------------------------------------------------ */

export function weatherForCode(code: number): {
  label: string;
  Icon: LucideIcon;
} {
  if (code === 0) return { label: "Clear sky", Icon: Sun };
  if (code === 1) return { label: "Mainly clear", Icon: Sun };
  if (code === 2) return { label: "Partly cloudy", Icon: CloudSun };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if (code === 45 || code === 48) return { label: "Fog", Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Drizzle", Icon: CloudDrizzle };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { label: "Rain", Icon: CloudRain };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { label: "Snow", Icon: Snowflake };
  if (code >= 95) return { label: "Thunderstorm", Icon: CloudLightning };
  return { label: "Cloudy", Icon: Cloud };
}

/* ------------------------------------------------------------------ */
/* Offline fallback forecast (simulation-derived, never errors)        */
/* ------------------------------------------------------------------ */

export function fallbackForecast(
  snapshot: SensorSnapshot,
  days = 5,
): ClimateForecastDay[] {
  const out: ClimateForecastDay[] = [];
  const base = new Date(snapshot.timestamp);
  for (let d = 0; d < days; d++) {
    const date = new Date(base);
    date.setDate(date.getDate() + d);
    const iso = date.toISOString().slice(0, 10);
    const heatBias = Math.max(0, snapshot.tempC - 30) * 0.6;
    const tMax =
      Math.round(
        (snapshot.tempC + 2.2 + hash01(d * 17 + 3) * 3 - d * 0.5 + heatBias) *
          10,
      ) / 10;
    const tMin = Math.round((tMax - 8 - hash01(d * 23 + 5) * 3) * 10) / 10;
    const rainProb = Math.round(
      clamp(
        (snapshot.humidity > 72 ? 45 : 18) +
          (hash01(d * 41 + 9) - 0.5) * 36 -
          d * 3,
        0,
        90,
      ),
    );
    const rainMm =
      rainProb > 62
        ? Math.round((4 + hash01(d * 53 + 11) * 8) * 10) / 10
        : rainProb > 42
          ? Math.round((0.8 + hash01(d * 59 + 13) * 2.4) * 10) / 10
          : 0;
    const code =
      rainMm > 5 ? 61 : rainProb > 45 ? 3 : rainMm > 0 ? 80 : tMax > 36 ? 0 : 2;
    out.push({
      date: iso,
      tMax,
      tMin,
      rainMm,
      rainProb,
      code,
      windKph: Math.round((5 + hash01(d * 67 + 15) * 9) * 10) / 10,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* AQI bands (US EPA 0–500 scale)                                      */
/* ------------------------------------------------------------------ */

export const AQI_BANDS = [
  { max: 50, label: "Good", color: "#22c55e" },
  { max: 100, label: "Moderate", color: "#eab308" },
  { max: 150, label: "USG", color: "#f97316" },
  { max: 200, label: "Unhealthy", color: "#ef4444" },
  { max: 300, label: "Very unhealthy", color: "#a855f7" },
  { max: 500, label: "Hazardous", color: "#881337" },
] as const;

export function aqiBand(aqi: number): (typeof AQI_BANDS)[number] {
  return AQI_BANDS.find((b) => aqi <= b.max) ?? AQI_BANDS[AQI_BANDS.length - 1];
}

/* ------------------------------------------------------------------ */
/* Crop comfort profiles                                               */
/* ------------------------------------------------------------------ */

export type CropId = "tomato" | "chili" | "spinach" | "cotton" | "wheat";

export interface CropProfile {
  id: CropId;
  label: string;
  temp: [number, number];
  humidity: [number, number];
  /** lux */
  light: [number, number];
  /** max healthy AQI */
  aqiMax: number;
  note: string;
}

export const CROP_PROFILES: CropProfile[] = [
  {
    id: "tomato",
    label: "Tomato",
    temp: [18, 27],
    humidity: [60, 70],
    light: [400, 800],
    aqiMax: 100,
    note: "Tomato sets fruit best in mild warmth with steady humidity. Above 35°C flowers drop — shade net helps.",
  },
  {
    id: "chili",
    label: "Chili",
    temp: [20, 30],
    humidity: [50, 70],
    light: [400, 900],
    aqiMax: 100,
    note: "Chili loves heat but hates waterlogged air. Keep rows ventilated once humidity crosses 75%.",
  },
  {
    id: "spinach",
    label: "Spinach",
    temp: [15, 22],
    humidity: [60, 80],
    light: [200, 600],
    aqiMax: 80,
    note: "Leafy spinach bolts in heat. Partial shade and morning watering keep leaves tender.",
  },
  {
    id: "cotton",
    label: "Cotton",
    temp: [21, 30],
    humidity: [50, 60],
    light: [500, 900],
    aqiMax: 150,
    note: "Cotton tolerates heat and dust but excess humidity invites boll rot — prioritise drainage.",
  },
  {
    id: "wheat",
    label: "Wheat",
    temp: [15, 25],
    humidity: [50, 60],
    light: [400, 800],
    aqiMax: 120,
    note: "Wheat prefers cool dry grain-fill weather. Warm humid spells raise rust risk — scout often.",
  },
];
