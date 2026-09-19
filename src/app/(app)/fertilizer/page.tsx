"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Beaker,
  BookOpen,
  Calculator,
  CheckSquare,
  Clock,
  FlaskConical,
  History,
  Leaf,
  Sprout,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import {
  calculateFertilizer,
  daysSinceLastFertilizer,
  FERTILIZER_CROPS,
  GROWTH_STAGES,
  SOIL_TYPES,
  stageFromAgeDays,
  type FertilizerCrop,
  type FertilizerResult,
  type GrowthStage,
  type SoilType,
} from "@/lib/agronomy";
import { Card, CardHeader } from "@/components/dashboard/ui";

function Rise({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
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

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y || 1970, (m || 1) - 1, d || 1);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function cropLabel(id: FertilizerCrop): string {
  return FERTILIZER_CROPS.find((c) => c.id === id)?.label ?? id;
}

function stageLabel(id: GrowthStage): string {
  return GROWTH_STAGES.find((s) => s.id === id)?.label ?? id;
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-colors placeholder:font-normal placeholder:text-zinc-600 focus:border-emerald-500/50 [&>option]:bg-[#0a120c]";

const labelCls =
  "mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500";

/* ------------------------------------------------------------------ */
/* Result card                                                         */
/* ------------------------------------------------------------------ */

function ResultCard({
  result,
  onAddTask,
  onLogDiary,
}: {
  result: FertilizerResult;
  onAddTask: () => void;
  onLogDiary: () => void;
}) {
  const { organic, chemical } = result;
  return (
    <motion.div
      key={`${result.crop}-${result.stage}-${result.plantCount}-${result.soilType}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Organic option */}
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
        <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
          <Sprout className="h-4 w-4" /> Organic option · first choice
        </p>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-emerald-50/90">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            Vermicompost <b>{organic.vermicompostGPerPlant} g/plant</b>
            <span className="text-emerald-200/60">
              ({organic.totalVermicompostKg} kg for {result.plantCount} plants)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            Neem cake <b>{organic.neemCakeGPerPlant} g/plant</b>
            <span className="text-emerald-200/60">
              ({organic.totalNeemCakeKg} kg total)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            Liquid Jeevamrut — {organic.jeevamrut}
          </li>
        </ul>
      </div>

      {/* Chemical option */}
      <div className="rounded-2xl border border-sky-500/25 bg-sky-500/[0.06] p-4">
        <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-300">
          <FlaskConical className="h-4 w-4" /> Chemical option
        </p>
        {chemical.stopped ? (
          <p className="mt-2 text-sm leading-relaxed text-sky-100/80">
            Stop chemical feeding — {chemical.note}
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-sky-50/90">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
              <span>
                <b>{chemical.grade}</b> @ <b>{chemical.gPerPlant} g/plant</b> every{" "}
                <b>{chemical.frequencyDays} days</b>
                <span className="text-sky-200/60"> ({chemical.totalKg} kg total)</span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
              {chemical.note}
            </li>
          </ul>
        )}
      </div>

      {/* Method / time / next due */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-black/40 p-3">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <Beaker className="h-3 w-3" /> Method
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-200">{result.method}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/40 p-3">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <Sun className="h-3 w-3" /> Best time
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-200">{result.bestTime}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-3">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            <Clock className="h-3 w-3" /> Next due
          </p>
          <p className="mt-1 text-xs font-bold text-emerald-200">
            {result.nextDueInDays === 0 ? (
              <>No further dose — harvest window</>
            ) : (
              <>
                {fmtDay(result.nextDueDate)}
                <span className="ml-1 font-semibold text-zinc-400">
                  (in {result.nextDueInDays} days)
                </span>
              </>
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">{result.soilNote}</p>
        </div>
      </div>

      {/* Warnings */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
        <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-300">
          <TriangleAlert className="h-4 w-4" /> Warnings
        </p>
        <ul className="mt-2 space-y-1.5">
          {result.warnings.map((w) => (
            <li key={w} className="flex gap-2 text-xs leading-relaxed text-amber-50/90">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              {w}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onAddTask}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-extrabold text-black shadow-[0_0_16px_rgba(34,197,94,0.35)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
        >
          <CheckSquare className="h-4 w-4" /> Add to Task Manager
        </button>
        <button
          type="button"
          onClick={onLogDiary}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-xs font-extrabold text-emerald-200 transition-all hover:bg-emerald-500/20 active:scale-[0.98]"
        >
          <BookOpen className="h-4 w-4" /> Log in Diary
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function FertilizerPage() {
  const t = useT();
  const diary = useFarmStore((s) => s.diary);
  const addTask = useFarmStore((s) => s.addTask);
  const addDiary = useFarmStore((s) => s.addDiary);

  const [crop, setCrop] = useState<FertilizerCrop>("tomato");
  const [stage, setStage] = useState<GrowthStage>("vegetative");
  const [ageDays, setAgeDays] = useState("");
  const [plantCount, setPlantCount] = useState("120");
  const [soilType, setSoilType] = useState<SoilType>("loamy");
  // User override for "days since last fertilized". Until the user types,
  // the value is derived live from the diary (prefill, no effect needed).
  const [daysOverride, setDaysOverride] = useState<string | null>(null);
  const [result, setResult] = useState<FertilizerResult | null>(null);

  const lastFertDays = useMemo(() => daysSinceLastFertilizer(diary), [diary]);
  const daysSince =
    daysOverride ?? (lastFertDays != null ? String(lastFertDays) : "");

  const ageNum = Number(ageDays);
  const autoStage: GrowthStage | null =
    ageDays.trim() !== "" && Number.isFinite(ageNum) && ageNum >= 0
      ? stageFromAgeDays(crop, Math.floor(ageNum))
      : null;
  const effectiveStage = autoStage ?? stage;

  const fertHistory = useMemo(
    () => diary.filter((d) => d.type === "fertilizer"),
    [diary],
  );

  const handleCalculate = () => {
    const count = Math.max(1, Math.floor(Number(plantCount)) || 1);
    setPlantCount(String(count));
    const r = calculateFertilizer({
      crop,
      stage: effectiveStage,
      plantCount: count,
      soilType,
      daysSinceLastFertilized: daysSince.trim() === "" ? null : Math.max(0, Number(daysSince) || 0),
    });
    setResult(r);
  };

  const taskTitleFor = (r: FertilizerResult): string =>
    r.chemical.stopped
      ? `Stop feeding ${cropLabel(r.crop)} (${stageLabel(r.stage)}) — harvest window`
      : `Fertilize ${cropLabel(r.crop)} (${stageLabel(r.stage)}) — ${r.chemical.grade} ${r.chemical.gPerPlant}g/plant × ${r.plantCount} plants`;

  const diaryDetailsFor = (r: FertilizerResult): string =>
    r.chemical.stopped
      ? `Fertilizer check for ${cropLabel(r.crop)} (${stageLabel(r.stage)}, ${r.plantCount} plants, ${r.soilType} soil) — feeding stopped, harvest window. Organic mulch only.`
      : `Fertilized ${cropLabel(r.crop)} (${stageLabel(r.stage)}) × ${r.plantCount} plants on ${r.soilType} soil — organic: ${r.organic.totalVermicompostKg} kg vermicompost + ${r.organic.totalNeemCakeKg} kg neem cake; chemical: ${r.chemical.grade} ${r.chemical.gPerPlant}g/plant (${r.chemical.totalKg} kg total). Next due ${r.nextDueDate}.`;

  const handleAddTask = () => {
    if (!result) return;
    addTask({
      title: taskTitleFor(result),
      priority: "high",
      dueDate: result.nextDueDate,
      done: false,
      source: "manual",
    });
    toast.success("Added to Task Manager", {
      description: `High-priority task due ${fmtDay(result.nextDueDate)}.`,
    });
  };

  const handleLogDiary = () => {
    if (!result) return;
    addDiary({ type: "fertilizer", details: diaryDetailsFor(result) });
    toast.success("Logged in Farm Diary", {
      description: "Fertilizer dose filed under fertilization history.",
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        {/* Form */}
        <Rise>
          <Card className="h-full">
            <CardHeader
              title={t("titles.fertilizer")}
              subtitle="Dose calculator · organic + chemical options"
              action={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <Calculator className="h-4 w-4" />
                </span>
              }
            />
            <div className="space-y-3">
              <label className="block">
                <span className={labelCls}>Crop</span>
                <select
                  value={crop}
                  onChange={(e) => {
                    setCrop(e.target.value as FertilizerCrop);
                    setResult(null);
                  }}
                  className={inputCls}
                >
                  {FERTILIZER_CROPS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>Growth stage</span>
                  <select
                    value={effectiveStage}
                    onChange={(e) => {
                      setStage(e.target.value as GrowthStage);
                      setAgeDays("");
                      setResult(null);
                    }}
                    className={inputCls}
                  >
                    {GROWTH_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>Plant age (days, optional)</span>
                  <input
                    value={ageDays}
                    onChange={(e) => {
                      setAgeDays(e.target.value.replace(/[^0-9]/g, "").slice(0, 4));
                      setResult(null);
                    }}
                    inputMode="numeric"
                    placeholder="e.g. 45"
                    className={inputCls}
                  />
                </label>
              </div>
              {autoStage && (
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
                  <Leaf className="h-3 w-3" /> {ageNum} days old → {stageLabel(autoStage)}{" "}
                  stage (auto-detected)
                </p>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>Number of plants</span>
                  <input
                    value={plantCount}
                    onChange={(e) => {
                      setPlantCount(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
                      setResult(null);
                    }}
                    inputMode="numeric"
                    placeholder="e.g. 120"
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Days since last fertilized</span>
                  <input
                    value={daysSince}
                    onChange={(e) => {
                      setDaysOverride(e.target.value.replace(/[^0-9]/g, "").slice(0, 4));
                    }}
                    inputMode="numeric"
                    placeholder={lastFertDays == null ? "No record yet" : "e.g. 10"}
                    className={inputCls}
                  />
                </label>
              </div>
              {lastFertDays != null && (
                <p className="text-[11px] text-zinc-500">
                  Last fertilizer in diary was {lastFertDays} day
                  {lastFertDays === 1 ? "" : "s"} ago.
                </p>
              )}

              <div>
                <span className={labelCls}>Soil type</span>
                <div className="grid grid-cols-3 gap-2">
                  {SOIL_TYPES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={soilType === s.id}
                      onClick={() => {
                        setSoilType(s.id);
                        setResult(null);
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-xs font-extrabold transition-all active:scale-[0.97]",
                        soilType === s.id
                          ? "border-emerald-400/60 bg-emerald-500/10 text-white shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                          : "border-white/10 bg-black/30 text-zinc-400 hover:border-emerald-500/30 hover:text-white",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCalculate}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
              >
                <Calculator className="h-4 w-4" strokeWidth={2.5} /> Calculate
              </button>
            </div>
          </Card>
        </Rise>

        {/* Result */}
        <Rise delay={0.06}>
          <Card className="h-full">
            <CardHeader
              title="Recommendation"
              subtitle={
                result
                  ? `${cropLabel(result.crop)} · ${stageLabel(result.stage)} · ${result.plantCount} plants · ${result.soilType} soil`
                  : "Fill the form and press Calculate"
              }
              action={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                  <Beaker className="h-4 w-4" />
                </span>
              }
            />
            <AnimatePresence mode="wait">
              {result ? (
                <ResultCard
                  result={result}
                  onAddTask={handleAddTask}
                  onLogDiary={handleLogDiary}
                />
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs leading-relaxed text-zinc-500"
                >
                  Your dose plan appears here — vermicompost + neem cake + jeevamrut
                  alongside the matching NPK option, method, timing and next-due date.
                </motion.p>
              )}
            </AnimatePresence>
          </Card>
        </Rise>
      </div>

      {/* History */}
      <Rise delay={0.1}>
        <Card>
          <CardHeader
            title="Fertilization History"
            subtitle={`${fertHistory.length} entr${fertHistory.length === 1 ? "y" : "ies"} from the Farm Diary`}
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                <History className="h-4 w-4" />
              </span>
            }
          />
          {fertHistory.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs leading-relaxed text-zinc-500">
              No fertilizer logged yet — calculate a dose and press “Log in Diary”.
            </p>
          ) : (
            <ul className="space-y-2">
              {fertHistory.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/30 p-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                    <Sprout className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-relaxed text-zinc-100">{e.details}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {fmtDay(e.date)}
                      {e.zone ? ` · Zone ${e.zone}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Rise>
    </div>
  );
}
