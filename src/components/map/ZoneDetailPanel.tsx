"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { BookOpen, Camera, Droplets, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { StatusPill, formatRelativeTime, useMounted } from "@/components/dashboard/ui";
import { ZONE_PAN, zoneStatusTone } from "./FarmMap";

/** Diary note composer — owns its own draft state. */
function NoteBox({
  zoneName,
  onSave,
}: {
  zoneName: string;
  onSave: (text: string, clear: () => void) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
        <BookOpen className="h-3.5 w-3.5" /> Add diary note
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        placeholder={`e.g. Checked ${zoneName} leaves — looking healthy…`}
        className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onSave(draft, () => setDraft(""))}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-zinc-100 transition-all hover:border-emerald-500/40 hover:text-emerald-200 active:scale-[0.98]"
      >
        Save note to diary
      </button>
    </div>
  );
}

/** Rule-based AI recommendation line for one zone. */
export function zoneRecommendation(
  zoneId: string,
  moisture: number,
  low: number,
  high: number,
  unresolvedDisease: number,
): string {
  if (zoneId === "C") {
    if (unresolvedDisease > 0)
      return `${unresolvedDisease} active disease scan${unresolvedDisease > 1 ? "s" : ""} — inspect leaves at the scan station and continue the spray plan.`;
    return "Inspection zone looks clear — scan a Tomato leaf weekly to catch pests early.";
  }
  if (moisture < 20) return `Critically dry at ${moisture.toFixed(1)}% — irrigate immediately.`;
  if (moisture < low)
    return `Below the ${low}% threshold at ${moisture.toFixed(1)}% — run a 10s irrigation now.`;
  if (moisture > high)
    return `Above ${high}% at ${moisture.toFixed(1)}% — hold irrigation, let the soil breathe.`;
  return `Healthy at ${moisture.toFixed(1)}% — no irrigation needed right now.`;
}

export default function ZoneDetailPanel({
  zoneId,
  onClose,
}: {
  zoneId: "A" | "B" | "C" | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const mounted = useMounted();
  const zones = useFarmStore((s) => s.zones);
  const pump = useFarmStore((s) => s.pump);
  const thresholds = useFarmStore((s) => s.settings.thresholds);
  const scans = useFarmStore((s) => s.scans);
  const setPumpManual = useFarmStore((s) => s.setPumpManual);
  const setCameraAngles = useFarmStore((s) => s.setCameraAngles);
  const addDiary = useFarmStore((s) => s.addDiary);

  // Note input lives in <NoteBox key={zoneId}> below so switching zones
  // remounts it and clears the draft without a set-state-in-effect.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!zoneId) return;
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [zoneId]);

  const zone = zones.find((z) => z.id === zoneId);
  const unresolved = scans.filter((x) => !x.resolved).length;
  const irrigable = zoneId === "A" || zoneId === "B";

  const handleIrrigate = () => {
    if (!zoneId) return;
    setPumpManual(true, 10);
    addDiary({
      type: "irrigation",
      details: `Manual 10s irrigation started for Zone ${zoneId} from the farm map.`,
      zone: zoneId,
    });
    toast.success(`Irrigating Zone ${zoneId} for 10s`, {
      description: `Soil at ${zone?.soilMoisture.toFixed(1)}% — watch the pipes flow.`,
    });
  };

  const handleViewCamera = () => {
    if (!zoneId) return;
    setCameraAngles(ZONE_PAN[zoneId] ?? 90);
    toast.info(`Camera panning to Zone ${zoneId}`, {
      description: `Pan set to ${ZONE_PAN[zoneId] ?? 90}° — opening camera.`,
    });
    router.push("/camera");
  };

  const handleAddNote = (text: string, clear: () => void) => {
    if (!text.trim() || !zoneId) {
      toast.error("Write a note first", { description: "The diary note is empty." });
      return;
    }
    addDiary({ type: "general", details: text.trim(), zone: zoneId });
    clear();
    toast.success(`Diary note added to Zone ${zoneId}`);
  };

  const moisture = zone?.soilMoisture ?? 0;
  const barColor =
    zone?.status === "healthy"
      ? "bg-emerald-400"
      : zone?.status === "warning"
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <AnimatePresence>
      {zoneId && zone && (
        <>
          <motion.button
            aria-label="Close zone details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%", y: 0, opacity: 0.6 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: "100%", y: 0, opacity: 0.6 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed z-50 flex flex-col border-emerald-500/25 bg-[#060b08]",
              // bottom sheet on mobile, right slide-over on desktop
              "inset-x-0 bottom-0 max-h-[82vh] rounded-t-3xl border-t",
              "md:inset-x-auto md:bottom-0 md:right-0 md:top-0 md:max-h-none md:w-[380px] md:rounded-none md:border-l md:border-t-0",
            )}
            role="dialog"
            aria-label={`${zone.name} details`}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/15 md:hidden" />
            <div className="flex items-start justify-between gap-3 p-5 pb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-extrabold text-white">
                    {zone.name} · {zone.crop}
                  </h2>
                  <StatusPill tone={zoneStatusTone(zone.status)}>{zone.status}</StatusPill>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {zoneId === "C"
                    ? "Disease inspection zone · leaf-scan station"
                    : `Irrigated crop zone · drip line ${pump.running ? "flowing" : "idle"}`}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5 pt-1">
              {/* Live soil moisture */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Soil moisture · live
                  </span>
                  <span className="font-mono text-xl font-extrabold text-white">
                    {mounted ? moisture.toFixed(1) : "--"}%
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", barColor)}
                    style={{ width: `${Math.min(100, Math.max(0, moisture))}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[10px] text-zinc-500">
                  <span>0%</span>
                  <span>
                    healthy {thresholds.moistureLow}–{thresholds.moistureHigh}%
                  </span>
                  <span>100%</span>
                </div>
              </div>

              {/* Last irrigated */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                  <Droplets className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Last irrigated
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {mounted
                      ? pump.lastRunAt
                        ? formatRelativeTime(pump.lastRunAt, now)
                        : "Not yet this session"
                      : "--"}
                  </p>
                </div>
              </div>

              {/* AI recommendation */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" /> AI recommendation · live
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-emerald-50/90">
                  {zoneRecommendation(
                    zoneId,
                    moisture,
                    thresholds.moistureLow,
                    thresholds.moistureHigh,
                    unresolved,
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {irrigable && (
                  <button
                    type="button"
                    onClick={handleIrrigate}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:bg-emerald-400 active:scale-[0.98]"
                  >
                    <Droplets className="h-4 w-4" /> Irrigate Now · 10s
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleViewCamera}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 text-sm font-extrabold text-sky-200 transition-all hover:bg-sky-500/20 active:scale-[0.98]"
                >
                  <Camera className="h-4 w-4" /> View on Camera (pan {ZONE_PAN[zoneId] ?? 90}°)
                </button>
              </div>

              {/* Diary note (keyed by zone so the draft resets on zone switch) */}
              <NoteBox
                key={zoneId}
                zoneName={zone.name}
                onSave={handleAddNote}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
