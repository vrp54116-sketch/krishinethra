"use client";

/**
 * Shared download helpers for /reports + /settings Backup Data.
 * Client-side Blob downloads — no server, no dependencies.
 */

import type { DailySummary } from "./types";
import { useFarmStore } from "./store";

export function downloadBlob(
  filename: string,
  content: string,
  mime = "application/json",
): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV of daily rollups — opens cleanly in Excel / Sheets. */
export function dailySummariesToCSV(rows: DailySummary[]): string {
  const header = [
    "date",
    "healthScore",
    "waterUsedL",
    "energyKwh",
    "energyCostRs",
    "scans",
    "scansResolved",
    "irrigationEvents",
    "tasksDone",
    "tasksTotal",
    "avgTempC",
    "avgHumidity",
    "diaryCount",
    "diseaseBreakdown",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const breakdown = Object.entries(r.diseaseCounts ?? {})
      .map(([k, v]) => `${k}:${v}`)
      .join("; ");
    lines.push(
      [
        r.date,
        r.healthScore,
        r.waterUsedL,
        r.energyKwh,
        r.energyCostRs,
        r.scans,
        r.scansResolved,
        r.irrigationEvents,
        r.tasksDone,
        r.tasksTotal,
        r.avgTempC,
        r.avgHumidity,
        r.diaryCount,
        breakdown,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\n");
}

export function exportDailyCSV(rows: DailySummary[], range: string): void {
  const csv = dailySummariesToCSV(rows);
  const today = new Date().toISOString().slice(0, 10);
  downloadBlob(`krishinethra-report-${range}-${today}.csv`, csv, "text/csv");
}

/** Full-store JSON backup — same payload used by Settings → Backup Data. */
export function exportFarmBackup(): void {
  const s = useFarmStore.getState();
  const payload = {
    app: "KrishiNethra AI",
    version: 1,
    exportedAt: new Date().toISOString(),
    language: s.language,
    isAuthenticated: s.isAuthenticated,
    settings: s.settings,
    zones: s.zones,
    snapshot: s.snapshot,
    sensorHistory: s.sensorHistory,
    pump: s.pump,
    manualPumpRemainingSec: s.manualPumpRemainingSec,
    totalWaterUsedL: s.totalWaterUsedL,
    alerts: s.alerts,
    scans: s.scans,
    diary: s.diary,
    tasks: s.tasks,
    sprayPlans: s.sprayPlans,
    chat: s.chat,
    farmHealthScore: s.farmHealthScore,
    panAngle: s.panAngle,
    tiltAngle: s.tiltAngle,
    dailySummaries: s.dailySummaries ?? [],
  };
  const today = new Date().toISOString().slice(0, 10);
  downloadBlob(
    `krishinethra-backup-${today}.json`,
    JSON.stringify(payload, null, 2),
    "application/json",
  );
}
