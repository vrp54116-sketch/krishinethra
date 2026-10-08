"use client";

import { useEffect, useState } from "react";
import { Database, ArrowDownToLine, Trash2, ShieldCheck, Activity, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import memory, { type MemoryStats } from "@/lib/brain/memory";

export default function FarmMemoryCard({ className }: { className?: string }) {
  const [stats, setStats] = useState<MemoryStats>({
    rows: 0,
    days: 0,
    firstTs: null,
    lastTs: null,
    eventsByType: {
      pump_on: 0,
      pump_off: 0,
      scan: 0,
      alert: 0,
      command: 0,
      chat: 0,
      feedback: 0,
      brain_train: 0,
    },
    eventsCount: 0,
  });

  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const reloadStats = async () => {
    try {
      const s = await memory.stats();
      setStats(s);
    } catch (e) {
      console.error("Failed to load farm memory stats", e);
    }
  };

  useEffect(() => {
    void reloadStats();

    const handleMemoryUpdated = () => {
      void reloadStats();
    };

    window.addEventListener("kn-memory-updated", handleMemoryUpdated);
    const interval = setInterval(reloadStats, 15_000); // refresh every 15s

    return () => {
      window.removeEventListener("kn-memory-updated", handleMemoryUpdated);
      clearInterval(interval);
    };
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const csv = await memory.exportCSV();
      if (!csv || csv.trim().split("\n").length <= 1) {
        toast.info("farm_log.csv downloaded (header only — start simulation to record rows)");
      } else {
        toast.success("Exported farm_log.csv", {
          description: `${stats.rows} telemetry rows downloaded`,
        });
      }
    } catch (err) {
      toast.error("Failed to export CSV");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearConfirm = async () => {
    if (typedConfirm.trim().toUpperCase() !== "CLEAR") return;
    try {
      setIsClearing(true);
      await memory.clear();
      setClearModalOpen(false);
      setTypedConfirm("");
      await reloadStats();
      toast.success("Farm memory purged", {
        description: "IndexedDB database kn_farm cleared.",
      });
    } catch (err) {
      toast.error("Failed to clear farm memory");
      console.error(err);
    } finally {
      setIsClearing(false);
    }
  };

  const firstDate = stats.firstTs ? new Date(stats.firstTs).toLocaleDateString() : "--";
  const lastDate = stats.lastTs ? new Date(stats.lastTs).toLocaleDateString() : "--";

  return (
    <div
      className={cn(
        "rounded-none border border-[var(--line)] bg-[var(--panel)] p-4 md:p-5 space-y-4 font-editorial-mono text-[var(--ink)]",
        className,
      )}
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-none border border-[var(--line)] bg-[var(--panel-2)] text-[var(--moss)]">
            <Database className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                FARM MEMORY // DIARY
              </h3>
              <span className="rounded-none border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wide">
              90-DAY PRIVATE ON-DEVICE DIARY (INDEXEDDB: KN_FARM)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider text-[var(--ink)] bg-[var(--panel-2)] hover:bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--ink-2)] transition-all cursor-pointer disabled:opacity-40"
          >
            <ArrowDownToLine className="h-3 w-3 text-emerald-400" />
            <span>EXPORT CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTypedConfirm("");
              setClearModalOpen(true);
            }}
            disabled={stats.rows === 0 && stats.eventsCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider text-[var(--terra)] bg-[var(--terra-soft)] hover:bg-[var(--terra-soft)]/80 border border-[var(--terra)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3 w-3" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Editorial Mono Stamps) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <div className="border border-[var(--line)] bg-[var(--panel-2)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
            ROWS RECORDED
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-white">{stats.rows}</span>
            <span className="text-[10px] text-zinc-500">telemetry</span>
          </div>
          <p className="mt-1 text-[9px] text-[var(--ink-3)]">1 ROW / MIN THROTTLED</p>
        </div>

        <div className="border border-[var(--line)] bg-[var(--panel-2)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
            DAYS COVERED
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-white">{stats.days}</span>
            <span className="text-[10px] text-zinc-500">/ 90 max</span>
          </div>
          <p className="mt-1 text-[9px] text-[var(--ink-3)]">
            {stats.firstTs ? `${firstDate} → ${lastDate}` : "AWAITING SAMPLES"}
          </p>
        </div>

        <div className="border border-[var(--line)] bg-[var(--panel-2)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
            EVENTS COUNT
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-white">{stats.eventsCount}</span>
            <span className="text-[10px] text-zinc-500">total events</span>
          </div>
          <p className="mt-1 text-[9px] text-[var(--ink-3)]">AUDIT & ACTIONS</p>
        </div>

        <div className="border border-[var(--line)] bg-[var(--panel-2)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
            RETENTION POLICY
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">90 DAYS</span>
          </div>
          <p className="mt-1 text-[9px] text-[var(--ink-3)]">AUTO-PRUNED ON WRITE</p>
        </div>
      </div>

      {/* Event Breakdown Tags */}
      <div className="border border-[var(--line)] bg-[var(--panel-2)] p-3 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
          <span>EVENT STAMPS BREAKDOWN</span>
          <span>{stats.eventsCount} LOGGED</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-zinc-300">
            PUMP ON: <strong className="text-emerald-400">{stats.eventsByType.pump_on}</strong>
          </span>
          <span className="border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-zinc-300">
            PUMP OFF: <strong className="text-zinc-200">{stats.eventsByType.pump_off}</strong>
          </span>
          <span className="border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-zinc-300">
            SCANS: <strong className="text-cyan-400">{stats.eventsByType.scan}</strong>
          </span>
          <span className="border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-zinc-300">
            ALERTS: <strong className="text-amber-400">{stats.eventsByType.alert}</strong>
          </span>
          <span className="border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-zinc-300">
            COMMANDS: <strong className="text-purple-400">{stats.eventsByType.command}</strong>
          </span>
          <span className="border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-zinc-300">
            CHAT: <strong className="text-emerald-300">{stats.eventsByType.chat}</strong>
          </span>
          <span className="border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-zinc-300">
            FEEDBACK: <strong className="text-pink-400">{stats.eventsByType.feedback}</strong>
          </span>
          <span className="border border-[var(--line)] bg-[var(--panel)] px-2 py-1 text-zinc-300">
            TRAIN: <strong className="text-indigo-400">{stats.eventsByType.brain_train}</strong>
          </span>
        </div>
      </div>

      {/* Brain Citation Helper Footer */}
      <div className="flex items-center justify-between border-t border-[var(--line)] pt-3 text-[10px] text-[var(--ink-3)]">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-emerald-400" />
          <span>BRAIN CITATION:</span>
          <span className="font-bold text-zinc-300">
            &ldquo;based on your last {stats.days} days, {stats.rows} rows&rdquo;
          </span>
        </div>
        <span className="text-zinc-500 hidden sm:inline">CSV: farm_log.csv</span>
      </div>

      {/* Typed confirm modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md border border-[var(--terra)] bg-[var(--panel)] p-5 space-y-4 font-editorial-mono">
            <div className="flex items-center gap-2.5 text-[var(--terra)]">
              <AlertTriangle className="h-5 w-5" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                PURGE FARM MEMORY // TYPED CONFIRM
              </h4>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              This will permanently delete all {stats.rows} telemetry rows and {stats.eventsCount} events from on-device IndexedDB storage (<code className="text-white">kn_farm</code>). Models will lose this historical training context.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Type <span className="text-[var(--terra)] font-bold">CLEAR</span> to proceed:
              </label>
              <input
                type="text"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder="CLEAR"
                className="w-full rounded-none border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-xs font-bold text-white uppercase outline-none focus:border-[var(--terra)] placeholder:text-zinc-600"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider border border-[var(--line)] text-zinc-300 hover:text-white"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleClearConfirm}
                disabled={typedConfirm.trim().toUpperCase() !== "CLEAR" || isClearing}
                className="px-4 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider bg-[var(--terra)] text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isClearing ? "PURGING..." : "CONFIRM PURGE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
