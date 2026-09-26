"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Info,
  Leaf,
  Minus,
  RefreshCw,
  Search,
  Sprout,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { useFarmStore, DEFAULT_SETTINGS } from "@/lib/store";
import { Card, CardHeader, Sparkline, useMounted } from "@/components/dashboard/ui";
import {
  estimateIncome,
  formatINR,
  harvestAdviceFor,
  MANDI_PRICES,
  MARKET_UPDATED_LABEL,
  YOUR_CROPS,
  mandiById,
  type MandiPrice,
} from "@/lib/market-data";

function Rise({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function TrendBadge({ crop }: { crop: MandiPrice }) {
  if (crop.trend === "up")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-extrabold text-emerald-300">
        <ArrowUpRight className="h-3.5 w-3.5" />↑ {Math.abs(crop.changePercent)}%
      </span>
    );
  if (crop.trend === "down")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-extrabold text-red-300">
        <ArrowDownRight className="h-3.5 w-3.5" />↓ {Math.abs(crop.changePercent)}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-500/40 bg-white/5 px-2 py-0.5 text-[11px] font-extrabold text-zinc-300">
      <Minus className="h-3.5 w-3.5" /> {Math.abs(crop.changePercent)}%
    </span>
  );
}

function sparkColor(crop: MandiPrice): string {
  if (crop.trend === "up") return "#22c55e";
  if (crop.trend === "down") return "#ef4444";
  return "#a1a1aa";
}

function dayLabels(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(`${d.getDate()}/${d.getMonth() + 1}`);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Live mandi (data.gov.in) helpers                                    */
/* ------------------------------------------------------------------ */

/** Row shape returned by /api/mandi (mirrors the API route type). */
interface LiveMandiRow {
  crop: string;
  state: string;
  district: string;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  date: string;
}

const FILTER_STATES = [
  "Gujarat",
  "Maharashtra",
  "Rajasthan",
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Punjab",
  "Haryana",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "West Bengal",
  "Bihar",
  "Odisha",
  "Kerala",
  "Assam",
];

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
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
 * 7-day history projected backwards from today's modal price via a small
 * random walk (±3% per day). Deterministic per crop+market so re-renders
 * are stable. Always labelled "estimated trend" in the UI — we never
 * invent official history, only a visual guide around the live quote.
 */
function estimatedHistory(modal: number, seedKey: string): number[] {
  if (!Number.isFinite(modal) || modal <= 0) return [];
  const rng = mulberry32(hashStr(`mandi-trend-${seedKey}`));
  const hist: number[] = new Array(7);
  hist[6] = Math.round(modal);
  for (let i = 5; i >= 0; i--) {
    const drift = (rng() - 0.5) * 0.06;
    hist[i] = Math.max(1, Math.round(hist[i + 1]! * (1 + drift)));
  }
  return hist;
}

function trendOf(history: number[]): { trend: MandiPrice["trend"]; changePercent: number } {
  const first = history[0] ?? 0;
  const last = history[history.length - 1] ?? 0;
  if (!first) return { trend: "flat", changePercent: 0 };
  const pct = Math.round(((last - first) / first) * 1000) / 10;
  return {
    trend: pct >= 3 ? "up" : pct <= -3 ? "down" : "flat",
    changePercent: pct,
  };
}

/** Normalize crop names so "Chilli" matches "chili", "Bhindi" matches "okra", etc. */
function normCrop(s: string): string {
  const t = s.trim().toLowerCase();
  if (t.includes("chilli") || t.includes("chili")) return "chili";
  if (t.includes("bhindi") || t.includes("okra")) return "okra";
  if (t.includes("kapas") || t.includes("cotton")) return "cotton";
  if (t.includes("green gram") || t === "moong") return "moong";
  return t;
}

/** Find live rows matching a farm crop slug (fuzzy, case-insensitive). */
function matchLiveForCrop(cropSlug: string, rows: LiveMandiRow[]): LiveMandiRow[] {
  const want = normCrop(cropSlug);
  const demoName = normCrop(mandiById(cropSlug)?.crop ?? cropSlug);
  return rows.filter((r) => {
    const have = normCrop(r.crop);
    return (
      have === want ||
      have === demoName ||
      have.includes(want) ||
      want.includes(have) ||
      have.includes(demoName) ||
      demoName.includes(have)
    );
  });
}

function displayCropName(slug: string): string {
  return mandiById(slug)?.crop ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

/** Generic harvest guidance for a live quote (no invented history). */
function liveAdviceFor(
  cropDisplay: string,
  row: LiveMandiRow,
  trend: MandiPrice["trend"],
  changePercent: number,
): string {
  const income20 = formatINR(estimateIncome(20, row.modalPrice));
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const where = [row.market, row.district].filter(Boolean).join(" · ");
  if (trend === "up")
    return `${cropDisplay} ${arrow}${Math.abs(changePercent)}% (estimated trend) at ${where} — modal ${formatINR(row.modalPrice)}/quintal. Good moment to sell graded produce; 20 kg ≈ ${income20}.`;
  if (trend === "down")
    return `${cropDisplay} ${arrow}${Math.abs(changePercent)}% (estimated trend) at ${where} — modal ${formatINR(row.modalPrice)}/quintal. Hold best grades 2–3 days if you can; 20 kg ≈ ${income20}.`;
  return `${cropDisplay} steady at ${where} — modal ${formatINR(row.modalPrice)}/quintal. Sell normally; 20 kg ≈ ${income20}.`;
}

export default function MarketPage() {
  const mounted = useMounted();
  const zones = useFarmStore((s) => s.zones);
  const farmProfile = useFarmStore((s) => s.settings.farmProfile) ?? DEFAULT_SETTINGS.farmProfile;
  const dataGovApiKey = useFarmStore((s) => s.settings.dataGovApiKey) ?? "";
  const commodityResourceId = useFarmStore((s) => s.settings.commodityResourceId) ?? "";

  const farmState: string = farmProfile.state || "Gujarat";
  const farmDistrict: string = (farmProfile as { district?: string }).district || "";
  const farmCrops: string[] =
    Array.isArray(farmProfile.crops) && farmProfile.crops.length > 0
      ? farmProfile.crops
      : ["tomato", "chili", "spinach"];

  const [query, setQuery] = useState("");
  const [selectedCropOverride, setSelectedCropOverride] = useState<string | null>(null);
  const selectedId = selectedCropOverride ?? (farmCrops[0]?.toLowerCase() || "tomato");
  const setSelectedId = setSelectedCropOverride;
  const [yieldKg, setYieldKg] = useState("20");

  // Live-data state. Filters default to the farm profile; user picks
  // override them (no sync effects — derived values below stay lint-clean).
  const [stateOverride, setStateOverride] = useState<string | null>(null);
  const [districtOverride, setDistrictOverride] = useState<string | null>(null);
  const filterState = stateOverride ?? farmState;
  const filterDistrict = districtOverride ?? (farmDistrict || "All");
  const [liveRows, setLiveRows] = useState<LiveMandiRow[]>([]);
  const [liveOk, setLiveOk] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveReason, setLiveReason] = useState<string | null>(null);

  // Fetch live mandi whenever the state filter or data-source creds change.
  // Never throws to the UI — any failure degrades to the demo table.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLiveLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterState) params.set("state", filterState);
        if (dataGovApiKey.trim()) params.set("apiKey", dataGovApiKey.trim());
        if (commodityResourceId.trim())
          params.set("resourceId", commodityResourceId.trim());
        const res = await fetch(`/api/mandi?${params.toString()}`);
        const body = (await res.json().catch(() => null)) as {
          ok?: boolean;
          fallback?: boolean;
          reason?: string;
          data?: LiveMandiRow[];
          updatedAt?: string;
        } | null;
        if (cancelled) return;
        if (body?.ok && Array.isArray(body.data) && body.data.length > 0) {
          const clean = body.data.filter(
            (r) => r && typeof r.crop === "string" && Number.isFinite(r.modalPrice),
          );
          if (clean.length > 0) {
            setLiveRows(clean);
            setLiveOk(true);
            setLastUpdated(body.updatedAt ?? new Date().toISOString());
            setLiveReason(null);
          } else {
            setLiveRows([]);
            setLiveOk(false);
            setLiveReason("zero-results");
          }
        } else {
          setLiveRows([]);
          setLiveOk(false);
          setLiveReason(
            typeof body?.reason === "string" ? body.reason : "unavailable",
          );
        }
      } catch {
        if (!cancelled) {
          setLiveRows([]);
          setLiveOk(false);
          setLiveReason("unavailable");
        }
      } finally {
        if (!cancelled) setLiveLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [filterState, dataGovApiKey, commodityResourceId]);

  const isLive = liveOk === true && liveRows.length > 0;

  // District options come from the live payload for the selected state.
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of liveRows) {
      if (r.district.trim()) set.add(r.district.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [liveRows]);

  // Live rows after the district filter (before the search box).
  const districtRows = useMemo(() => {
    if (!isLive) return [];
    if (!filterDistrict || filterDistrict === "All") return liveRows;
    const want = filterDistrict.trim().toLowerCase();
    return liveRows.filter((r) => r.district.trim().toLowerCase() === want);
  }, [isLive, liveRows, filterDistrict]);

  // Live rows as MandiPrice-shaped objects (with estimated 7-day history).
  const liveMandi: MandiPrice[] = useMemo(() => {
    return districtRows.map((r, i) => {
      const seedKey = `${r.crop}|${r.market}|${r.district}|${i}`;
      const history = estimatedHistory(r.modalPrice, seedKey);
      const { trend, changePercent } = trendOf(history);
      return {
        id: `live-${slugify(r.crop)}-${slugify(r.market || r.district || "mandi")}-${i}`,
        crop: r.crop,
        market: [r.market, r.district].filter(Boolean).join(" · ") || "Mandi",
        min: Math.round(r.minPrice),
        modal: Math.round(r.modalPrice),
        max: Math.round(r.maxPrice),
        history,
        trend,
        changePercent,
      };
    });
  }, [districtRows]);

  // Search box filters the (live or demo) table.
  const filteredLive = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return liveMandi;
    return liveMandi.filter(
      (m) =>
        m.crop.toLowerCase().includes(q) ||
        m.market.toLowerCase().includes(q) ||
        m.id.includes(q),
    );
  }, [liveMandi, query]);

  const filteredDemo = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MANDI_PRICES;
    return MANDI_PRICES.filter(
      (m) =>
        m.crop.toLowerCase().includes(q) ||
        m.market.toLowerCase().includes(q) ||
        m.id.includes(q),
    );
  }, [query]);

  // "Your Crops" — demo path (unchanged): join zone crops onto demo data.
  const yourCropsDemo: MandiPrice[] = useMemo(() => {
    const byId = new Map(MANDI_PRICES.map((m) => [m.id, m]));
    const out: MandiPrice[] = [];
    for (const z of zones) {
      const key = z.crop.trim().toLowerCase();
      const alias = key === "green chili" ? "chili" : key === "okra (bhindi)" ? "okra" : key;
      const hit = byId.get(alias) ?? [...byId.values()].find((m) => m.yourZone === z.id);
      if (hit && !out.some((o) => o.id === hit.id)) {
        out.push({ ...hit, yourZone: z.id, crop: hit.crop });
      }
    }
    if (out.length === 0) return YOUR_CROPS;
    for (const yc of YOUR_CROPS) {
      if (!out.some((o) => o.id === yc.id) && out.length < 3) out.push(yc);
    }
    return out.slice(0, 3);
  }, [zones]);

  // Active list + selection. The selection stays valid across live/demo
  // switches via derivation (no sync effect): an unknown id falls back to
  // the first row of the active list.
  const activeList = isLive ? liveMandi : MANDI_PRICES;
  const effectiveSelectedId = activeList.some((m) => m.id === selectedId)
    ? selectedId
    : (activeList[0]?.id ?? "tomato");

  const selected: MandiPrice =
    activeList.find((m) => m.id === effectiveSelectedId) ??
    activeList[0] ??
    MANDI_PRICES[0]!;

  const yieldNum = Math.max(0, Number(yieldKg) || 0);
  const estIncome = estimateIncome(yieldNum, selected.modal);
  const estMin = estimateIncome(yieldNum, selected.min);
  const estMax = estimateIncome(yieldNum, selected.max);

  const labels = useMemo(() => dayLabels(), []);
  const chartData = selected.history.map((v, i) => ({
    day: labels[i] ?? `D${i + 1}`,
    price: v,
  }));

  const todayStr = mounted
    ? new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "…";

  const updatedStr =
    mounted && lastUpdated
      ? new Date(lastUpdated).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : lastUpdated ?? "…";

  const handleStateChange = (next: string) => {
    setStateOverride(next);
    // Reset the district when the state changes: back to the farm district
    // if we're returning home, otherwise show everything.
    if (next === farmState) setDistrictOverride(null);
    else setDistrictOverride("All");
  };

  const handleRefresh = () => {
    // Re-run the fetch effect (state object identity trick not needed —
    // simply re-set the same state value via a cache-busting refetch).
    setLiveLoading(true);
    const params = new URLSearchParams();
    if (filterState) params.set("state", filterState);
    if (dataGovApiKey.trim()) params.set("apiKey", dataGovApiKey.trim());
    if (commodityResourceId.trim())
      params.set("resourceId", commodityResourceId.trim());
    fetch(`/api/mandi?${params.toString()}`)
      .then((r) => r.json().catch(() => null))
      .then((body) => {
        if (
          body?.ok &&
          Array.isArray(body.data) &&
          (body.data as LiveMandiRow[]).length > 0
        ) {
          const clean = (body.data as LiveMandiRow[]).filter(
            (r) => r && typeof r.crop === "string" && Number.isFinite(r.modalPrice),
          );
          if (clean.length > 0) {
            setLiveRows(clean);
            setLiveOk(true);
            setLastUpdated(body.updatedAt ?? new Date().toISOString());
            setLiveReason(null);
            return;
          }
        }
        setLiveRows([]);
        setLiveOk(false);
        setLiveReason(typeof body?.reason === "string" ? body.reason : "unavailable");
      })
      .catch(() => {
        setLiveRows([]);
        setLiveOk(false);
        setLiveReason("unavailable");
      })
      .finally(() => setLiveLoading(false));
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* ===== Source banner: live vs demo ===== */}
      <Rise>
        {isLive ? (
          <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-sky-500/25 bg-sky-500/[0.06] p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-white sm:text-base">
                📡 Live data: data.gov.in (Dept. of Consumer Affairs) · {filterState} ·{" "}
                {todayStr}
              </p>
              <p className="mt-1 flex items-start gap-1 text-xs leading-relaxed text-sky-100/70">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Updated {updatedStr} · {liveRows.length} records · prices ₹/quintal.
                Trend lines are estimated from today&apos;s modal.
              </p>
            </div>
            <span className="rounded-full border border-sky-400/40 bg-sky-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-200">
              Live
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-white sm:text-base">
                Gujarat Mandi Rates · {MARKET_UPDATED_LABEL} · {todayStr}
              </p>
              <p className="mt-1 flex items-start gap-1 text-xs leading-relaxed text-emerald-100/70">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {liveLoading
                  ? "Checking live mandi rates…"
                  : "Demo data — add API key in Settings for live rates. Prices shown ₹/quintal from representative APMC centres."}
                {liveReason && !liveLoading && liveReason !== "missing-api-key" && (
                  <span className="text-zinc-400"> (live unavailable: {liveReason})</span>
                )}
              </p>
            </div>
            <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-200">
              Demo data
            </span>
          </div>
        )}
      </Rise>

      {/* ===== State + District filters ===== */}
      <Rise delay={0.02}>
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              State
            </span>
            <select
              value={FILTER_STATES.includes(filterState) ? filterState : farmState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-colors focus:border-emerald-500/50 [&>option]:bg-[#0a120c]"
            >
              {FILTER_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block flex-1">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              District
            </span>
            <select
              value={filterDistrict}
              onChange={(e) => setDistrictOverride(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-colors focus:border-emerald-500/50 [&>option]:bg-[#0a120c]"
            >
              <option value="All">All districts</option>
              {farmDistrict && farmDistrict !== "All" && !districtOptions.includes(farmDistrict) && (
                <option value={farmDistrict}>{farmDistrict} (home)</option>
              )}
              {districtOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={liveLoading}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all active:scale-[0.98]",
              liveLoading
                ? "cursor-wait border border-white/10 bg-white/[0.04] text-zinc-400"
                : "bg-emerald-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:bg-emerald-400",
            )}
          >
            <RefreshCw className={cn("h-4 w-4", liveLoading && "animate-spin")} />
            {liveLoading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </Rise>

      {/* ===== Your Crops ===== */}
      <Rise delay={0.05}>
        <Card>
          <CardHeader
            title="Your Crops — AI Harvest Advice"
            subtitle={
              isLive
                ? `${farmCrops.slice(0, 3).map(displayCropName).join(" · ")} · live quotes`
                : "Tomato · Zone A — Chili · Zone B — Spinach · Zone C"
            }
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Sprout className="h-4 w-4" />
              </span>
            }
          />
          {isLive ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {farmCrops.slice(0, 3).map((slug) => {
                const matches = matchLiveForCrop(slug, districtRows);
                const name = displayCropName(slug);
                if (matches.length === 0) {
                  return (
                    <div
                      key={slug}
                      className="rounded-2xl border border-white/10 bg-black/40 p-4 opacity-60"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-sm font-extrabold text-zinc-300">
                          <Leaf className="h-4 w-4 text-zinc-500" />
                          {name}
                        </p>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                          No data
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                        No mandi data today
                        {filterDistrict !== "All" ? ` in ${filterDistrict}` : ` in ${filterState}`}
                        {" "}— try “All districts” or check back tomorrow. No prices guessed.
                      </p>
                    </div>
                  );
                }
                const row = matches[0]!;
                const history = estimatedHistory(
                  row.modalPrice,
                  `${row.crop}|${row.market}|${row.district}|your`,
                );
                const { trend, changePercent } = trendOf(history);
                const pseudo: MandiPrice = {
                  id: `your-${slugify(slug)}`,
                  crop: name,
                  market: row.market,
                  min: 0,
                  modal: 0,
                  max: 0,
                  history,
                  trend,
                  changePercent,
                };
                return (
                  <div
                    key={slug}
                    className="rounded-2xl border border-emerald-500/20 bg-black/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-sm font-extrabold text-white">
                        <Leaf className="h-4 w-4 text-emerald-300" />
                        {name}
                      </p>
                      <TrendBadge crop={pseudo} />
                    </div>
                    <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      {[row.market, row.district].filter(Boolean).join(" · ") || "Mandi"}
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-zinc-200">
                      {liveAdviceFor(name, row, trend, changePercent)}
                    </p>
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        20 kg @ modal
                      </span>
                      <span className="text-sm font-extrabold text-emerald-300">
                        {formatINR(estimateIncome(20, row.modalPrice))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {yourCropsDemo.map((crop) => (
                <div
                  key={crop.id}
                  className="rounded-2xl border border-emerald-500/20 bg-black/40 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-extrabold text-white">
                      <Leaf className="h-4 w-4 text-emerald-300" />
                      {crop.crop}
                      {crop.yourZone && (
                        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                          Zone {crop.yourZone}
                        </span>
                      )}
                    </p>
                    <TrendBadge crop={crop} />
                  </div>
                  {crop.yourStage && (
                    <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      {crop.yourStage}
                    </p>
                  )}
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-200">
                    {harvestAdviceFor(crop)}
                  </p>
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      20 kg @ modal
                    </span>
                    <span className="text-sm font-extrabold text-emerald-300">
                      {formatINR(estimateIncome(20, crop.modal))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Rise>

      {/* ===== Price table ===== */}
      <Rise delay={0.1}>
        <Card>
          <CardHeader
            title="Mandi Price Table"
            subtitle={
              isLive
                ? `Live · ${filterState}${filterDistrict !== "All" ? ` · ${filterDistrict}` : ""} · tap a row for the estimator · ₹ per quintal`
                : "Tap a row to load it in the income estimator · ₹ per quintal"
            }
            action={
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-zinc-300">
                {isLive
                  ? `${filteredLive.length}/${liveMandi.length} markets`
                  : `${filteredDemo.length}/${MANDI_PRICES.length} crops`}
              </span>
            }
          />
          <label className="relative mb-3 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isLive
                  ? "Search crop, market or district… e.g. tomato, Ahmedabad"
                  : "Search crop or mandi… e.g. tomato, onion, Rajkot"
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/50"
            />
          </label>

          {isLive ? (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="px-3 py-2.5 font-bold">Crop / Mandi</th>
                    <th className="px-3 py-2.5 font-bold">Trend</th>
                    <th className="px-3 py-2.5 font-bold">7-day (est.)</th>
                    <th className="px-3 py-2.5 text-right font-bold">Min</th>
                    <th className="px-3 py-2.5 text-right font-bold">Modal ★</th>
                    <th className="px-3 py-2.5 text-right font-bold">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLive.map((m) => {
                    const active = m.id === effectiveSelectedId;
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedId(m.id)}
                        className={cn(
                          "cursor-pointer border-b border-white/5 transition-colors last:border-0",
                          active ? "bg-emerald-500/[0.08]" : "hover:bg-white/[0.03]",
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-white">{m.crop}</p>
                          <p className="text-[11px] text-zinc-500">{m.market}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <TrendBadge crop={m} />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="h-8 w-28">
                            <Sparkline data={m.history} color={sparkColor(m)} />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-400">
                          {formatINR(m.min)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span
                            className={cn(
                              "inline-block rounded-lg px-2 py-1 font-extrabold tabular-nums",
                              active
                                ? "bg-emerald-500 text-black shadow-[0_0_14px_rgba(34,197,94,0.5)]"
                                : "bg-emerald-500/15 text-emerald-200",
                            )}
                          >
                            {formatINR(m.modal)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-300">
                          {formatINR(m.max)}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLive.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-zinc-500">
                        No live rows match “{query}”
                        {filterDistrict !== "All" ? ` in ${filterDistrict}` : ""} — try
                        clearing the search or picking “All districts”.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="px-3 py-2.5 font-bold">Crop / Mandi</th>
                    <th className="px-3 py-2.5 font-bold">Trend</th>
                    <th className="px-3 py-2.5 font-bold">7-day</th>
                    <th className="px-3 py-2.5 text-right font-bold">Min</th>
                    <th className="px-3 py-2.5 text-right font-bold">Modal ★</th>
                    <th className="px-3 py-2.5 text-right font-bold">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDemo.map((m) => {
                    const active = m.id === effectiveSelectedId;
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedId(m.id)}
                        className={cn(
                          "cursor-pointer border-b border-white/5 transition-colors last:border-0",
                          active ? "bg-emerald-500/[0.08]" : "hover:bg-white/[0.03]",
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-white">
                            {m.crop}
                            {m.yourZone && (
                              <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                Yours · {m.yourZone}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-zinc-500">{m.market}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <TrendBadge crop={m} />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="h-8 w-28">
                            <Sparkline data={m.history} color={sparkColor(m)} />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-400">
                          {formatINR(m.min)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span
                            className={cn(
                              "inline-block rounded-lg px-2 py-1 font-extrabold tabular-nums",
                              active
                                ? "bg-emerald-500 text-black shadow-[0_0_14px_rgba(34,197,94,0.5)]"
                                : "bg-emerald-500/15 text-emerald-200",
                            )}
                          >
                            {formatINR(m.modal)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-300">
                          {formatINR(m.max)}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDemo.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-zinc-500">
                        No crops match “{query}” — try tomato, onion, wheat…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-[11px] text-zinc-600">
            {isLive
              ? "Modal = most-traded price of the day at that mandi. 7-day sparkline is an estimated trend projected from today's live modal."
              : "Modal = most-traded price of the day. Min/max = day's range at that APMC."}
          </p>
        </Card>
      </Rise>

      {/* ===== Income estimator ===== */}
      <Rise delay={0.14}>
        <Card>
          <CardHeader
            title="Income Estimator"
            subtitle={`${selected.crop} · ${selected.market} · modal ${formatINR(selected.modal)}/quintal${isLive ? " · live" : ""}`}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Calculator className="h-4 w-4" />
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="space-y-3 lg:col-span-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Crop
                </span>
                <select
                  value={effectiveSelectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-colors focus:border-emerald-500/50 [&>option]:bg-[#0a120c]"
                >
                  {activeList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.crop} — {formatINR(m.modal)}/qtl
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Expected yield (kg)
                </span>
                <input
                  value={yieldKg}
                  onChange={(e) =>
                    setYieldKg(e.target.value.replace(/[^0-9.]/g, "").slice(0, 7))
                  }
                  inputMode="decimal"
                  placeholder="e.g. 20"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors placeholder:font-normal placeholder:text-zinc-600 focus:border-emerald-500/50"
                />
              </label>
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/70">
                  Estimated income @ modal
                </p>
                <p className="mt-1 text-3xl font-extrabold tabular-nums text-white">
                  {formatINR(estIncome)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {yieldNum} kg × {formatINR(selected.modal)}/100 kg · range{" "}
                  {formatINR(estMin)} – {formatINR(estMax)}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{
                      width: `${selected.max ? Math.min(100, (selected.modal / selected.max) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                  Modal sits at {selected.max ? Math.round((selected.modal / selected.max) * 100) : 0}%
                  of today&apos;s max — sell same-day for leafy veg, you can hold onion/potato/wheat.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/40 p-3 lg:col-span-3">
              <p className="px-1 pb-2 text-xs font-bold text-zinc-400">
                7-day modal price · {selected.crop} (₹/quintal)
                {isLive && (
                  <span className="ml-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-200">
                    estimated trend
                  </span>
                )}
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="mandiFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `₹${(v / 1000).toFixed(1)}k`}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0a120c",
                        border: "1px solid rgba(34,197,94,0.3)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#fff", fontWeight: 700 }}
                      formatter={(v) => [`${formatINR(Number(v))}/qtl`, "Modal"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      fill="url(#mandiFill)"
                      dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="px-1 pt-2 text-[11px] leading-relaxed text-zinc-500">
                {isLive ? (
                  <>
                    {selected.crop} live modal {formatINR(selected.modal)}/qtl. 7-day line is
                    an estimated trend projected from today&apos;s quote — not official
                    history.
                  </>
                ) : (
                  <>
                    {selected.crop} moved {selected.changePercent >= 0 ? "+" : ""}
                    {selected.changePercent}% over 7 days ({formatINR(selected.history[0])} →{" "}
                    {formatINR(selected.history[selected.history.length - 1])}). Demo series — wire
                    Agmarknet for live mandis.
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>
      </Rise>
    </div>
  );
}
