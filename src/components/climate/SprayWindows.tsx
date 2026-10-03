"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/dashboard/ui";
import { useFarm } from "@/lib/store";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast?latitude=23.0225&longitude=72.5714&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability&timezone=Asia%2FKolkata&forecast_days=3";
const CACHE_KEY = "krishi-climate-spray-hourly-v1";
const CACHE_MS = 30 * 60 * 1000;
const WINDOW_MS = 48 * 60 * 60 * 1000;

type HourlyForecast = {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  wind_speed_10m: number[];
  precipitation_probability: number[];
};

type SprayWindow = { start: number; end: number };

function isHourlyForecast(value: unknown): value is HourlyForecast {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<HourlyForecast>;
  return Array.isArray(data.time) &&
    Array.isArray(data.temperature_2m) &&
    Array.isArray(data.relative_humidity_2m) &&
    Array.isArray(data.wind_speed_10m) &&
    Array.isArray(data.precipitation_probability) &&
    data.time.length === data.temperature_2m.length &&
    data.time.length === data.relative_humidity_2m.length &&
    data.time.length === data.wind_speed_10m.length &&
    data.time.length === data.precipitation_probability.length &&
    data.time.every((time) => typeof time === "string");
}

function parseTime(value: string) {
  return new Date(/(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}:00+05:30`).getTime();
}

function dayLabel(timestamp: number, now: number) {
  const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
  const date = dayFormat.format(new Date(timestamp));
  const today = dayFormat.format(new Date(now));
  const tomorrow = dayFormat.format(new Date(now + 24 * 60 * 60 * 1000));
  if (date === today) return "Today";
  if (date === tomorrow) return "Tomorrow";
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" }).format(new Date(timestamp));
}

function timeLabel(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestamp));
}

function countdown(timestamp: number, now: number) {
  const minutes = Math.max(0, Math.floor((timestamp - now) / 60_000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours >= 24) return `in ${Math.floor(hours / 24)}d ${hours % 24}h`;
  return hours ? `in ${hours}h${remainder ? ` ${remainder}m` : ""}` : `in ${remainder}m`;
}

function qualifyingWindows(hourly: HourlyForecast, now: number, aqi: number): SprayWindow[] {
  const limit = now + WINDOW_MS;
  const windows: SprayWindow[] = [];
  if (aqi >= 150) return windows;
  for (let i = 0; i + 2 < hourly.time.length; i++) {
    const start = parseTime(hourly.time[i]);
    const secondHour = parseTime(hourly.time[i + 1]);
    const thirdHour = parseTime(hourly.time[i + 2]);
    if (!Number.isFinite(start) || secondHour - start !== 60 * 60 * 1000 || thirdHour - secondHour !== 60 * 60 * 1000) continue;
    const end = thirdHour + 60 * 60 * 1000;
    if (start < now || end > limit) continue;
    const qualifies = [i, i + 1, i + 2].every((hour) =>
      Number.isFinite(hourly.temperature_2m[hour]) &&
      Number.isFinite(hourly.relative_humidity_2m[hour]) &&
      Number.isFinite(hourly.wind_speed_10m[hour]) &&
      Number.isFinite(hourly.precipitation_probability[hour]) &&
      hourly.wind_speed_10m[hour] < 10 &&
      hourly.temperature_2m[hour] >= 10 && hourly.temperature_2m[hour] <= 30 &&
      hourly.relative_humidity_2m[hour] >= 50 && hourly.relative_humidity_2m[hour] <= 90 &&
      hourly.precipitation_probability[hour] < 20,
    );
    if (qualifies) {
      windows.push({ start, end });
      i += 2;
      if (windows.length === 3) break;
    }
  }
  return windows;
}

export default function SprayWindows() {
  const aqi = useFarm().aqi;
  const [hourly, setHourly] = useState<HourlyForecast | null>(null);
  const [now, setNow] = useState(0);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setFailed(false);
    const refreshClock = () => setNow(Date.now());
    refreshClock();
    const clock = window.setInterval(refreshClock, 60_000);
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    void (async () => {
      try {
        let cached: string | null = null;
        try {
          cached = localStorage.getItem(CACHE_KEY);
        } catch {
          // Continue with a live request if browser storage is unavailable.
        }
        if (cached && retry === 0) {
          try {
            const entry = JSON.parse(cached) as { fetchedAt?: number; hourly?: unknown };
            const age = Date.now() - Number(entry.fetchedAt);
            if (Number.isFinite(age) && age >= 0 && age < CACHE_MS && isHourlyForecast(entry.hourly)) {
              if (active) setHourly(entry.hourly);
              return;
            }
          } catch {
            // Replace malformed cache data with a fresh forecast request.
          }
        }
        const response = await fetch(FORECAST_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);
        const json = await response.json() as { hourly?: HourlyForecast };
        const data = json.hourly;
        if (!data || !Array.isArray(data.time) || !Array.isArray(data.temperature_2m) ||
            !Array.isArray(data.relative_humidity_2m) || !Array.isArray(data.wind_speed_10m) ||
            !Array.isArray(data.precipitation_probability)) throw new Error("Hourly forecast fields are missing");
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), hourly: data }));
        } catch {
          // The forecast remains usable for this page even when it cannot be cached.
        }
        if (active) setHourly(data);
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(clock);
      window.clearTimeout(timeout);
    };
  }, [retry]);

  const windows = useMemo(() => hourly && now ? qualifyingWindows(hourly, now, aqi) : [], [hourly, now, aqi]);

  return (
    <Card>
      <CardHeader title="Safe spray windows" subtitle="Three consecutive forecast hours · Ahmedabad · Open-Meteo" />
      {failed && !hourly ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-3">
          <p className="text-sm text-amber-100">Hourly forecast unavailable. Check the connection to Open-Meteo.</p>
          <button type="button" onClick={() => setRetry((value) => value + 1)} className="rounded-lg border border-amber-300/30 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-300/10">Retry forecast</button>
        </div>
      ) : !hourly ? (
        <p className="animate-pulse rounded-xl bg-white/5 px-3 py-3 text-sm text-zinc-400">Loading live hourly forecast…</p>
      ) : aqi >= 150 ? (
        <p className="rounded-xl border border-red-400/20 bg-red-500/5 px-3 py-3 text-sm text-red-100">No safe spray window in next 48h — current AQI {aqi.toFixed(0)} is at or above 150.</p>
      ) : windows.length === 0 ? (
        <p className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-3 text-sm text-amber-100">No safe spray window in next 48h — wait for calmer conditions</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {windows.map((window) => (
            <span key={window.start} className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold tabular-nums text-emerald-100">
              {dayLabel(window.start, now)} {timeLabel(window.start)}–{timeLabel(window.end)} · {countdown(window.start, now)}
            </span>
          ))}
        </div>
      )}
      {hourly && <p className="mt-3 text-[10px] text-zinc-600">Requires wind &lt;10 km/h, 10–30°C, humidity 50–90%, rain chance &lt;20%, and AQI &lt;150. Forecast cached for 30 minutes.</p>}
    </Card>
  );
}
