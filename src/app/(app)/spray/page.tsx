"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bug,
  CalendarDays,
  Check,
  CloudRain,
  FlaskConical,
  History,
  MapPin,
  Plus,
  ShieldCheck,
  SprayCan,
  Sprout,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import {
  generateSprayPlanSteps,
  normalizeSprayDisease,
  SPRAY_DISEASE_OPTIONS,
  type ClimateForecastDay,
  type SprayPreference,
} from "@/lib/ai-engine";
import type { SprayPlan } from "@/lib/types";
import { Card, CardHeader } from "@/components/dashboard/ui";
import { fallbackForecast } from "@/components/climate/shared";

/* ------------------------------------------------------------------ */
/* Date helpers (deterministic, locale-free — no hydration mismatch)    */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

function fmtDay(iso: string): string {
  const d = parseDay(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function addDaysISO(iso: string, n: number): string {
  const d = parseDay(iso);
  d.setDate(d.getDate() + n);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Due date of a step = start date + (day - 1). */
function stepDueISO(plan: SprayPlan, day: number): string {
  return addDaysISO(plan.startDate, day - 1);
}

function diffDays(aISO: string, bISO: string): number {
  const ms = parseDay(aISO).getTime() - parseDay(bISO).getTime();
  return Math.round(ms / (24 * 3600 * 1000));
}

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

/* ------------------------------------------------------------------ */
/* Weather-aware banner                                                */
/* ------------------------------------------------------------------ */

function RainBanner() {
  const location = useFarmStore((s) => s.settings.location);
  const rainNowMm = useFarmStore((s) => s.snapshot.rainMm);
  const [tomorrow, setTomorrow] = useState<ClimateForecastDay | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const lat = location?.latitude ?? 23.02;
    const lon = location?.longitude ?? 72.57;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
      `&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max` +
      `&timezone=Asia%2FKolkata&forecast_days=3`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const daily = json?.daily;
        if (!daily?.time?.[1]) throw new Error("empty");
        setTomorrow({
          date: daily.time[1],
          tMax: 0,
          tMin: 0,
          rainMm: Number(daily.precipitation_sum?.[1] ?? 0),
          rainProb: Number(daily.precipitation_probability_max?.[1] ?? 0),
          code: 61,
        });
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        // Offline-safe: simulation-derived outlook, same as /climate.
        const fb = fallbackForecast(useFarmStore.getState().snapshot, 3);
        setTomorrow(fb[1] ?? null);
      });
    return () => ctrl.abort();
  }, [location?.latitude, location?.longitude]);

  if (rainNowMm >= 0.3) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-sky-400/40 bg-sky-500/[0.08] p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
          <CloudRain className="h-4 w-4" />
        </span>
        <p className="text-sm leading-relaxed text-sky-100">
          🌧️ Raining now ({rainNowMm.toFixed(1)} mm) — postpone spray to avoid
          wash-off. Resume in the next dry evening window.
        </p>
      </div>
    );
  }

  if (tomorrow && (tomorrow.rainMm > 1 || tomorrow.rainProb > 50)) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/[0.08] p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
          <TriangleAlert className="h-4 w-4" />
        </span>
        <p className="text-sm leading-relaxed text-amber-100">
          ⚠️ Rain expected tomorrow ({tomorrow.rainMm.toFixed(1)} mm,{" "}
          {Math.round(tomorrow.rainProb)}% chance) — postpone spray to avoid
          wash-off.
        </p>
      </div>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Plan card with vertical timeline                                    */
/* ------------------------------------------------------------------ */

function PlanCard({ plan }: { plan: SprayPlan }) {
  const updateSprayStep = useFarmStore((s) => s.updateSprayStep);
  const scans = useFarmStore((s) => s.scans);
  const resolveScan = useFarmStore((s) => s.resolveScan);
  const addDiary = useFarmStore((s) => s.addDiary);

  const doneCount = plan.steps.filter((s) => s.done).length;
  const total = plan.steps.length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const completed = plan.status === "completed";
  const today = todayISO();

  const linkedScan = completed
    ? scans.find(
        (s) =>
          !s.resolved &&
          normalizeSprayDisease(s.disease) === normalizeSprayDisease(plan.disease),
      )
    : undefined;

  const toggle = (day: number, currentlyDone: boolean) => {
    updateSprayStep(plan.id, day, !currentlyDone);
    if (!currentlyDone) {
      const remaining = total - (doneCount + 1);
      if (remaining === 0) {
        addDiary({
          type: "spray",
          details: `Completed spray plan for ${plan.disease} in Zone ${plan.zone} — all ${total} steps done (${plan.startDate} → ${today}).`,
          zone: plan.zone,
        });
        toast.success("Spray plan completed", {
          description: `${plan.disease} (Zone ${plan.zone}) — logged to Farm Diary.`,
        });
      }
    }
  };

  const handleResolve = () => {
    if (!linkedScan) return;
    resolveScan(linkedScan.id);
    addDiary({
      type: "spray",
      details: `Linked disease scan "${linkedScan.disease}" marked resolved after completing the ${plan.disease} spray plan (Zone ${plan.zone}).`,
      zone: plan.zone,
      scanId: linkedScan.id,
    });
    toast.success("Linked disease scan resolved", {
      description: `${linkedScan.disease} — crop is healthy again.`,
    });
  };

  return (
    <Card className={cn(completed && "opacity-90")}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            <Bug className="h-3 w-3 text-emerald-300" /> Zone {plan.zone} · started{" "}
            {fmtDay(plan.startDate)}
          </p>
          <h3 className="mt-1 truncate text-lg font-extrabold text-white">
            {plan.disease}
          </h3>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            completed
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
              : "border-sky-400/40 bg-sky-500/10 text-sky-300",
          )}
        >
          {completed ? "completed" : "active"}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-400">
            {doneCount}/{total} steps
          </span>
          <span className="font-mono font-extrabold text-emerald-300">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.6)]"
          />
        </div>
      </div>

      {/* Timeline */}
      <ol className="mt-4 space-y-0">
        {plan.steps.map((step, i) => {
          const due = stepDueISO(plan, step.day);
          const late = diffDays(today, due);
          const overdue = !step.done && !completed && late > 0;
          const dueToday = !step.done && !completed && late === 0;
          const last = i === plan.steps.length - 1;
          return (
            <li key={step.day} className="relative flex gap-3 pb-4 last:pb-0">
              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[17px] top-10 h-[calc(100%-2.25rem)] w-0.5 rounded",
                    step.done ? "bg-emerald-500/50" : "bg-white/10",
                  )}
                />
              )}
              <span
                className={cn(
                  "z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-extrabold",
                  step.done
                    ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                    : overdue
                      ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                      : "border-white/15 bg-black/50 text-zinc-300",
                )}
              >
                {step.done ? <Check className="h-4 w-4" /> : `D${step.day}`}
              </span>
              <div
                className={cn(
                  "min-w-0 flex-1 rounded-xl border p-3",
                  overdue
                    ? "border-amber-400/40 bg-amber-500/[0.07]"
                    : "border-white/5 bg-black/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-[13px] leading-relaxed",
                      step.done ? "text-zinc-500 line-through" : "text-zinc-100",
                    )}
                  >
                    {step.action}
                  </p>
                  {!completed && (
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={step.done}
                      aria-label={`Mark Day ${step.day} ${step.done ? "not done" : "done"}`}
                      onClick={() => toggle(step.day, step.done)}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all active:scale-90",
                        step.done
                          ? "border-emerald-400/70 bg-emerald-500 text-black shadow-[0_0_12px_rgba(34,197,94,0.5)]"
                          : "border-white/20 bg-white/[0.04] hover:border-emerald-500/60",
                      )}
                    >
                      {step.done && <Check className="h-4 w-4" strokeWidth={3} />}
                    </button>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-1 text-[11px] font-semibold",
                    overdue
                      ? "text-amber-300"
                      : dueToday
                        ? "text-sky-300"
                        : "text-zinc-500",
                  )}
                >
                  {step.done ? (
                    <>✓ Done · due {fmtDay(due)}</>
                  ) : late === 0 ? (
                    <>Due today · {fmtDay(due)}</>
                  ) : late < 0 ? (
                    <>
                      Due in {Math.abs(late)} day{Math.abs(late) > 1 ? "s" : ""} ·{" "}
                      {fmtDay(due)}
                    </>
                  ) : late === 1 ? (
                    <>Day {step.day} check was due yesterday</>
                  ) : (
                    <>
                      Day {step.day} check was due {late} days ago
                    </>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Resolve linked scan */}
      {linkedScan && (
        <button
          type="button"
          onClick={handleResolve}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-xs font-extrabold text-emerald-200 transition-all hover:bg-emerald-500/20 active:scale-[0.98]"
        >
          <Check className="h-4 w-4" /> Resolve linked scan: {linkedScan.disease}
        </button>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* New Plan wizard modal                                               */
/* ------------------------------------------------------------------ */

function NewPlanWizard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const scans = useFarmStore((s) => s.scans);
  const zones = useFarmStore((s) => s.zones);
  const addSprayPlan = useFarmStore((s) => s.addSprayPlan);
  const addDiary = useFarmStore((s) => s.addDiary);

  const scanDiseases = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of scans) {
      const key = s.disease.toLowerCase();
      if (!seen.has(key)) seen.set(key, s.disease);
    }
    return [...seen.values()];
  }, [scans]);

  const [diseaseDraft, setDiseaseDraft] = useState<string>("");
  const [zone, setZone] = useState<string>("C");
  const [preference, setPreference] = useState<SprayPreference>("natural");

  // Draft disease falls back to the latest scan (or the manual list) until
  // the user picks explicitly; reset on close (event handler, not effect).
  const disease = diseaseDraft || scanDiseases[0] || SPRAY_DISEASE_OPTIONS[0];

  const close = () => {
    setDiseaseDraft("");
    setZone("C");
    setPreference("natural");
    onClose();
  };

  const preview = useMemo(
    () => (disease ? generateSprayPlanSteps(disease, preference) : []),
    [disease, preference],
  );

  const create = () => {
    if (!disease) return;
    addSprayPlan({
      disease,
      zone,
      startDate: todayISO(),
      steps: preview.map((s) => ({ ...s, done: false })),
    });
    addDiary({
      type: "spray",
      details: `Started ${preference === "natural" ? "natural-first" : "chemical"} spray plan for ${disease} in Zone ${zone} — ${preview.length} steps from Day 1.`,
      zone,
    });
    toast.success("Spray plan created", {
      description: `${disease} in Zone ${zone} — Day 1 starts today.`,
    });
    close();
  };

  const selectCls =
    "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-colors focus:border-emerald-500/50 [&>option]:bg-[#0a120c]";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="card-surface pointer-events-auto max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-extrabold text-white">
                    <SprayCan className="h-5 w-5 text-emerald-300" /> New Spray Plan
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Pick disease, zone and approach — the day-by-day plan builds itself.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close dialog"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Disease
                  </span>
                  <select
                    value={disease}
                    onChange={(e) => setDiseaseDraft(e.target.value)}
                    className={selectCls}
                  >
                    {scanDiseases.length > 0 && (
                      <optgroup label="From past scans">
                        {scanDiseases.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Manual list">
                      {SPRAY_DISEASE_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Zone
                  </span>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className={selectCls}
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        Zone {z.id} — {z.crop}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Treatment preference
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed={preference === "natural"}
                      onClick={() => setPreference("natural")}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-3 text-left transition-all active:scale-[0.98]",
                        preference === "natural"
                          ? "border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                          : "border-white/10 bg-black/30 hover:border-emerald-500/30",
                      )}
                    >
                      <Sprout className="h-5 w-5 shrink-0 text-emerald-300" />
                      <span>
                        <span className="block text-xs font-extrabold text-white">
                          Natural First
                        </span>
                        <span className="block text-[11px] text-zinc-500">
                          neem · traps · culture
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={preference === "chemical"}
                      onClick={() => setPreference("chemical")}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-3 text-left transition-all active:scale-[0.98]",
                        preference === "chemical"
                          ? "border-amber-400/60 bg-amber-500/10 shadow-[0_0_16px_rgba(245,158,11,0.3)]"
                          : "border-white/10 bg-black/30 hover:border-amber-500/30",
                      )}
                    >
                      <FlaskConical className="h-5 w-5 shrink-0 text-amber-300" />
                      <span>
                        <span className="block text-xs font-extrabold text-white">
                          Chemical
                        </span>
                        <span className="block text-[11px] text-zinc-500">
                          targeted molecule
                        </span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Auto-generated preview */}
                {preview.length > 0 && (
                  <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Auto-generated plan · {preview.length} steps
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {preview.map((s) => (
                        <li key={s.day} className="flex gap-2 text-xs leading-relaxed text-zinc-200">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 font-mono font-bold text-emerald-300">
                            {s.day}
                          </span>
                          {s.action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={create}
                  disabled={!disease || preview.length === 0}
                  className={cn(
                    "w-full rounded-xl px-4 py-3 text-sm font-extrabold transition-all active:scale-[0.98]",
                    disease && preview.length > 0
                      ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:bg-emerald-400"
                      : "cursor-not-allowed border border-white/10 text-zinc-600",
                  )}
                >
                  Create Plan — Day 1 starts today
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const SAFETY_NOTES = [
  "Spray in the evening (after 5 PM) — better leaf absorption, safe for bees.",
  "Wear mask, gloves and full sleeves during every spray.",
  "No spray before rain — check tomorrow's forecast to avoid wash-off.",
  "Keep a waiting period before harvest (7–10 days for chemical sprays).",
  "Keep children and animals away from the sprayed plot for 24 hours.",
  "Wash the sprayer and your hands with soap after every application.",
];

export default function SprayPage() {
  const t = useT();
  const sprayPlans = useFarmStore((s) => s.sprayPlans);
  const [wizardOpen, setWizardOpen] = useState(false);

  const active = sprayPlans.filter((p) => p.status === "active");
  const history = sprayPlans.filter((p) => p.status !== "active");

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      <Rise>
        <RainBanner />
      </Rise>

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-bold">
            <CalendarDays className="h-3 w-3" /> {active.length} active
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-bold">
            <MapPin className="h-3 w-3" /> {sprayPlans.length} total
          </span>
        </div>
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={3} /> New Plan
        </button>
      </div>

      {/* Active plans */}
      {active.length === 0 ? (
        <Rise delay={0.05}>
          <Card>
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                <SprayCan className="h-6 w-6" />
              </span>
              <h3 className="mt-3 text-base font-extrabold text-white">
                No active spray plans
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
                {t("titles.spray")} is clear. Create a plan from a past leaf scan or
                the manual disease list.
              </p>
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-black transition-all hover:bg-emerald-400 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" strokeWidth={3} /> New Plan
              </button>
            </div>
          </Card>
        </Rise>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
          {active.map((plan, i) => (
            <Rise key={plan.id} delay={0.05 + i * 0.04}>
              <PlanCard plan={plan} />
            </Rise>
          ))}
        </div>
      )}

      {/* History + safety */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        <Rise delay={0.1}>
          <Card className="h-full">
            <CardHeader
              title="Spray Log History"
              subtitle={`${history.length} completed ${history.length === 1 ? "plan" : "plans"}`}
              action={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                  <History className="h-4 w-4" />
                </span>
              }
            />
            {history.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs leading-relaxed text-zinc-500">
                No completed plans yet — finished plans land here as your spray log.
              </p>
            ) : (
              <ul className="space-y-2">
                {history.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-white">
                        {p.disease} · Zone {p.zone}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {fmtDay(p.startDate)} → {p.steps.length} steps · all done
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Rise>

        <Rise delay={0.14}>
          <Card className="h-full border-amber-500/25">
            <CardHeader
              title="Safety Notes"
              subtitle="Read before every spray"
              action={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              }
            />
            <ul className="space-y-2">
              {SAFETY_NOTES.map((note) => (
                <li
                  key={note}
                  className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-xs leading-relaxed text-amber-50/90"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {note}
                </li>
              ))}
            </ul>
          </Card>
        </Rise>
      </div>

      <NewPlanWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
