"use client";

import { useMemo, useState } from "react";
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
    cls: "text-[var(--gold)] border-[var(--gold)]/30 bg-[var(--gold)]/10",
  },
  rabi: {
    label: "Rabi",
    cls: "text-[var(--moss)] border-[var(--moss)]/30 bg-[var(--moss-soft)]",
  },
  zaid: {
    label: "Zaid",
    cls: "text-[var(--moss)] border-[var(--moss)]/30 bg-[var(--moss-soft)]",
  },
  perennial: {
    label: "Perennial",
    cls: "text-[var(--ink-2)] border-[var(--line)] bg-[var(--panel-2)]",
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
    <div className={cn("space-y-3 font-editorial-mono", className)}>
      {/* 1. Search Box (Editorial sharp border) */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-3)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH 120+ CROPS (e.g. Wheat, Tomato, गेहूं)..."
          className="w-full rounded-none border border-[var(--line)] bg-[var(--panel)] pl-9 pr-8 py-2 text-xs uppercase font-medium text-[var(--ink)] placeholder:text-[var(--ink-3)] outline-none transition-colors focus:border-[var(--terra)]"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. Category Chips Bar (Bordered square chips) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
        <button
          type="button"
          onClick={() => setSelectedCat("All")}
          className={cn(
            "shrink-0 rounded-none px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border",
            selectedCat === "All"
              ? "bg-[var(--terra-soft)] border-[var(--terra)] text-[var(--terra)]"
              : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:text-[var(--ink)]",
          )}
        >
          ALL ({CROPS.length})
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
                "shrink-0 rounded-none px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border",
                active
                  ? "bg-[var(--terra-soft)] border-[var(--terra)] text-[var(--terra)]"
                  : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:text-[var(--ink)]",
              )}
            >
              {cat.toUpperCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* 3. Sub-header with count and Select All in Category */}
      <div className="flex items-center justify-between px-0.5 text-[11px] text-[var(--ink-3)] uppercase tracking-wider">
        <span>
          {filteredCrops.length} {filteredCrops.length === 1 ? "CROP" : "CROPS"} FOUND
        </span>
        {filteredCrops.length > 0 && (
          <button
            type="button"
            onClick={toggleSelectAllCategory}
            className="flex items-center gap-1 font-bold text-[var(--terra)] hover:underline cursor-pointer transition-colors"
          >
            {allVisibleSelected ? (
              <>
                <CheckSquare className="h-3 w-3" />
                <span>DESELECT ALL</span>
              </>
            ) : (
              <>
                <Square className="h-3 w-3" />
                <span>SELECT ALL</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 4. Crop Multi-Select as Bordered Chip Grid */}
      <div className="max-h-72 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1.5 rounded-none border border-[var(--line)] bg-[var(--panel)]">
        {filteredCrops.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-[var(--ink-3)]">
            NO CROPS MATCHED &quot;{search}&quot;.
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
                  "group flex items-center justify-between gap-2 rounded-none border p-2 text-left transition-colors cursor-pointer select-none",
                  isSelected
                    ? "border-[var(--terra)] bg-[var(--terra-soft)] text-[var(--ink)]"
                    : "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-2)] hover:border-[var(--ink-3)] hover:text-[var(--ink)]",
                )}
              >
                {/* Left: Name and details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="text-xs font-bold uppercase truncate text-[var(--ink)]">
                      {crop.en}
                    </span>
                    <span className="text-[10px] text-[var(--ink-3)] truncate">
                      {crop.hi}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px]">
                    <span className={cn("border px-1 py-0.2 rounded-none uppercase font-semibold", season.cls)}>
                      {season.label}
                    </span>
                    <span className="border border-[var(--line)] px-1 py-0.2 rounded-none text-[var(--ink-3)]">
                      {water.icon} {water.label}
                    </span>
                    <span className="text-[var(--ink-3)] tabular-nums">
                      {crop.days}d
                    </span>
                  </div>
                </div>

                {/* Right: Square checkbox */}
                <div
                  className={cn(
                    "shrink-0 flex h-4 w-4 items-center justify-center rounded-none border transition-colors",
                    isSelected
                      ? "border-[var(--terra)] bg-[var(--terra)] text-white"
                      : "border-[var(--line)] bg-[var(--panel)] group-hover:border-[var(--ink-3)]",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 5. Bottom Selected Counter + Bordered Chips Tray */}
      <div className="rounded-none border border-[var(--line)] bg-[var(--panel-2)] p-2.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <span className="text-[var(--ink)]">
            SELECTED:{" "}
            <span className="text-[var(--terra)] tabular-nums">
              {selectedIds.length} {selectedIds.length === 1 ? "CROP" : "CROPS"}
            </span>
          </span>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[10px] font-semibold text-[var(--terra)] hover:underline cursor-pointer transition-colors"
            >
              CLEAR ALL
            </button>
          )}
        </div>

        {selectedCropsList.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {selectedCropsList.map((crop) => (
              <span
                key={crop.id}
                className="inline-flex items-center gap-1.5 rounded-none border border-[var(--terra)] bg-[var(--terra-soft)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--ink)]"
              >
                <span>{crop.en}</span>
                <button
                  type="button"
                  onClick={() => removeCrop(crop.id)}
                  aria-label={`Remove ${crop.en}`}
                  className="text-[var(--ink-3)] hover:text-[var(--terra)] cursor-pointer transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider">
            NO CROPS SELECTED YET. SELECT AT LEAST ONE CROP ABOVE.
          </p>
        )}
      </div>
    </div>
  );
}
