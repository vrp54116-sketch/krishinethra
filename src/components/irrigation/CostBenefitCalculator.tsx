"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Droplets, IndianRupee, Leaf } from "lucide-react";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

type MandiResponse = {
  ok?: boolean;
  data?: Array<{ crop: string; modalPrice: number }>;
};

function money(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export default function CostBenefitCalculator() {
  const t = useT();
  const [acres, setAcres] = useState(1);
  const [waterPrice, setWaterPrice] = useState(2);
  const [yieldPerAcre, setYieldPerAcre] = useState(8);
  const [marketPrice, setMarketPrice] = useState(12);
  const [marketPriceSource, setMarketPriceSource] = useState("default estimate");
  const profile = useFarmStore((s) => s.settings.farmProfile);
  const apiKey = useFarmStore((s) => s.settings.dataGovApiKey);
  const resourceId = useFarmStore((s) => s.settings.commodityResourceId);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      state: profile?.state || "Gujarat",
      crop: "Tomato",
    });
    if (apiKey.trim()) params.set("apiKey", apiKey.trim());
    if (resourceId.trim()) params.set("resourceId", resourceId.trim());
    fetch(`/api/mandi?${params}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<MandiResponse>)
      .then((result) => {
        const quote = result.ok
          ? result.data?.find((row) => /tomato/i.test(row.crop) && row.modalPrice > 0)
          : undefined;
        if (quote) {
          setMarketPrice(Math.round((quote.modalPrice / 100) * 100) / 100);
          setMarketPriceSource("live mandi modal rate");
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [apiKey, profile?.state, resourceId]);

  const values = useMemo(() => {
    const dailyFloodLiters = acres * 32_000;
    const dailySavedLiters = dailyFloodLiters * 0.45;
    const monthlyWaterSaving = (dailySavedLiters / 1_000) * waterPrice * 30;
    const seasonYieldUplift = acres * yieldPerAcre * 1_000 * 0.2 * marketPrice;
    const paybackDays = Math.ceil(1_500 / Math.max(monthlyWaterSaving, 1));
    return { dailyFloodLiters, dailySavedLiters, monthlyWaterSaving, seasonYieldUplift, paybackDays };
  }, [acres, marketPrice, waterPrice, yieldPerAcre]);

  const inputClass = "mt-1 w-full border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-emerald-500";
  const rangeClass = "mt-2 w-full accent-emerald-500";

  return (
    <section className="border border-[var(--line)] bg-[var(--panel)] p-5 text-[var(--ink)]">
      <div className="mb-4 flex items-center gap-2 border-b border-[var(--line)] pb-3">
        <Calculator className="h-4 w-4 text-emerald-400" />
        <div>
          <h2 className="font-editorial-mono text-xs font-bold uppercase tracking-wider">{t("cost.title")}</h2>
          <p className="mt-1 text-xs text-[var(--ink-3)]">{t("cost.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-[var(--ink-2)]">{t("cost.farmSize")}
          <input className={inputClass} type="number" min="0" max="50" step="0.1" value={acres} onChange={(event) => setAcres(Math.max(0, Number(event.target.value) || 0))} />
          <input className={rangeClass} aria-label={t("cost.farmSize")} type="range" min="0" max="50" step="0.1" value={Math.min(50, acres)} onChange={(event) => setAcres(Number(event.target.value))} />
        </label>
        <label className="text-xs text-[var(--ink-2)]">{t("cost.waterPrice")}
          <input className={inputClass} type="number" min="0" max="50" step="0.1" value={waterPrice} onChange={(event) => setWaterPrice(Math.max(0, Number(event.target.value) || 0))} />
          <input className={rangeClass} aria-label={t("cost.waterPrice")} type="range" min="0" max="50" step="0.1" value={Math.min(50, waterPrice)} onChange={(event) => setWaterPrice(Number(event.target.value))} />
        </label>
        <label className="text-xs text-[var(--ink-2)]">{t("cost.yield")}
          <input className={inputClass} type="number" min="0" max="100" step="0.1" value={yieldPerAcre} onChange={(event) => setYieldPerAcre(Math.max(0, Number(event.target.value) || 0))} />
          <input className={rangeClass} aria-label={t("cost.yield")} type="range" min="0" max="100" step="0.1" value={Math.min(100, yieldPerAcre)} onChange={(event) => setYieldPerAcre(Number(event.target.value))} />
        </label>
        <label className="text-xs text-[var(--ink-2)]">{t("cost.marketPrice")}
          <input className={inputClass} type="number" min="0" step="0.1" value={marketPrice} onChange={(event) => { setMarketPrice(Math.max(0, Number(event.target.value) || 0)); setMarketPriceSource("your estimate"); }} />
          <input className={rangeClass} aria-label={t("cost.marketPrice")} type="range" min="0" max="100" step="0.1" value={Math.min(100, marketPrice)} onChange={(event) => { setMarketPrice(Number(event.target.value)); setMarketPriceSource("your estimate"); }} />
          <span className="mt-1 block text-[10px] text-[var(--ink-3)]">{t("cost.priceSource")}: {marketPriceSource}</span>
        </label>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-emerald-500/25 bg-emerald-500/10 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-300"><IndianRupee className="h-4 w-4" />{t("cost.monthlySaved")}</p>
          <p className="mt-2 text-4xl font-black tabular-nums text-emerald-300">{money(values.monthlyWaterSaving)} <span className="text-sm">{t("cost.perMonth")}</span></p>
        </div>

        <div className="border border-[var(--line)] bg-[var(--panel-2)] p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase text-[var(--ink-2)]"><Droplets className="h-4 w-4 text-sky-400" />{t("cost.dailyWater")}</p>
          {[{ label: t("cost.flood"), liters: values.dailyFloodLiters, color: "bg-sky-500" }, { label: "KrishiNethra", liters: values.dailyFloodLiters - values.dailySavedLiters, color: "bg-emerald-500" }].map((bar) => (
            <div key={bar.label} className="mb-3">
              <div className="mb-1 flex justify-between text-[11px] text-[var(--ink-2)]"><span>{bar.label}</span><span>{Math.round(bar.liters).toLocaleString("en-IN")} L</span></div>
              <div className="h-3 bg-[var(--bg)]"><div className={`h-full ${bar.color}`} style={{ width: `${values.dailyFloodLiters ? (bar.liters / values.dailyFloodLiters) * 100 : 0}%` }} /></div>
            </div>
          ))}
          <p className="text-[10px] text-[var(--ink-3)]">{Math.round(values.dailySavedLiters).toLocaleString("en-IN")} L {t("cost.savedEachDay")}</p>
        </div>

        <div className="flex flex-col justify-between border border-[var(--line)] bg-[var(--panel-2)] p-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-[var(--ink-2)]"><Leaf className="h-4 w-4 text-emerald-400" />{t("cost.seasonUplift")}</p>
            <p className="mt-2 text-3xl font-black tabular-nums">{money(values.seasonYieldUplift)}</p>
            <p className="mt-1 text-xs text-[var(--ink-3)]">{t("cost.yieldUpliftDetail")}</p>
          </div>
          <p className="mt-4 text-sm font-bold text-emerald-300">{t("cost.hardwarePayback").replace("{days}", String(values.paybackDays))}</p>
        </div>
      </div>
      <p className="mt-4 border-t border-[var(--line)] pt-3 text-[11px] text-[var(--ink-3)]">Drip + sensor irrigation saves ~45% water vs flood (FAO)</p>
    </section>
  );
}
