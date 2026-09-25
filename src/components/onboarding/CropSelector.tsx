"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Search, X, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CROPS,
  CROP_CATEGORIES,
  type Crop,
  type CropCategory,
  type CropSeason,
  type CropWater,
} from "@/lib/crops";

export interface CropSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

const SEASON_CONFIG: Record<CropSeason, { label: string; cls: string }> = {
  kharif: {
    label: "Kharif",
    cls: "bg-amber-500/10 text-amber-300 border-amber-400/20",
  },
  rabi: {
    label: "Rabi",
    cls: "bg-sky-500/10 text-sky-300 border-sky-400/20",
  },
  zaid: {
    label: "Zaid",
    cls: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
  },
  perennial: {
    label: "Perennial",
    cls: "bg-purple-500/10 text-purple-300 border-purple-400/20",
  },
};

const WATER_CONFIG: Record<CropWater, { label: string; icon: string }> = {
  low: { label: "Low", icon: "💧" },
  med: { label: "Med", icon: "💧💧" },
  high: { label: "High", icon: "💧💧💧" },
};

export default function CropSelector({
  selectedIds,
  onChange,
  className,
}: CropSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<CropCategory | "All">("All");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Fast filter
  const filteredCrops = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CROPS.filter((c) => {
      if (selectedCat !== "All" && c.cat !== selectedCat) return false;
      if (!q) return true;
      return (
        c.en.toLowerCase().includes(q) ||
        c.hi.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.cat.toLowerCase().includes(q)
      );
    });
  }, [search, selectedCat]);

  const allVisibleSelected =
    filteredCrops.length > 0 &&
    filteredCrops.every((c) => selectedSet.has(c.id));

  const toggleCrop = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleSelectAllCategory = () => {
    if (allVisibleSelected) {
      // Remove all visible from selection
      const visibleIds = new Set(filteredCrops.map((c) => c.id));
      onChange(selectedIds.filter((id) => !visibleIds.has(id)));
    } else {
      // Add all visible to selection
      const combined = new Set([...selectedIds, ...filteredCrops.map((c) => c.id)]);
      onChange(Array.from(combined));
    }
  };

  const removeCrop = (id: string) => {
    onChange(selectedIds.filter((item) => item !== id));
  };

  const clearAll = () => {
    onChange([]);
  };

  // Lookup for selected crops chips tray
  const selectedCropsList = useMemo(() => {
    const map = new Map(CROPS.map((c) => [c.id, c]));
    return selectedIds
      .map((id) => map.get(id))
      .filter((c): c is Crop => Boolean(c));
  }, [selectedIds]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* 1. Search Box */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-2)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search 120+ crops (e.g. Wheat, Tomato, गेहूं, चना)..."
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-9 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text)] placeholder:text-[var(--text-2)] placeholder:font-normal outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_16px_var(--accent-glow)]"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--text-2)] hover:text-[var(--text)]"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 2. Category Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide text-xs">
        <button
          type="button"
          onClick={() => setSelectedCat("All")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 font-bold transition-all cursor-pointer border text-[11px]",
            selectedCat === "All"
              ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-glow)]"
              : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]",
          )}
        >
          All ({CROPS.length})
        </button>
        {CROP_CATEGORIES.map((cat) => {
          const count = CROPS.filter((c) => c.cat === cat).length;
          const active = selectedCat === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 font-bold transition-all cursor-pointer border text-[11px]",
                active
                  ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-glow)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]",
              )}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* 3. Sub-header with count and Select All in Category */}
      <div className="flex items-center justify-between px-1 text-[11px]">
        <span className="font-semibold uppercase tracking-wider text-[var(--text-2)]">
          {filteredCrops.length} {filteredCrops.length === 1 ? "crop" : "crops"} found
        </span>
        {filteredCrops.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAllCategory}
            className="flex items-center gap-1 font-bold text-[var(--accent-2)] hover:text-[var(--accent)] cursor-pointer transition-colors"
          >
            {allVisibleSelected ? (
              <>
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Deselect all visible</span>
              </>
            ) : (
              <>
                <Square className="h-3.5 w-3.5" />
                <span>Select all in category</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 4. List Rows */}
      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2">
        {filteredCrops.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-2)]">
            No crops matched &quot;{search}&quot;. Try a different term or category.
          </div>
        ) : (
          filteredCrops.map((crop) => {
            const isSelected = selectedSet.has(crop.id);
            const season = SEASON_CONFIG[crop.season] || SEASON_CONFIG.kharif;
            const water = WATER_CONFIG[crop.water] || WATER_CONFIG.med;

            return (
              <button
                key={crop.id}
                type="button"
                onClick={() => toggleCrop(crop.id)}
                className={cn(
                  "group flex w-full items-center justify-between gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_12px_var(--accent-glow)]"
                    : "border-[var(--border)] bg-[var(--surface-2)]/40 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)]",
                )}
              >
                {/* Left: Name and details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-sm font-bold truncate transition-colors",
                        isSelected ? "text-[var(--text)]" : "text-[var(--text)]/90 group-hover:text-[var(--text)]",
                      )}
                    >
                      {crop.en}
                    </span>
                    <span className="text-xs font-medium text-[var(--text-2)] truncate">
                      {crop.hi}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 font-semibold",
                        season.cls,
                      )}
                    >
                      {season.label}
                    </span>
                    <span
                      className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 font-medium text-[var(--text-2)]"
                      title={`Water requirement: ${water.label}`}
                    >
                      {water.icon} {water.label}
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[var(--text-2)]">
                      {crop.days}d
                    </span>
                    <span className="text-[10px] text-[var(--text-2)] hidden sm:inline">
                      • {crop.cat}
                    </span>
                  </div>
                </div>

                {/* Right: Orange check animation toggle */}
                <div className="shrink-0 flex items-center justify-center">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg border transition-all",
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]"
                        : "border-[var(--border)] bg-[var(--surface-2)] group-hover:border-[var(--accent)]/50",
                    )}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 30 }}
                          transition={{ type: "spring", stiffness: 450, damping: 25 }}
                        >
                          <Check className="h-4 w-4 text-white stroke-[3]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 5. Bottom Selected Counter + Chips Tray */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[var(--text)]">
            Selected:{" "}
            <span className="font-mono text-[var(--accent-2)]">
              {selectedIds.length} {selectedIds.length === 1 ? "crop" : "crops"}
            </span>
          </span>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] font-semibold text-[var(--text-2)] hover:text-rose-400 cursor-pointer transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {selectedCropsList.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {selectedCropsList.map((crop) => (
              <span
                key={crop.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--text)] shadow-[0_0_8px_var(--accent-glow)]"
              >
                <span>{crop.en}</span>
                <span className="text-[10px] text-[var(--text-2)]">({crop.hi})</span>
                <button
                  type="button"
                  onClick={() => removeCrop(crop.id)}
                  aria-label={`Remove ${crop.en}`}
                  className="rounded-full p-0.5 text-[var(--text-2)] hover:bg-[var(--accent)] hover:text-white cursor-pointer transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[var(--text-2)] italic">
            No crops selected yet. Tap any crop above to select.
          </p>
        )}
      </div>
    </div>
  );
}
