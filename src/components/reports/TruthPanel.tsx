"use client";

import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

type TruthRow = {
  feature: string;
  kind: "hardware" | "model" | "api" | "rules" | "simulation";
  source: string;
};

const FEATURES: TruthRow[] = [
  { feature: "Soil moisture", kind: "hardware", source: "Soil probes on the farm device" },
  { feature: "Temperature", kind: "hardware", source: "Temperature sensor on the farm device" },
  { feature: "Humidity", kind: "hardware", source: "Humidity sensor on the farm device" },
  { feature: "Rain detection", kind: "hardware", source: "Rain sensor on the farm device" },
  { feature: "Pump state", kind: "hardware", source: "Pump state reported by the farm device" },
  { feature: "Buzzer alerts", kind: "hardware", source: "Buzzer output on the farm device" },
  { feature: "Relay control", kind: "hardware", source: "Physical relay connected to the pump" },
  { feature: "Leaf Disease Doctor", kind: "model", source: "11-class tomato model (9 diseases + healthy + not-a-leaf), trained by us on Teachable Machine, runs fully in the browser — works offline" },
  { feature: "KrishiGPT", kind: "api", source: "Gemini API response; requires internet and a configured key" },
  { feature: "Weather forecast", kind: "api", source: "Open-Meteo forecast API; requires internet" },
  { feature: "Mandi prices", kind: "api", source: "data.gov.in market API when configured; demo fallback is labeled" },
  { feature: "Comfort gauge", kind: "rules", source: "Calculated from sensor values and agronomy rules" },
  { feature: "Risk matrix", kind: "rules", source: "Rule-based crop risk calculation" },
  { feature: "Spray windows", kind: "rules", source: "Weather and agronomy rules" },
  { feature: "Jal Agent thresholds", kind: "rules", source: "Local configured thresholds control automatic irrigation" },
  { feature: "Demo mode data", kind: "simulation", source: "Generated sample readings; never hardware measurements" },
];

const BADGES: Record<TruthRow["kind"], string> = {
  hardware: "LIVE-HARDWARE",
  model: "TRAINED-MODEL",
  api: "REAL-API",
  rules: "SCIENCE-RULES",
  simulation: "SIMULATION-LABELED",
};

export default function TruthPanel() {
  const t = useT();
  const source = useFarmStore((s) => s.source);
  const liveSource = useFarmStore((s) => s.liveSource);
  const stale = useFarmStore((s) => s.snapshot.stale);
  const hardwareIsLive = source === "LIVE" && liveSource === "mqtt" && !stale;

  return (
    <section className="border border-[var(--line)] bg-[var(--panel)] p-5 text-[var(--ink)]">
      <div className="mb-4 border-b border-[var(--line)] pb-3">
        <h2 className="font-editorial-mono text-sm font-bold uppercase tracking-wider">{t("truth.title")}</h2>
        <p className="mt-1 text-xs text-[var(--ink-3)]">{t("truth.subtitle")}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
              <th className="px-2 py-2">{t("truth.feature")}</th>
              <th className="px-2 py-2">{t("truth.source")}</th>
              <th className="px-2 py-2">{t("truth.howMade")}</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((row) => {
              const isLiveRow = row.kind === "hardware" && hardwareIsLive;
              const badge = row.kind === "hardware" && !isLiveRow ? "SIMULATION-LABELED" : BADGES[row.kind];
              return (
                <tr key={row.feature} className="border-b border-[var(--line)]/70 align-top">
                  <td className="px-2 py-2 font-semibold">{(t(`truth.feature.${row.feature}`) !== `truth.feature.${row.feature}` && t(`truth.feature.${row.feature}`)) || row.feature}</td>
                  <td className="px-2 py-2 text-[var(--ink-2)]">{(t(`truth.source.${row.feature}`) !== `truth.source.${row.feature}` && t(`truth.source.${row.feature}`)) || row.source}{row.kind === "hardware" && !hardwareIsLive ? ` — current store source is ${source} (${liveSource}); no live reading is claimed.` : ""}</td>
                  <td className="px-2 py-2"><span className={`inline-flex whitespace-nowrap border px-2 py-1 font-mono text-[9px] font-bold ${isLiveRow ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : row.kind === "simulation" || (row.kind === "hardware" && !hardwareIsLive) ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-sky-500/30 bg-sky-500/10 text-sky-200"}`}>{badge}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
