"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronDown,
  FlaskConical,
  History,
  RotateCcw,
  ScanLine,
  SprayCan,
  Sprout,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { uid } from "@/lib/simulation-engine";
import {
  analyzeLeaf,
  type LeafAnalysisResult,
  type LeafSampleId,
} from "@/lib/ai-engine";
import type { DiseaseScan } from "@/lib/types";
import { StatusPill, useMounted } from "@/components/dashboard/ui";
import { LEAF_SAMPLES, sampleMeta } from "./LeafSamples";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const SCAN_MS = 2500;

export function diseaseDot(disease: string): string {
  const d = disease.toLowerCase();
  if (d.includes("healthy")) return "#22c55e";
  if (d.includes("spot")) return "#a16207";
  if (d.includes("rust")) return "#ea580c";
  if (d.includes("nutrient") || d.includes("water stress")) return "#eab308";
  if (d.includes("aphid") || d.includes("pest")) return "#a855f7";
  return "#38bdf8";
}

function severityTone(
  severity: string,
): "good" | "warn" | "bad" | "info" {
  if (severity === "none") return "good";
  if (severity === "mild") return "info";
  if (severity === "medium") return "warn";
  return "bad";
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatScanDate(ts: number): string {
  const d = new Date(ts);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const hh = d.getHours();
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const ap = hh < 12 ? "AM" : "PM";
  return `${d.getDate()} ${months[d.getMonth()]} · ${h12}:${String(d.getMinutes()).padStart(2, "0")} ${ap}`;
}

interface DisplayResult {
  key: string;
  disease: string;
  confidence: number;
  severity: DiseaseScan["severity"];
  affectedPercent: number;
  severityGrid: number[][];
  treatmentNatural: string[];
  treatmentChemical: string[];
  imageName: string;
  storedId: string | null;
}

function HeatCell({ v, delay }: { v: number; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.25 }}
      className={cn(
        "aspect-square rounded-[4px]",
        v === 2 && "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]",
        v === 1 && "bg-amber-400/90",
        v === 0 && "bg-emerald-500/70",
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* LeafScanner                                                          */
/* ------------------------------------------------------------------ */

export default function LeafScanner() {
  const mounted = useMounted();
  const scans = useFarmStore((s) => s.scans);
  const addScan = useFarmStore((s) => s.addScan);
  const addDiary = useFarmStore((s) => s.addDiary);
  const addSprayPlan = useFarmStore((s) => s.addSprayPlan);

  const [source, setSource] = useState<"sample" | "upload">("sample");
  const [sampleId, setSampleId] = useState<LeafSampleId>("healthy");
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("Uploaded leaf photo");
  const uploadCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [scanning, setScanning] = useState(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fresh, setFresh] = useState<DisplayResult | null>(null);
  const [openScanId, setOpenScanId] = useState<string | null>(null);
  const [chemOpen, setChemOpen] = useState(false);

  useEffect(
    () => () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    },
    [],
  );

  const activeSample = sampleMeta(sampleId);

  const pickSample = (id: LeafSampleId) => {
    if (scanning) return;
    setSource("sample");
    setSampleId(id);
    setFresh(null);
    setOpenScanId(null);
    setChemOpen(false);
  };

  /* Real photo in: FileReader → data URL → Image → analysis canvas. */
  const handleFile = (file: File | undefined) => {
    if (!file || scanning) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file", {
        description: "JPG or PNG leaf photos work best.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const max = 480;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          toast.error("Could not process that photo");
          return;
        }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        uploadCanvasRef.current = c;
        setUploadUrl(url);
        setFileName(file.name);
        setSource("upload");
        setFresh(null);
        setOpenScanId(null);
        setChemOpen(false);
        toast.success("Photo loaded — press SCAN", {
          description: "Real pixel analysis will run on your leaf.",
        });
      };
      img.onerror = () => toast.error("Could not read that image");
      img.src = url;
    };
    reader.onerror = () => toast.error("Could not read that file");
    reader.readAsDataURL(file);
  };

  const handleScan = () => {
    if (scanning) return;
    if (source === "upload" && !uploadCanvasRef.current) {
      toast.error("Upload a leaf photo first");
      return;
    }
    setScanning(true);
    setFresh(null);
    setOpenScanId(null);
    setChemOpen(false);
    /* Pre-mint the scan id so the heatmap is deterministic from the id. */
    const seed = uid("scan");
    scanTimerRef.current = setTimeout(() => {
      try {
        const analysis: LeafAnalysisResult =
          source === "upload"
            ? analyzeLeaf({ canvas: uploadCanvasRef.current, seed })
            : analyzeLeaf({ sampleId, seed });
        const imageName =
          source === "upload" ? fileName : `${activeSample.name} sample`;
        const storedId = addScan({
          id: seed,
          source,
          imageName,
          disease: analysis.disease,
          confidence: analysis.confidence,
          severity: analysis.severity,
          affectedPercent: analysis.affectedPercent,
          severityGrid: analysis.severityGrid,
          treatmentNatural: analysis.treatmentNatural,
          treatmentChemical: analysis.treatmentChemical,
          resolved: false,
        });
        setFresh({ ...analysis, key: seed, imageName, storedId });
        toast.success(`Scan complete — ${analysis.disease}`, {
          description: `${Math.round(analysis.confidence * 100)}% confidence · ${analysis.severity} severity.`,
        });
      } catch {
        toast.error("Scan failed — try again");
      } finally {
        setScanning(false);
      }
    }, SCAN_MS);
  };

  const opened: DiseaseScan | undefined = openScanId
    ? scans.find((s) => s.id === openScanId)
    : undefined;

  const display: DisplayResult | null = opened
    ? {
        key: opened.id,
        disease: opened.disease,
        confidence: opened.confidence,
        severity: opened.severity,
        affectedPercent: opened.affectedPercent,
        severityGrid: opened.severityGrid,
        treatmentNatural: opened.treatmentNatural,
        treatmentChemical: opened.treatmentChemical,
        imageName: opened.imageName,
        storedId: opened.id,
      }
    : fresh;

  const handleSaveDiary = () => {
    if (!display) return;
    addDiary({
      type: "disease",
      details:
        `Leaf scan — ${display.disease} (${display.severity}, ` +
        `${display.affectedPercent}% affected, ${Math.round(display.confidence * 100)}% confidence) ` +
        `on "${display.imageName}". Natural plan: ${display.treatmentNatural[0] ?? "neem-oil schedule"}.`,
      zone: "C",
      ...(display.storedId ? { scanId: display.storedId } : {}),
    });
    toast.success("Saved to Farm Diary", {
      description: "Scan summary filed under disease notes.",
    });
  };

  const handleSprayPlan = () => {
    if (!display) return;
    addSprayPlan({
      disease: display.disease,
      zone: "C",
      startDate: todayISO(),
      steps: [
        {
          day: 1,
          action: `Neem oil 5 ml/L evening spray for ${display.disease} — coat both leaf sides`,
          done: false,
        },
        {
          day: 3,
          action: `Inspect leaves — compare spread with scan (${display.affectedPercent}% affected)`,
          done: false,
        },
        { day: 5, action: "Repeat neem-oil spray in the cool evening hours", done: false },
        {
          day: 7,
          action: `Review spread — escalate to chemical (${display.treatmentChemical[0] ?? "officer advice"}) only if worse`,
          done: false,
        },
        {
          day: 10,
          action: "Final check — close the plan if new leaves look clean",
          done: false,
        },
      ],
    });
    toast.success("7-day spray plan created", {
      description: "Day 1 neem today — track it in the Spray Planner.",
    });
  };

  const handleNewScan = () => {
    if (scanning) return;
    setFresh(null);
    setOpenScanId(null);
    setChemOpen(false);
  };

  const PreviewArt =
    source === "upload" && uploadUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={uploadUrl} alt="Uploaded leaf" className="h-full w-full object-cover" />
    ) : (
      <activeSample.Component />
    );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
      {/* ============ LEFT: gallery + scanner + result ============ */}
      <div className="min-w-0 space-y-4">
        {/* Sample gallery */}
        <div className="card-surface rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">Sample gallery</h3>
            <span className="text-[11px] text-zinc-500">pick one, or upload below</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {LEAF_SAMPLES.map(({ id, name, hint, Component }) => {
              const active = source === "sample" && sampleId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => pickSample(id)}
                  aria-pressed={active}
                  className={cn(
                    "group overflow-hidden rounded-xl border text-left transition-all active:scale-[0.97]",
                    active
                      ? "border-emerald-400/70 shadow-[0_0_18px_rgba(34,197,94,0.4)]"
                      : "border-white/10 hover:border-emerald-500/40",
                  )}
                >
                  <span className="block aspect-square">
                    <Component />
                  </span>
                  <span
                    className={cn(
                      "block px-2 py-1.5",
                      active ? "bg-emerald-500/15" : "bg-black/40",
                    )}
                  >
                    <span className="block truncate text-[11px] font-bold text-white">
                      {name}
                    </span>
                    <span className="block truncate text-[10px] text-zinc-500">
                      {hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Upload */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm font-bold text-zinc-200 transition-all hover:border-emerald-500/50 hover:text-emerald-200 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {source === "upload" && uploadUrl
              ? `Photo ready: ${fileName}`
              : "Upload a real leaf photo"}
          </button>
        </div>

        {/* Preview + SCAN */}
        <div className="card-surface rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">
              {source === "upload" ? "Your photo" : activeSample.name}
            </h3>
            <StatusPill tone={source === "upload" ? "info" : "good"}>
              {source === "upload" ? "real pixels" : "simulated"}
            </StatusPill>
          </div>
          <div className="relative mx-auto mt-3 aspect-square w-full max-w-72 overflow-hidden rounded-2xl border border-white/10">
            {PreviewArt}
            {/* laser sweep */}
            <AnimatePresence>
              {scanning && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="absolute inset-0 bg-emerald-500/10" />
                  <motion.div
                    className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-emerald-400/80 to-transparent shadow-[0_0_24px_rgba(34,197,94,0.9)]"
                    initial={{ top: "-15%" }}
                    animate={{ top: ["-15%", "105%", "-15%"] }}
                    transition={{ duration: SCAN_MS / 1000, ease: "easeInOut" }}
                  />
                  <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-emerald-300/70" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {scanning ? (
            <p className="mt-3 animate-pulse text-center text-sm font-bold text-emerald-300">
              Analyzing… Running vision model…
            </p>
          ) : (
            <button
              type="button"
              onClick={handleScan}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
            >
              <ScanLine className="h-4 w-4" /> SCAN LEAF
            </button>
          )}
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {display && (
            <motion.div
              key={display.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="card-surface space-y-4 rounded-2xl border-emerald-500/25 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                    Diagnosis · {display.imageName}
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold text-white">
                    {display.disease}
                  </h3>
                </div>
                <StatusPill tone={severityTone(display.severity)}>
                  {display.severity === "none" ? "healthy" : display.severity}
                </StatusPill>
              </div>

              {/* confidence */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-400">Confidence</span>
                  <span className="font-mono font-extrabold text-emerald-300">
                    {Math.round(display.confidence * 100)}%
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(display.confidence * 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.6)]"
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  {display.affectedPercent}% leaf area affected
                </p>
              </div>

              {/* severity heatmap */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                  Severity heatmap · 8×6
                </p>
                <div className="mt-2 grid grid-cols-8 gap-1">
                  {display.severityGrid.flatMap((row, r) =>
                    row.map((v, c) => (
                      <HeatCell key={`${r}-${c}`} v={v} delay={(r * 8 + c) * 0.018} />
                    )),
                  )}
                </div>
                <div className="mt-1.5 flex gap-3 text-[10px] text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-emerald-500/70" /> healthy
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-amber-400/90" /> watch
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-red-500" /> affected
                  </span>
                </div>
              </div>

              {/* natural treatment */}
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  <Sprout className="h-4 w-4" /> Natural treatment · first choice
                </p>
                <ul className="mt-2 space-y-1.5">
                  {display.treatmentNatural.map((t) => (
                    <li key={t} className="flex gap-2 text-sm leading-relaxed text-emerald-50/90">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* chemical accordion */}
              <div className="overflow-hidden rounded-2xl border border-amber-500/25">
                <button
                  type="button"
                  onClick={() => setChemOpen((v) => !v)}
                  aria-expanded={chemOpen}
                  className="flex w-full items-center gap-2 bg-amber-500/[0.07] px-4 py-3 text-left text-sm font-extrabold text-amber-200 transition-colors hover:bg-amber-500/[0.12]"
                >
                  <FlaskConical className="h-4 w-4 shrink-0" />
                  <span className="flex-1">If severity increases — chemical options</span>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", chemOpen && "rotate-180")}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {chemOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="space-y-3 bg-black/30 p-4">
                        <ul className="space-y-1.5">
                          {display.treatmentChemical.map((t) => (
                            <li key={t} className="flex gap-2 text-sm leading-relaxed text-zinc-200">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                              {t}
                            </li>
                          ))}
                        </ul>
                        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs font-bold leading-relaxed text-red-200">
                          Consult agricultural officer before chemical use.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* actions */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleSaveDiary}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-xs font-extrabold text-emerald-200 transition-all hover:bg-emerald-500/20 active:scale-[0.98]"
                >
                  <BookOpen className="h-4 w-4" /> Save to Farm Diary
                </button>
                <button
                  type="button"
                  onClick={handleSprayPlan}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2.5 text-xs font-extrabold text-sky-200 transition-all hover:bg-sky-500/20 active:scale-[0.98]"
                >
                  <SprayCan className="h-4 w-4" /> Create Spray Plan
                </button>
                <button
                  type="button"
                  onClick={handleNewScan}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-extrabold text-zinc-200 transition-all hover:border-white/25 active:scale-[0.98]"
                >
                  <RotateCcw className="h-4 w-4" /> New Scan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============ RIGHT: scan history ============ */}
      <aside className="card-surface h-fit rounded-2xl p-4 sm:p-5 lg:sticky lg:top-20">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
          <History className="h-4 w-4 text-emerald-300" /> Scan history
          <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
            {scans.length}
          </span>
        </h3>
        {scans.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-white/10 p-4 text-center text-xs leading-relaxed text-zinc-500">
            No scans yet. Run your first leaf scan — it will be saved here.
          </p>
        ) : (
          <ul className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-0.5">
            {scans.map((s) => {
              const active = display?.storedId === s.id || display?.key === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenScanId(s.id);
                      setFresh(null);
                      setChemOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all active:scale-[0.98]",
                      active
                        ? "border-emerald-400/60 bg-emerald-500/10"
                        : "border-white/5 bg-black/30 hover:border-emerald-500/30",
                    )}
                  >
                    <span
                      className="h-8 w-8 shrink-0 rounded-full border border-white/10"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, ${diseaseDot(s.disease)}, #0b120d 75%)`,
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-white">
                        {s.disease}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-zinc-500">
                        {Math.round(s.confidence * 100)}% ·{" "}
                        {mounted ? formatScanDate(s.timestamp) : "--"}
                      </span>
                    </span>
                    <StatusPill tone={severityTone(s.severity)}>
                      {s.severity === "none" ? "ok" : s.severity}
                    </StatusPill>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}
