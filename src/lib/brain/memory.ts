/**
 * src/lib/brain/memory.ts
 * Farm Memory — 90-day private on-device diary in IndexedDB (database: kn_farm).
 *
 * Object stores:
 *  - telemetry (keyPath: "ts")
 *    Rows: { ts, soil, temp, hum, aqi, rain, pump, mode, source }
 *  - events (keyPath: "id", autoIncrement: true)
 *    Rows: { id, ts, type, payload }
 *    where type in pump_on | pump_off | scan | alert | command | chat | feedback | brain_train
 *
 * Retention: 90 days (auto-pruned on write).
 */

export type TelemetryRow = {
  ts: number;
  soil: number;
  temp: number;
  hum: number;
  aqi: number;
  rain: boolean;
  pump: boolean;
  mode: string;
  source: string;
};

export type EventType =
  | "pump_on"
  | "pump_off"
  | "scan"
  | "alert"
  | "command"
  | "chat"
  | "feedback"
  | "brain_train";

export type EventRow = {
  id?: number;
  ts: number;
  type: EventType;
  payload: unknown;
};

export interface MemoryStats {
  rows: number;
  days: number;
  firstTs: number | null;
  lastTs: number | null;
  eventsByType: Record<EventType, number>;
  eventsCount: number;
}

const DB_NAME = "kn_farm";
const DB_VERSION = 1;
const STORE_TELEMETRY = "telemetry";
const STORE_EVENTS = "events";
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days in ms
const TELEMETRY_THROTTLE_MS = 60 * 1000; // 1 minute throttle
const PRUNE_THROTTLE_MS = 60 * 1000; // at most 1 prune check per minute on write

let dbPromise: Promise<IDBDatabase | null> | null = null;
let lastTelemetryWriteTs = 0;
let lastPruneTs = 0;

// In-memory cache for fast synchronous citation() access & server fallback
let cachedCitation = { days: 0, rows: 0 };

function getIndexedDB(): IDBFactory | null {
  if (typeof window !== "undefined" && typeof window.indexedDB !== "undefined") {
    return window.indexedDB;
  }
  if (typeof indexedDB !== "undefined") {
    return indexedDB;
  }
  return null;
}

function getKeyRange(): typeof IDBKeyRange | null {
  if (typeof window !== "undefined" && typeof window.IDBKeyRange !== "undefined") {
    return window.IDBKeyRange;
  }
  if (typeof IDBKeyRange !== "undefined") {
    return IDBKeyRange;
  }
  return null;
}

function isIndexedDBAvailable(): boolean {
  return getIndexedDB() !== null;
}

function notifyMemoryUpdated(): void {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("kn-memory-updated"));
    } catch {
      // ignore
    }
  }
}

/**
 * Open (or return cached) connection to kn_farm IndexedDB database.
 */
export function openDB(): Promise<IDBDatabase | null> {
  const idb = getIndexedDB();
  if (!idb) {
    return Promise.resolve(null);
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase | null>((resolve, reject) => {
    try {
      const request = idb.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_TELEMETRY)) {
          db.createObjectStore(STORE_TELEMETRY, { keyPath: "ts" });
        }
        if (!db.objectStoreNames.contains(STORE_EVENTS)) {
          const eventsStore = db.createObjectStore(STORE_EVENTS, {
            keyPath: "id",
            autoIncrement: true,
          });
          eventsStore.createIndex("ts", "ts", { unique: false });
          eventsStore.createIndex("type", "type", { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onclose = () => {
          dbPromise = null;
        };
        db.onerror = () => {
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    } catch (err) {
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Prune telemetry and events older than 90 days.
 */
export async function prune(olderThanMs = RETENTION_MS): Promise<{
  deletedTelemetry: number;
  deletedEvents: number;
}> {
  const db = await openDB();
  if (!db) return { deletedTelemetry: 0, deletedEvents: 0 };

  const cutoff = Date.now() - olderThanMs;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_TELEMETRY, STORE_EVENTS], "readwrite");
      const telemetryStore = tx.objectStore(STORE_TELEMETRY);
      const eventsStore = tx.objectStore(STORE_EVENTS);

      let deletedTelemetry = 0;
      let deletedEvents = 0;

      const KeyRange = getKeyRange();

      // Telemetry keyPath is ts, so IDBKeyRange on primary key deletes in one call
      try {
        if (KeyRange) {
          const range = KeyRange.upperBound(cutoff, true);
          const req = telemetryStore.delete(range);
          req.onsuccess = () => {
            deletedTelemetry = 1; // IDB delete doesn't return count, non-zero indicator
          };
        }
      } catch {
        // Fallback to cursor delete
        if (KeyRange) {
          const cursorReq = telemetryStore.openCursor(KeyRange.upperBound(cutoff, true));
          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (cursor) {
              cursor.delete();
              deletedTelemetry++;
              cursor.continue();
            }
          };
        }
      }

      // Events store cursor prune via ts index or primary scan
      try {
        if (eventsStore.indexNames.contains("ts") && KeyRange) {
          const tsIndex = eventsStore.index("ts");
          const cursorReq = tsIndex.openCursor(KeyRange.upperBound(cutoff, true));
          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (cursor) {
              cursor.delete();
              deletedEvents++;
              cursor.continue();
            }
          };
        } else {
          const cursorReq = eventsStore.openCursor();
          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (cursor) {
              const row = cursor.value as EventRow;
              if (row && typeof row.ts === "number" && row.ts < cutoff) {
                cursor.delete();
                deletedEvents++;
              }
              cursor.continue();
            }
          };
        }
      } catch {
        // ignore
      }

      tx.oncomplete = () => {
        resolve({ deletedTelemetry, deletedEvents });
      };
      tx.onerror = () => {
        resolve({ deletedTelemetry: 0, deletedEvents: 0 });
      };
    } catch {
      resolve({ deletedTelemetry: 0, deletedEvents: 0 });
    }
  });
}

/**
 * Log one telemetry row, throttled to 1 row per minute (both LIVE and SIM).
 * Prunes data older than 90 days on write.
 */
export async function logTelemetry(
  data: {
    ts?: number;
    soil: number;
    temp: number;
    hum: number;
    aqi: number;
    rain: boolean;
    pump: boolean;
    mode: string;
    source: string;
  },
  force = false,
): Promise<boolean> {
  const now = data.ts ?? Date.now();

  // Throttle: at most one row per minute unless force = true
  if (!force && lastTelemetryWriteTs > 0 && now - lastTelemetryWriteTs < TELEMETRY_THROTTLE_MS) {
    return false;
  }

  const db = await openDB();
  if (!db) return false;

  const row: TelemetryRow = {
    ts: now,
    soil: Math.round(data.soil * 10) / 10,
    temp: Math.round(data.temp * 10) / 10,
    hum: Math.round(data.hum * 10) / 10,
    aqi: Math.round(data.aqi),
    rain: Boolean(data.rain),
    pump: Boolean(data.pump),
    mode: String(data.mode || "AUTO").toUpperCase(),
    source: String(data.source || "SIM").toUpperCase(),
  };

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_TELEMETRY], "readwrite");
      const store = tx.objectStore(STORE_TELEMETRY);
      store.put(row);

      tx.oncomplete = () => {
        lastTelemetryWriteTs = now;
        cachedCitation.rows++;
        if (cachedCitation.days === 0) cachedCitation.days = 1;

        // Auto-prune on write (throttled to at most once per minute)
        if (now - lastPruneTs >= PRUNE_THROTTLE_MS) {
          lastPruneTs = now;
          void prune();
        }

        notifyMemoryUpdated();
        resolve(true);
      };

      tx.onerror = () => {
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
}

/**
 * Log an event to kn_farm events store:
 * type in pump_on | pump_off | scan | alert | command | chat | feedback | brain_train
 * Prunes data older than 90 days on write.
 */
export async function logEvent(event: {
  type: EventType;
  payload?: unknown;
  ts?: number;
}): Promise<void> {
  const db = await openDB();
  if (!db) return;

  const now = event.ts ?? Date.now();
  const row: EventRow = {
    ts: now,
    type: event.type,
    payload: event.payload ?? {},
  };

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_EVENTS], "readwrite");
      const store = tx.objectStore(STORE_EVENTS);
      store.add(row);

      tx.oncomplete = () => {
        if (now - lastPruneTs >= PRUNE_THROTTLE_MS) {
          lastPruneTs = now;
          void prune();
        }
        notifyMemoryUpdated();
        resolve();
      };

      tx.onerror = () => {
        resolve();
      };
    } catch {
      resolve();
    }
  });
}

/**
 * Count rows in telemetry or events.
 * If called with count(), returns count of telemetry rows.
 */
export async function count(storeName: "telemetry" | "events" = "telemetry"): Promise<number> {
  const db = await openDB();
  if (!db) return 0;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([storeName], "readonly");
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result ?? 0);
      req.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

/**
 * Fetch telemetry rows where ts >= since (ascending order).
 */
export async function range(since: number): Promise<TelemetryRow[]> {
  const db = await openDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_TELEMETRY], "readonly");
      const store = tx.objectStore(STORE_TELEMETRY);
      const KeyRange = getKeyRange();
      const keyRange = KeyRange && since > 0 ? KeyRange.lowerBound(since) : null;
      const req = store.openCursor(keyRange);
      const rows: TelemetryRow[] = [];

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          rows.push(cursor.value as TelemetryRow);
          cursor.continue();
        } else {
          resolve(rows);
        }
      };

      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

/**
 * Fetch telemetry rows from the last N days.
 */
export async function lastNDays(n: number): Promise<TelemetryRow[]> {
  const since = Date.now() - Math.max(0, n) * 24 * 60 * 60 * 1000;
  return range(since);
}

/**
 * Full farm memory stats: rows, days, firstTs, lastTs, eventsByType.
 */
export async function stats(): Promise<MemoryStats> {
  const defaultStats: MemoryStats = {
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
  };

  const db = await openDB();
  if (!db) return defaultStats;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_TELEMETRY, STORE_EVENTS], "readonly");
      const telemetryStore = tx.objectStore(STORE_TELEMETRY);
      const eventsStore = tx.objectStore(STORE_EVENTS);

      let rows = 0;
      let firstTs: number | null = null;
      let lastTs: number | null = null;

      const eventsByType: Record<EventType, number> = {
        pump_on: 0,
        pump_off: 0,
        scan: 0,
        alert: 0,
        command: 0,
        chat: 0,
        feedback: 0,
        brain_train: 0,
      };
      let eventsCount = 0;

      // Telemetry count and boundary scan
      const countReq = telemetryStore.count();
      countReq.onsuccess = () => {
        rows = countReq.result ?? 0;
      };

      // Get first telemetry row (earliest ts)
      const firstReq = telemetryStore.openCursor(null, "next");
      firstReq.onsuccess = () => {
        if (firstReq.result) {
          firstTs = (firstReq.result.value as TelemetryRow).ts;
        }
      };

      // Get last telemetry row (latest ts)
      const lastReq = telemetryStore.openCursor(null, "prev");
      lastReq.onsuccess = () => {
        if (lastReq.result) {
          lastTs = (lastReq.result.value as TelemetryRow).ts;
        }
      };

      // Scan events to count by type
      const eventsCursorReq = eventsStore.openCursor();
      eventsCursorReq.onsuccess = () => {
        const cursor = eventsCursorReq.result;
        if (cursor) {
          eventsCount++;
          const row = cursor.value as EventRow;
          if (row && row.type && row.type in eventsByType) {
            eventsByType[row.type]++;
          }
          cursor.continue();
        }
      };

      tx.oncomplete = () => {
        let days = 0;
        if (firstTs != null && lastTs != null && lastTs >= firstTs) {
          days = Math.max(1, Math.ceil((lastTs - firstTs) / (24 * 60 * 60 * 1000)));
        } else if (rows > 0) {
          days = 1;
        }

        cachedCitation = { days, rows };

        resolve({
          rows,
          days,
          firstTs,
          lastTs,
          eventsByType,
          eventsCount,
        });
      };

      tx.onerror = () => {
        resolve(defaultStats);
      };
    } catch {
      resolve(defaultStats);
    }
  });
}

/**
 * Citation helper: returns { days, rows }.
 * Used later in every brain message ("based on your last N days, M rows").
 * Supports both `await memory.citation()` and synchronous property access `memory.citation().days`.
 */
export function citation(): Promise<{ days: number; rows: number }> & {
  days: number;
  rows: number;
} {
  const promise = stats().then((s) => ({ days: s.days, rows: s.rows }));
  // Attach cached properties so synchronous callers also get valid numbers
  Object.assign(promise, {
    days: cachedCitation.days,
    rows: cachedCitation.rows,
  });
  return promise as Promise<{ days: number; rows: number }> & {
    days: number;
    rows: number;
  };
}

/**
 * Convenience helper returning citation as a formatted sentence:
 * "based on your last N days, M rows"
 */
export function citationText(): string {
  const c = citation();
  const d = Math.max(1, c.days);
  return `based on your last ${d} days, ${c.rows} rows`;
}

/**
 * Export CSV downloading farm_log.csv with exact header:
 * ts,soil,temp,hum,aqi,rain,pump,mode,source
 */
export async function exportCSV(): Promise<string> {
  const allRows = await range(0);
  const header = "ts,soil,temp,hum,aqi,rain,pump,mode,source";
  const lines = [header];

  for (const r of allRows) {
    lines.push(
      `${r.ts},${r.soil},${r.temp},${r.hum},${r.aqi},${r.rain ? "true" : "false"},${r.pump ? "true" : "false"},${r.mode},${r.source}`,
    );
  }

  const csvContent = lines.join("\n");

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "farm_log.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error("Failed to download farm_log.csv", err);
    }
  }

  return csvContent;
}

/**
 * Clear all memory (both telemetry and events).
 */
export async function clear(): Promise<void> {
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_TELEMETRY, STORE_EVENTS], "readwrite");
      tx.objectStore(STORE_TELEMETRY).clear();
      tx.objectStore(STORE_EVENTS).clear();

      tx.oncomplete = () => {
        lastTelemetryWriteTs = 0;
        cachedCitation = { days: 0, rows: 0 };
        notifyMemoryUpdated();
        resolve();
      };
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Log a brain training event (helper).
 */
export async function logBrainTrain(payload: unknown): Promise<void> {
  return logEvent({ type: "brain_train", payload });
}

const memory = {
  openDB,
  prune,
  logTelemetry,
  logEvent,
  count,
  range,
  lastNDays,
  stats,
  citation,
  citationText,
  exportCSV,
  clear,
  logBrainTrain,
};

if (typeof window !== "undefined") {
  // Prime citation and stats in background on initial client load
  void stats();
}

export default memory;
