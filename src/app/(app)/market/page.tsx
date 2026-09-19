"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Info,
  Leaf,
  Minus,
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
import { useFarmStore } from "@/lib/store";
import { Card, CardHeader, Sparkline, useMounted } from "@/components/dashboard/ui";
import {
  estimateIncome,
  formatINR,
  harvestAdviceFor,
  MANDI_PRICES,
  MARKET_UPDATED_LABEL,
  YOUR_CROPS,
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

export default function MarketPage() {
  const mounted = useMounted();
  const zones = useFarmStore((s) => s.zones);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("tomato");
  const [yieldKg, setYieldKg] = useState("20");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MANDI_PRICES;
    return MANDI_PRICES.filter(
      (m) =>
        m.crop.toLowerCase().includes(q) ||
        m.market.toLowerCase().includes(q) ||
        m.id.includes(q),
    );
  }, [query]);

  // "Your Crops" — join live zone crops from the store onto mandi data
  // so renaming a zone crop flows through automatically.
  const yourCrops: MandiPrice[] = useMemo(() => {
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
    // Fallback to static mapping if zones were renamed to non-mandi crops.
    if (out.length === 0) return YOUR_CROPS;
    // Ensure tomato/chili/spinach advice still shows even if a zone was renamed.
    for (const yc of YOUR_CROPS) {
      if (!out.some((o) => o.id === yc.id) && out.length < 3) out.push(yc);
    }
    return out.slice(0, 3);
  }, [zones]);

  const selected: MandiPrice =
    MANDI_PRICES.find((m) => m.id === selectedId) ?? MANDI_PRICES[0];

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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* ===== Header / date stamp ===== */}
      <Rise>
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
              DEMO DATA — integrate Agmarknet API for production. Prices shown ₹/quintal
              from representative APMC centres.
            </p>
          </div>
        </div>
      </Rise>

      {/* ===== Your Crops ===== */}
      <Rise delay={0.05}>
        <Card>
          <CardHeader
            title="Your Crops — AI Harvest Advice"
            subtitle="Tomato · Zone A — Chili · Zone B — Spinach · Zone C"
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Sprout className="h-4 w-4" />
              </span>
            }
          />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {yourCrops.map((crop) => (
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
        </Card>
      </Rise>

      {/* ===== Price table ===== */}
      <Rise delay={0.1}>
        <Card>
          <CardHeader
            title="Mandi Price Table"
            subtitle="Tap a row to load it in the income estimator · ₹ per quintal"
            action={
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-zinc-300">
                {filtered.length}/{MANDI_PRICES.length} crops
              </span>
            }
          />
          <label className="relative mb-3 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search crop or mandi… e.g. tomato, onion, Rajkot"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-500/50"
            />
          </label>

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
                {filtered.map((m) => {
                  const active = m.id === selectedId;
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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-zinc-500">
                      No crops match “{query}” — try tomato, onion, wheat…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-zinc-600">
            Modal = most-traded price of the day. Min/max = day&apos;s range at that APMC.
          </p>
        </Card>
      </Rise>

      {/* ===== Income estimator ===== */}
      <Rise delay={0.14}>
        <Card>
          <CardHeader
            title="Income Estimator"
            subtitle={`${selected.crop} · ${selected.market} · modal ${formatINR(selected.modal)}/quintal`}
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
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-colors focus:border-emerald-500/50 [&>option]:bg-[#0a120c]"
                >
                  {MANDI_PRICES.map((m) => (
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
                {selected.crop} moved {selected.changePercent >= 0 ? "+" : ""}
                {selected.changePercent}% over 7 days ({formatINR(selected.history[0])} →{" "}
                {formatINR(selected.history[selected.history.length - 1])}). Demo series — wire
                Agmarknet for live mandis.
              </p>
            </div>
          </div>
        </Card>
      </Rise>
    </div>
  );
}
