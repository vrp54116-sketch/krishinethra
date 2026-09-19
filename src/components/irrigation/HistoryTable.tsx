"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFarmStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { FLOW_RATE_LPM } from "@/lib/simulation-engine";
import { Card, CardHeader, useMounted } from "@/components/dashboard/ui";
import { formatDateTime, formatDuration } from "./shared";

type RunMode = "auto" | "manual" | "schedule" | "log";

export interface IrrigationRecord {
  id: string;
  ts: number;
  durationSec: number | null;
  waterL: number | null;
  mode: RunMode;
  trigger: string;
}

const LOG_KEY = "krishinethra-irrigation-log-v1";

function loadSessions(): IrrigationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as IrrigationRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function inferMode(text: string, fallback: RunMode): RunMode {
  if (/sched/i.test(text)) return "schedule";
  if (/manual/i.test(text)) return "manual";
  if (/auto/i.test(text)) return "auto";
  return fallback;
}

function parseDurationSec(text: string): number | null {
  const min = text.match(/(\d+(?:\.\d+)?)\s?min/);
  if (min) return Math.round(Number(min[1]) * 60);
  const sec = text.match(/(\d+(?:\.\d+)?)\s?s(?:ec)?\b/);
  if (sec) return Math.round(Number(sec[1]));
  return null;
}

const MODE_STYLES: Record<RunMode, string> = {
  auto: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  manual: "border-sky-400/40 bg-sky-500/10 text-sky-300",
  schedule: "border-violet-400/40 bg-violet-500/10 text-violet-300",
  log: "border-white/10 bg-white/[0.04] text-zinc-300",
};

type SortKey = "ts" | "durationSec" | "waterL";

function HeaderBtn({
  label,
  k,
  sortKey,
  sortDir,
  onToggle,
  className,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: 1 | -1;
  onToggle: (key: SortKey) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(k)}
      className={cn("inline-flex items-center gap-1 font-bold uppercase tracking-wider hover:text-white", className)}
    >
      {label}
      {sortKey !== k ? (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      ) : sortDir === 1 ? (
        <ArrowUp className="h-3 w-3 text-emerald-300" />
      ) : (
        <ArrowDown className="h-3 w-3 text-emerald-300" />
      )}
    </button>
  );
}

export default function HistoryTable() {
  const t = useT();
  const alerts = useFarmStore((s) => s.alerts);
  const diary = useFarmStore((s) => s.diary);
  const mounted = useMounted();

  const [sessions, setSessions] = useState<IrrigationRecord[]>(loadSessions);
  const activeRun = useRef<{
    startTs: number;
    startWater: number;
    mode: RunMode;
    trigger: string;
  } | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("ts");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  // Watch pump start/stop transitions → accurate duration + water used.
  useEffect(() => {
    const unsub = useFarmStore.subscribe((s, prev) => {
      const was = prev.pump.running;
      const is = s.pump.running;
      if (!was && is) {
        activeRun.current = {
          startTs: Date.now(),
          startWater: s.totalWaterUsedL,
          mode: s.pump.mode as RunMode,
          trigger: `moisture ${s.snapshot.soilMoistureB.toFixed(0)}% · tank ${s.snapshot.tankLevelPercent.toFixed(0)}%`,
        };
      } else if (was && !is && activeRun.current) {
        const run = activeRun.current;
        activeRun.current = null;
        const endTs = Date.now();
        const rec: IrrigationRecord = {
          id: `run-${run.startTs}`,
          ts: run.startTs,
          durationSec: Math.max(1, Math.round((endTs - run.startTs) / 1000)),
          waterL: Math.max(0, Math.round((s.totalWaterUsedL - run.startWater) * 10000) / 10000),
          mode: run.mode,
          trigger: run.trigger,
        };
        setSessions((prevSessions) => {
          const next = [rec, ...prevSessions].slice(0, 60);
          try {
            localStorage.setItem(LOG_KEY, JSON.stringify(next));
          } catch {
            /* storage full/blocked — keep in memory */
          }
          return next;
        });
      }
    });
    return unsub;
  }, []);

  const rows = useMemo(() => {
    const sessionTimes = new Set(sessions.map((r) => r.ts));
    const out: IrrigationRecord[] = [...sessions];

    // Pump events from alerts (auto starts, manual ON/OFF, blocked, schedule).
    for (const a of alerts) {
      if (!/pump/i.test(a.title)) continue;
      if (/mode →/i.test(a.title)) continue; // mode switch, not a run
      const nearSession = [...sessionTimes].some((t) => Math.abs(t - a.timestamp) < 120_000);
      if (nearSession) continue; // live session row is more accurate
      const durationSec = parseDurationSec(`${a.title} ${a.message}`);
      out.push({
        id: a.id,
        ts: a.timestamp,
        durationSec,
        waterL: durationSec != null ? Math.round(((FLOW_RATE_LPM / 60) * durationSec) * 10000) / 10000 : null,
        mode: inferMode(`${a.title} ${a.message}`, "auto"),
        trigger: a.message.length > 64 ? `${a.message.slice(0, 64)}…` : a.message,
      });
    }

    // Irrigation entries from the farm diary.
    for (const d of diary) {
      if (d.type !== "irrigation") continue;
      const ts = new Date(`${d.date}T12:00:00`).getTime();
      if (Number.isNaN(ts)) continue;
      if ([...sessionTimes].some((t) => Math.abs(t - ts) < 120_000)) continue;
      const durationSec = parseDurationSec(d.details);
      out.push({
        id: d.id,
        ts,
        durationSec,
        waterL: durationSec != null ? Math.round(((FLOW_RATE_LPM / 60) * durationSec) * 10000) / 10000 : null,
        mode: inferMode(d.details, "manual"),
        trigger: d.details.length > 64 ? `${d.details.slice(0, 64)}…` : d.details,
      });
    }

    const val = (r: IrrigationRecord): number => {
      if (sortKey === "ts") return r.ts;
      const v = sortKey === "durationSec" ? r.durationSec : r.waterL;
      return v ?? -1;
    };
    return out.sort((a, b) => (val(a) - val(b)) * sortDir).slice(0, 20);
  }, [sessions, alerts, diary, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(key === "ts" ? -1 : 1);
    }
  };

  return (
    <Card>
      <CardHeader
        title={t("irrigation.historyTitle")}
        subtitle="Pump runs from alerts, diary & live sessions · last 20"
        action={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400">
            <History className="h-4 w-4" />
          </span>
        }
      />

      {rows.length === 0 ? (
        <p className="rounded-xl border border-white/5 bg-black/40 px-4 py-8 text-center text-xs text-zinc-500">
          No irrigation runs logged yet — turn the pump ON to record the first one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-[10px] text-zinc-500">
                <th className="px-3 py-2.5"><HeaderBtn label="Date · time" k="ts" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="px-3 py-2.5"><HeaderBtn label="Duration" k="durationSec" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="px-3 py-2.5"><HeaderBtn label="Water" k="waterL" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="px-3 py-2.5">Mode</th>
                <th className="px-3 py-2.5">Trigger reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-zinc-300">
                    {mounted ? formatDateTime(r.ts) : new Date(r.ts).toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-white">{formatDuration(r.durationSec)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-sky-300">
                    {r.waterL != null ? `${r.waterL.toFixed(3)} L` : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", MODE_STYLES[r.mode])}>
                      {r.mode}
                    </span>
                  </td>
                  <td className="max-w-[260px] truncate px-3 py-2.5 text-zinc-400" title={r.trigger}>
                    {r.trigger}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
