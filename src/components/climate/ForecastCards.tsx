"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CloudSun, LocateFixed, MapPin, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClimateForecastDay } from "@/lib/ai-engine";
import { useFarmStore } from "@/lib/store";
import { DEFAULT_SETTINGS } from "@/lib/store";
import { capitalForState } from "@/lib/india-locations";
import { Card, CardHeader, useMounted } from "@/components/dashboard/ui";
import { fallbackForecast, weatherForCode } from "./shared";

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max?: Array<number | null>;
  precipitation_sum?: number[];
  weathercode: number[];
  windspeed_10m_max?: number[];
}

function dayLabel(iso: string, index: number, mounted: boolean): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  if (!mounted) return iso.slice(5);
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso.slice(5);
  return d.toLocaleDateString("en-IN", { weekday: "short" });
}

function fullDate(iso: string, mounted: boolean): string {
  if (!mounted) return iso;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ForecastCards({
  onForecast,
}: {
  onForecast?: (days: ClimateForecastDay[], offline: boolean) => void;
}) {
  const snapshot = useFarmStore((s) => s.snapshot);
  const location = useFarmStore((s) => s.settings.location);
  const farmProfile = useFarmStore((s) => s.settings.farmProfile);
  const updateSettings = useFarmStore((s) => s.updateSettings);
  const mounted = useMounted();

  // GPS-first: farmProfile.location (wizard) wins; else stored location;
  // else state-capital fallback so weather never points at a stale default.
  const loc = (() => {
    const gps = farmProfile?.location;
    if (gps && Number.isFinite(gps.lat) && Number.isFinite(gps.lng)) {
      return {
        latitude: gps.lat,
        longitude: gps.lng,
        label:
          [farmProfile?.district, farmProfile?.state].filter(Boolean).join(", ") ||
          location?.label ||
          "Farm",
      };
    }
    const stored = location ?? DEFAULT_SETTINGS.location;
    const isDefault =
      Math.abs(stored.latitude - DEFAULT_SETTINGS.location.latitude) < 0.01 &&
      Math.abs(stored.longitude - DEFAULT_SETTINGS.location.longitude) < 0.01;
    if (!isDefault || !farmProfile?.state) return stored;
    const cap = capitalForState(farmProfile.state);
    return { latitude: cap.lat, longitude: cap.lng, label: cap.label };
  })();

  const [days, setDays] = useState<ClimateForecastDay[]>(() =>
    fallbackForecast(snapshot, 5),
  );
  const [offline, setOffline] = useState(true);
  const [loading, setLoading] = useState(true);

  const [latText, setLatText] = useState(String(loc.latitude));
  const [lonText, setLonText] = useState(String(loc.longitude));

  // Keep the text fields in sync if location changes elsewhere (external
  // zustand store → local input state; a controlled sync, not a render loop).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLatText(String(loc.latitude));
    setLonText(String(loc.longitude));
  }, [loc.latitude, loc.longitude]);

  const fetchForecast = useCallback(
    async (lat: number, lon: number, signal: AbortSignal) => {
      setLoading(true);
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
          `&longitude=${lon}` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weathercode,windspeed_10m_max` +
          `&timezone=Asia%2FKolkata&forecast_days=5`;
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const daily = json?.daily as OpenMeteoDaily | undefined;
        if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
          throw new Error("empty forecast");
        }
        const parsed: ClimateForecastDay[] = daily.time.slice(0, 5).map((t, i) => ({
          date: t,
          tMax: Number(daily.temperature_2m_max?.[i] ?? snapshot.tempC),
          tMin: Number(daily.temperature_2m_min?.[i] ?? snapshot.tempC - 8),
          rainMm: Number(daily.precipitation_sum?.[i] ?? 0),
          rainProb: Number(daily.precipitation_probability_max?.[i] ?? 0),
          code: Number(daily.weathercode?.[i] ?? 2),
          windKph:
            daily.windspeed_10m_max?.[i] != null
              ? Number(daily.windspeed_10m_max[i])
              : undefined,
        }));
        setDays(parsed);
        setOffline(false);
        onForecast?.(parsed, false);
      } catch {
        // Offline at exhibition, DNS blocked, bad JSON — fall back
        // gracefully to simulation-derived data. Never show errors.
        if (signal.aborted) return;
        const fb = fallbackForecast(
          useFarmStore.getState().snapshot,
          5,
        );
        setDays(fb);
        setOffline(true);
        onForecast?.(fb, true);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    // snapshot intentionally read lazily inside catch; live snapshot would
    // refetch every second. Only lat/lon drive refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onForecast],
  );

  // Fetch client-side on mount + whenever coordinates change (external
  // Open-Meteo API sync with abort + offline fallback; never throws).
  useEffect(() => {
    const ctrl = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchForecast(loc.latitude, loc.longitude, ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.latitude, loc.longitude]);

  const applyLocation = () => {
    const lat = Number(latText);
    const lon = Number(lonText);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const clampedLat = Math.max(-90, Math.min(90, lat));
    const clampedLon = Math.max(-180, Math.min(180, lon));
    updateSettings({
      location: { latitude: clampedLat, longitude: clampedLon },
    });
  };

  const resetAhmedabad = () => {
    updateSettings({
      location: { ...DEFAULT_SETTINGS.location },
    });
  };

  const valid = useMemo(() => {
    const lat = Number(latText);
    const lon = Number(lonText);
    return Number.isFinite(lat) && Number.isFinite(lon);
  }, [latText, lonText]);

  return (
    <Card>
      <CardHeader
        title="5-Day Weather Forecast"
        subtitle={`${loc.label || "Farm"} · ${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}`}
        action={
          offline ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              <WifiOff className="h-3 w-3" /> offline data
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              live forecast
            </span>
          )
        }
      />

      {/* Location settings */}
      <div className="mb-3 flex flex-col gap-2 rounded-xl border border-white/5 bg-black/40 p-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <MapPin className="h-3 w-3" /> Latitude
          </span>
          <input
            value={latText}
            onChange={(e) => setLatText(e.target.value)}
            inputMode="decimal"
            placeholder="23.02"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/50"
          />
        </label>
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Longitude
          </span>
          <input
            value={lonText}
            onChange={(e) => setLonText(e.target.value)}
            inputMode="decimal"
            placeholder="72.57"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/50"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={applyLocation}
            disabled={!valid}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-extrabold transition-all active:scale-[0.97]",
              valid
                ? "bg-emerald-500 text-black shadow-[0_0_16px_rgba(34,197,94,0.4)] hover:bg-emerald-400"
                : "cursor-not-allowed border border-white/10 text-zinc-600",
            )}
          >
            Apply
          </button>
          <button
            type="button"
            onClick={resetAhmedabad}
            title="Reset to Ahmedabad default"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-zinc-300 transition-all hover:border-emerald-500/40 hover:text-white active:scale-[0.97]"
          >
            <LocateFixed className="h-3.5 w-3.5" /> Ahmedabad
          </button>
        </div>
      </div>

      {/* Forecast cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {loading && days.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="h-3 w-12 rounded bg-white/10" />
                <div className="mx-auto mt-3 h-8 w-8 rounded-full bg-white/10" />
                <div className="mx-auto mt-3 h-4 w-16 rounded bg-white/10" />
              </div>
            ))
          : days.map((d, i) => {
              const { label, Icon } = weatherForCode(d.code);
              const wet = d.rainMm > 5 || d.rainProb > 60;
              return (
                <div
                  key={d.date}
                  className={cn(
                    "rounded-xl border p-3 text-center transition-all hover:-translate-y-0.5 sm:p-4",
                    wet
                      ? "border-sky-400/30 bg-sky-500/[0.06]"
                      : "border-white/5 bg-black/40 hover:border-emerald-500/30",
                  )}
                >
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-white">
                    {dayLabel(d.date, i, mounted)}
                  </p>
                  <p className="text-[10px] tabular-nums text-zinc-500">
                    {fullDate(d.date, mounted)}
                  </p>
                  <span
                    className={cn(
                      "mx-auto mt-2 flex h-11 w-11 items-center justify-center rounded-2xl",
                      wet
                        ? "bg-sky-500/15 text-sky-300 shadow-[0_0_16px_rgba(56,189,248,0.3)]"
                        : "bg-amber-500/10 text-amber-300",
                    )}
                  >
                    {i === 0 && loading ? (
                      <CloudSun className="h-5 w-5 animate-pulse" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </span>
                  <p className="mt-1 text-[10px] text-zinc-500">{label}</p>
                  <p className="mt-1 text-sm font-extrabold tabular-nums text-white">
                    {d.tMax.toFixed(0)}°
                    <span className="ml-1 font-semibold text-zinc-500">
                      {d.tMin.toFixed(0)}°
                    </span>
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[11px] font-bold tabular-nums",
                      d.rainProb > 40 ? "text-sky-300" : "text-zinc-500",
                    )}
                  >
                    ☂ {Math.round(d.rainProb)}%
                    {d.rainMm > 0 && (
                      <span className="ml-1 font-medium text-zinc-400">
                        · {d.rainMm.toFixed(1)}mm
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
      </div>
      <p className="mt-2 text-[11px] text-zinc-600">
        {offline
          ? "Showing simulation-based outlook (open-meteo unreachable) — connect to the internet for the live IMD-synced feed."
          : "Live from Open-Meteo · updated on load for your farm coordinates."}
      </p>
    </Card>
  );
}
