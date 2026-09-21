"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  BookOpen,
  Bug,
  CalendarDays,
  Droplets,
  FlaskConical,
  ImagePlus,
  MapPin,
  Plus,
  Search,
  ShoppingBasket,
  SprayCan,
  StickyNote,
  X,
  type LucideIcon,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import type { DiaryEntry, DiseaseScan } from "@/lib/types";
import { Card, CardHeader } from "@/components/dashboard/ui";

type DiaryType = DiaryEntry["type"];

const DIARY_TYPES: DiaryType[] = [
  "irrigation",
  "disease",
  "fertilizer",
  "spray",
  "harvest",
  "general",
];

const TYPE_META: Record<
  DiaryType,
  { label: string; icon: LucideIcon; hex: string; chip: string; dot: string }
> = {
  irrigation: {
    label: "Irrigation",
    icon: Droplets,
    hex: "#38bdf8",
    chip: "border-sky-400/40 bg-sky-500/10 text-sky-300",
    dot: "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]",
  },
  disease: {
    label: "Disease",
    icon: Bug,
    hex: "#ef4444",
    chip: "border-red-400/40 bg-red-500/10 text-red-300",
    dot: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]",
  },
  fertilizer: {
    label: "Fertilizer",
    icon: FlaskConical,
    hex: "#22c55e",
    chip: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.8)]",
  },
  spray: {
    label: "Spray",
    icon: SprayCan,
    hex: "#a855f7",
    chip: "border-purple-400/40 bg-purple-500/10 text-purple-300",
    dot: "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]",
  },
  harvest: {
    label: "Harvest",
    icon: ShoppingBasket,
    hex: "#f59e0b",
    chip: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]",
  },
  general: {
    label: "General",
    icon: StickyNote,
    hex: "#a1a1aa",
    chip: "border-white/15 bg-white/[0.04] text-zinc-300",
    dot: "bg-zinc-400 shadow-[0_0_10px_rgba(161,161,170,0.6)]",
  },
};

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

function severityChip(severity: DiseaseScan["severity"]): string {
  if (severity === "severe") return "border-red-400/50 bg-red-500/15 text-red-200";
  if (severity === "medium") return "border-amber-400/50 bg-amber-500/15 text-amber-200";
  if (severity === "mild") return "border-sky-400/50 bg-sky-500/15 text-sky-200";
  return "border-emerald-400/50 bg-emerald-500/15 text-emerald-200";
}

/** Downscale large photos so base64 stays small in localStorage. */
function downscaleImage(dataUrl: string, maxDim = 640): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        if (scale >= 1) {
          resolve(dataUrl);
          return;
        }
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        const ctx = c.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

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

/* ------------------------------------------------------------------ */
/* Scan result modal                                                   */
/* ------------------------------------------------------------------ */

function ScanModal({ scan, onClose }: { scan: DiseaseScan | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {scan && (
        <>
          <motion.button
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="card-surface pointer-events-auto max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                    Scan result · {scan.imageName}
                  </p>
                  <h3 className="mt-1 text-lg font-extrabold text-white">{scan.disease}</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    severityChip(scan.severity),
                  )}
                >
                  {scan.severity === "none" ? "healthy" : scan.severity}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                  {Math.round(scan.confidence * 100)}% confidence
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                  {scan.affectedPercent}% affected
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    Natural treatment
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {scan.treatmentNatural.map((t) => (
                      <li key={t} className="flex gap-2 text-xs leading-relaxed text-emerald-50/90">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Chemical options
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {scan.treatmentChemical.map((t) => (
                      <li key={t} className="flex gap-2 text-xs leading-relaxed text-zinc-200">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Add-entry modal                                                     */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-colors placeholder:font-normal placeholder:text-zinc-600 focus:border-emerald-500/50 [&>option]:bg-[#0a120c]";

const labelCls = "mb-1 block text-[11px] font-bold uppercase tracking-wider text-zinc-500";

function AddEntryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addDiary = useFarmStore((s) => s.addDiary);
  const zones = useFarmStore((s) => s.zones);
  const fileRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<DiaryType>("general");
  const [date, setDate] = useState<string>(todayISO());
  const [zone, setZone] = useState<string>("none");
  const [details, setDetails] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const close = () => {
    setType("general");
    setDate(todayISO());
    setZone("none");
    setDetails("");
    setPhoto(null);
    onClose();
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file", { description: "JPG or PNG photos work best." });
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Photo too large", { description: "Please pick a photo under 6 MB." });
      return;
    }
    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const small = await downscaleImage(reader.result as string);
      setPhoto(small);
      setPhotoLoading(false);
    };
    reader.onerror = () => {
      setPhotoLoading(false);
      toast.error("Could not read that photo");
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (details.trim().length === 0) {
      toast.error("Details required", { description: "Write a line about what happened." });
      return;
    }
    addDiary({
      type,
      date: date || todayISO(),
      details: details.trim(),
      ...(zone !== "none" ? { zone } : {}),
      ...(photo ? { photo } : {}),
    });
    toast.success("Diary entry added", { description: `${TYPE_META[type].label} note filed.` });
    close();
  };

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
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
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
                    <BookOpen className="h-5 w-5 text-emerald-300" /> Add Diary Entry
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Pump runs and leaf scans are logged automatically — this is for everything else.
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelCls}>Type</span>
                    <select value={type} onChange={(e) => setType(e.target.value as DiaryType)} className={inputCls}>
                      {DIARY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {TYPE_META[t].label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelCls}>Date</span>
                    <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className={inputCls} />
                  </label>
                </div>

                <label className="block">
                  <span className={labelCls}>Zone (optional)</span>
                  <select value={zone} onChange={(e) => setZone(e.target.value)} className={inputCls}>
                    <option value="none">Whole farm</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        Zone {z.id} — {z.crop}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelCls}>Details</span>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    placeholder="e.g. Irrigated Zone A for 15 min in the evening, soil looks moist…"
                    className={cn(inputCls, "resize-y leading-relaxed")}
                  />
                </label>

                <div>
                  <span className={labelCls}>Photo (optional)</span>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                  {photo ? (
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt="Entry attachment" className="h-16 w-16 shrink-0 rounded-lg border border-white/10 object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white">Photo attached</p>
                        <p className="text-[11px] text-zinc-500">Stored with this entry.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPhoto(null)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-red-300"
                        aria-label="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={photoLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm font-bold text-zinc-200 transition-all hover:border-emerald-500/50 hover:text-emerald-200 disabled:opacity-50"
                    >
                      <ImagePlus className="h-4 w-4" />
                      {photoLoading ? "Processing photo…" : "Upload a photo"}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={submit}
                  className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
                >
                  Save Entry
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

export default function DiaryPage() {
  const diary = useFarmStore((s) => s.diary);
  const scans = useFarmStore((s) => s.scans);

  const [modalOpen, setModalOpen] = useState(false);
  const [openScanId, setOpenScanId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<"all" | DiaryType>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [query, setQuery] = useState("");

  const thisMonthPrefix = todayISO().slice(0, 7);
  const thisMonthCount = useMemo(
    () => diary.filter((d) => d.date.slice(0, 7) === thisMonthPrefix).length,
    [diary, thisMonthPrefix],
  );

  const typeCounts = useMemo(() => {
    const counts = Object.fromEntries(DIARY_TYPES.map((t) => [t, 0])) as Record<DiaryType, number>;
    for (const d of diary) counts[d.type] = (counts[d.type] ?? 0) + 1;
    return counts;
  }, [diary]);

  const donutData = useMemo(
    () =>
      DIARY_TYPES.filter((t) => typeCounts[t] > 0).map((t) => ({
        name: TYPE_META[t].label,
        value: typeCounts[t],
        hex: TYPE_META[t].hex,
      })),
    [typeCounts],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...diary]
      .filter((d) => (typeFilter === "all" ? true : d.type === typeFilter))
      .filter((d) => (zoneFilter === "all" ? true : (d.zone ?? "") === zoneFilter))
      .filter((d) => (fromDate ? d.date >= fromDate : true))
      .filter((d) => (toDate ? d.date <= toDate : true))
      .filter((d) => (q ? d.details.toLowerCase().includes(q) : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [diary, typeFilter, zoneFilter, fromDate, toDate, query]);

  const filtersActive =
    typeFilter !== "all" || zoneFilter !== "all" || fromDate !== "" || toDate !== "" || query.trim() !== "";

  const clearFilters = () => {
    setTypeFilter("all");
    setZoneFilter("all");
    setFromDate("");
    setToDate("");
    setQuery("");
  };

  const openScan = scans.find((s) => s.id === openScanId) ?? null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* Stats header */}
      <Rise>
        <Card>
          <CardHeader
            title="Farm Diary"
            subtitle={`${diary.length} total entries · ${thisMonthCount} this month`}
            action={
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" strokeWidth={3} /> Add Entry
              </button>
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/5 bg-black/40 p-4 text-center">
                <p className="text-3xl font-extrabold tabular-nums text-white">{diary.length}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Total entries</p>
              </div>
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4 text-center">
                <p className="text-3xl font-extrabold tabular-nums text-emerald-300">{thisMonthCount}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">This month</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/40 p-3">
              {donutData.length === 0 ? (
                <p className="px-4 py-6 text-xs text-zinc-500">No entries yet.</p>
              ) : (
                <>
                  <div className="h-32 w-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={54} paddingAngle={3} stroke="none">
                          {donutData.map((d) => (
                            <Cell key={d.name} fill={d.hex} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#0a120c", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 12, fontSize: 12 }}
                          labelStyle={{ color: "#fff" }}
                          itemStyle={{ color: "#e7f5ec" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="min-w-36 space-y-1">
                    {DIARY_TYPES.map((t) => (
                      <li key={t} className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TYPE_META[t].hex }} />
                        <span className="flex-1">{TYPE_META[t].label}</span>
                        <span className="font-mono tabular-nums text-zinc-400">{typeCounts[t]}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </Card>
      </Rise>

      {/* Filters */}
      <Rise delay={0.05}>
        <Card>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              aria-pressed={typeFilter === "all"}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition-all active:scale-[0.97]",
                typeFilter === "all"
                  ? "border-emerald-400/60 bg-emerald-500/15 text-white"
                  : "border-white/10 bg-black/30 text-zinc-400 hover:text-white",
              )}
            >
              All
            </button>
            {DIARY_TYPES.map((t) => {
              const Icon = TYPE_META[t].icon;
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(active ? "all" : t)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition-all active:scale-[0.97]",
                    active ? TYPE_META[t].chip : "border-white/10 bg-black/30 text-zinc-400 hover:text-white",
                  )}
                >
                  <Icon className="h-3 w-3" /> {TYPE_META[t].label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search details…"
                className={cn(inputCls, "pl-9")}
              />
            </label>
            <label className="block">
              <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className={inputCls} aria-label="Filter by zone">
                <option value="all">All zones</option>
                <option value="A">Zone A</option>
                <option value="B">Zone B</option>
                <option value="C">Zone C</option>
              </select>
            </label>
            <input type="date" value={fromDate} max={toDate || todayISO()} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" className={inputCls} />
            <input type="date" value={toDate} min={fromDate || undefined} max={todayISO()} onChange={(e) => setToDate(e.target.value)} aria-label="To date" className={inputCls} />
          </div>
          {filtersActive && (
            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              <span className="text-zinc-500">
                {filtered.length} of {diary.length} entries
              </span>
              <button type="button" onClick={clearFilters} className="font-bold text-emerald-300 hover:text-emerald-200">
                Clear filters
              </button>
            </div>
          )}
        </Card>
      </Rise>

      {/* Timeline */}
      <Rise delay={0.08}>
        <Card>
          <CardHeader title="Timeline" subtitle={filtered.length === 0 ? "No entries match" : "Newest first"} />
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                <BookOpen className="h-6 w-6" />
              </span>
              <h3 className="mt-3 text-base font-extrabold text-white">Nothing here yet</h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
                {filtersActive ? "No entries match these filters — try clearing them." : "Add your first diary entry to start the farm journal."}
              </p>
              {!filtersActive && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-4 flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-black transition-all hover:bg-emerald-400 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" strokeWidth={3} /> Add Entry
                </button>
              )}
            </div>
          ) : (
            <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[21px] before:top-2 before:w-0.5 before:rounded before:bg-white/10">
              <AnimatePresence initial={false}>
                {filtered.map((entry) => {
                  const meta = TYPE_META[entry.type];
                  const Icon = meta.icon;
                  const scan = entry.scanId ? scans.find((s) => s.id === entry.scanId) : undefined;
                  return (
                    <motion.li
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="relative flex gap-3 pl-0"
                    >
                      <span
                        className={cn(
                          "z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black",
                          entry.type === "irrigation" && "border-sky-400/40",
                          entry.type === "disease" && "border-red-400/40",
                          entry.type === "fertilizer" && "border-emerald-400/40",
                          entry.type === "spray" && "border-purple-400/40",
                          entry.type === "harvest" && "border-amber-400/40",
                        )}
                        style={{ color: meta.hex }}
                      >
                        <Icon className="h-5 w-5" />
                        <span className={cn("absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full", meta.dot)} />
                      </span>
                      <div className="min-w-0 flex-1 rounded-2xl border border-white/5 bg-black/30 p-3.5 sm:p-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", meta.chip)}>
                            <Icon className="h-3 w-3" /> {meta.label}
                          </span>
                          {entry.zone && (
                            <span className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                              <MapPin className="h-3 w-3" /> Zone {entry.zone}
                            </span>
                          )}
                          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                            <CalendarDays className="h-3 w-3" /> {fmtDay(entry.date)}
                          </span>
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-zinc-100">{entry.details}</p>
                        {entry.photo && (
                          <button type="button" onClick={() => setLightbox(entry.photo ?? null)} className="mt-2.5 block" title="View photo">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={entry.photo} alt="Diary attachment" className="h-20 w-20 rounded-xl border border-white/10 object-cover transition-all hover:border-emerald-500/50" />
                          </button>
                        )}
                        {entry.scanId && (
                          <div className="mt-2.5">
                            {scan ? (
                              <button
                                type="button"
                                onClick={() => setOpenScanId(scan.id)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all hover:brightness-125 active:scale-[0.97]",
                                  severityChip(scan.severity),
                                )}
                              >
                                <Bug className="h-3 w-3" />
                                {scan.disease} · {Math.round(scan.confidence * 100)}% · view scan
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-zinc-500">
                                <Bug className="h-3 w-3" /> Linked scan unavailable
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          )}
        </Card>
      </Rise>

      <AddEntryModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ScanModal scan={openScan} onClose={() => setOpenScanId(null)} />

      {/* Photo lightbox */}
      <AnimatePresence>
        {lightbox && (
          <>
            <motion.button
              aria-label="Close photo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightbox(null)}
              className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm"
            />
            <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="pointer-events-auto relative max-h-[85vh] max-w-lg overflow-hidden rounded-2xl border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lightbox} alt="Diary attachment full view" className="max-h-[85vh] w-full object-contain" />
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  aria-label="Close photo"
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
