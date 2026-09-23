/**
 * command-logger.ts
 * Tracks the last 50 commands sent to the ESP32 edge node with real-time updates,
 * localStorage persistence, and CSV export.
 */

import type { CommandLogEntry } from "./types";

const STORAGE_KEY = "krishinethra-esp32-cmd-log-v1";
const MAX_ENTRIES = 50;

function seedCommands(): CommandLogEntry[] {
  const now = Date.now();
  return [
    {
      id: "cmd-1",
      timestamp: now - 120_000,
      command: "PUMP:OFF",
      status: "Success",
      responseTimeMs: 38,
    },
    {
      id: "cmd-2",
      timestamp: now - 360_000,
      command: "PUMP:ON",
      status: "Success",
      responseTimeMs: 45,
    },
    {
      id: "cmd-3",
      timestamp: now - 720_000,
      command: "MODE:AUTO",
      status: "Success",
      responseTimeMs: 32,
    },
    {
      id: "cmd-4",
      timestamp: now - 1_200_000,
      command: "SERVO:90",
      status: "Success",
      responseTimeMs: 50,
    },
    {
      id: "cmd-5",
      timestamp: now - 1_800_000,
      command: "BUZZ:2:150",
      status: "Success",
      responseTimeMs: 41,
    },
  ];
}

export function getCommandLog(): CommandLogEntry[] {
  if (typeof window === "undefined") return seedCommands();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedCommands();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as CommandLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return seedCommands();
  }
}

export function logCommand(
  command: string,
  status: "Success" | "Pending" | "Failed" = "Success",
  responseTimeMs: number = Math.round(30 + Math.random() * 25),
): CommandLogEntry {
  const entry: CommandLogEntry = {
    id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    command: command.toUpperCase().replace(/\s+/g, "_"),
    status,
    responseTimeMs,
  };

  if (typeof window !== "undefined") {
    try {
      const existing = getCommandLog();
      const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("krishi-command-logged", { detail: entry }));
    } catch {
      /* ignore storage write failures */
    }
  }

  return entry;
}

export function clearCommandLog(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("krishi-command-logged", { detail: null }));
  } catch {
    /* ignore */
  }
}

export function exportCommandLogCSV(entries: CommandLogEntry[]): void {
  if (typeof window === "undefined") return;
  const headers = ["Time", "Timestamp", "Command", "Status", "ResponseTimeMs"];
  const rows = entries.map((e) => {
    const date = new Date(e.timestamp);
    const timeStr = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return [
      `"${timeStr}"`,
      e.timestamp,
      `"${e.command}"`,
      `"${e.status}"`,
      e.responseTimeMs,
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `krishinethra_esp32_commands_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
