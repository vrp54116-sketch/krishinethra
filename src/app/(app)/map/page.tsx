"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes,
  Camera,
  Cpu,
  Droplets,
  Info,
  LayoutGrid,
  List,
  ScanSearch,
  Sprout,
  SunMoon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { StatusPill } from "@/components/dashboard/ui";
import FarmMap, { zoneRowClass, zoneStatusTone } from "@/components/map/FarmMap";
import ZoneDetailPanel, { zoneRecommendation } from "@/components/map/ZoneDetailPanel";

type ViewMode = "map" | "list";

const LEGEND = [
  { swatch: "bg-emerald-500", label: "Healthy — moisture in range" },
  { swatch: "bg-amber-500", label: "Warning — dry or over-wet" },
  { swatch: "bg-red-500", label: "Critical — needs action now" },
];

const ICON_LEGEND = [
  { icon: Sprout, label: "Crop plants (wilted = dry stress)" },
  { icon: Droplets, label: "Drip line · blue dots = water flowing" },
  { icon: Boxes, label: "Water tank · fill = live level" },
  { icon: Cpu, label: "ESP32 hub · waves = streaming live" },
  { icon: Camera, label: "Pan-tilt camera · rotates with store" },
  { icon: ScanSearch, label: "Leaf-scan station (Zone C)" },
  { icon: SunMoon, label: "Sun / moon + sky follow farm time" },
];

export default function MapPage() {
  const [view, setView] = useState<ViewMode>("map");
  const [selected, setSelected] = useState<"A" | "B" | "C" | null>(null);

  const zones = useFarmStore((s) => s.zones);
  const mode = useFarmStore((s) => s.settings.mode);
  const thresholds = useFarmStore((s) => s.settings.thresholds);
  const scans = useFarmStore((s) => s.scans);
  const unresolved = scans.filter((x) => !x.resolved).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      {/* ===== Digital Twin banner ===== */}
      <div className="flex items-start gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/[0.07] p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
          <Info className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-white">
            Digital Twin · {mode === "live" ? "LIVE hardware mirror" : "Simulation mirror"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-sky-100/70">
            Live simulation mirror of your physical farm. In LIVE mode this reflects real
            sensor data.
          </p>
        </div>
        <span
          className={cn(
            "ml-auto hidden shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold tracking-widest sm:block",
            mode === "live"
              ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
              : "border-amber-400/50 bg-amber-500/10 text-amber-300",
          )}
        >
          {mode === "live" ? "LIVE" : "SIMULATION"}
        </span>
      </div>

      {/* ===== View toggle ===== */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-white sm:text-base">
          {view === "map" ? "2D Map View" : "List View"} · {zones.length} zones + utilities
        </h2>
        <div className="grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            onClick={() => setView("map")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all",
              view === "map"
                ? "bg-emerald-500 text-black shadow-[0_0_16px_rgba(34,197,94,0.4)]"
                : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> 2D Map View
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all",
              view === "list"
                ? "bg-emerald-500 text-black shadow-[0_0_16px_rgba(34,197,94,0.4)]"
                : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <List className="h-3.5 w-3.5" /> List View
          </button>
        </div>
      </div>

      {view === "map" ? (
        <motion.div
          key="map"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FarmMap selectedZone={selected} onSelectZone={(id) => setSelected(id)} />
        </motion.div>
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setSelected(z.id)}
              className={cn(
                "card-surface rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5",
                zoneRowClass(z.status),
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-white">
                  {z.name} · {z.crop}
                </p>
                <StatusPill tone={zoneStatusTone(z.status)}>{z.status}</StatusPill>
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold text-white">
                {z.soilMoisture.toFixed(1)}
                <span className="text-sm text-zinc-400">%</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    "h-full rounded-full",
                    z.status === "healthy"
                      ? "bg-emerald-400"
                      : z.status === "warning"
                        ? "bg-amber-400"
                        : "bg-red-400",
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, z.soilMoisture))}%` }}
                />
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                {zoneRecommendation(
                  z.id,
                  z.soilMoisture,
                  thresholds.moistureLow,
                  thresholds.moistureHigh,
                  unresolved,
                )}
              </p>
              <p className="mt-2 text-[11px] font-bold text-emerald-300">
                Tap for details →
              </p>
            </button>
          ))}
        </motion.div>
      )}

      {/* ===== Legend ===== */}
      <div className="card-surface rounded-2xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-white">Legend</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEGEND.map((l) => (
            <span
              key={l.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-zinc-300"
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", l.swatch)} />
              {l.label}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ICON_LEGEND.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-black/30 px-3 py-2"
            >
              <Icon className="h-4 w-4 shrink-0 text-emerald-300" />
              <span className="text-xs text-zinc-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Slide-over / bottom sheet ===== */}
      <ZoneDetailPanel zoneId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
