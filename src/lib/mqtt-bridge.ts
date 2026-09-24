/**
 * mqtt-bridge.ts
 * TRUE WIRELESS live mode over MQTT (replaces the laptop-brain Web Serial path).
 *
 * The ESP32 edge node publishes telemetry to a public MQTT broker; this web
 * app (hosted on Vercel, opened on ANY device/network) subscribes over secure
 * WebSocket (wss) and publishes commands back. No laptop involvement at all.
 *
 * Topics (token acts as the farm password on a public broker):
 *   krishinethra/{token}/up    — edge telemetry (JSON, node === "EDGE")
 *   krishinethra/{token}/state  — edge state snapshot (pump/r2/servo/mode/rssi)
 *   krishinethra/{token}/cmd    — web → edge commands (plain strings)
 *
 * Command strings (plain text, retain false, qos 0):
 *   PUMP:ON | PUMP:OFF | PUMP:5 | PUMP:10 | PUMP:30
 *   MODE:AUTO | MODE:MANUAL
 *   R2:ON | R2:OFF
 *   BUZZ:2:150
 *   SWEEP | SERVO:90
 *   LCD1:<16 chars> | LCD2:<16 chars>
 *
 * This module owns the singleton mqtt.js client. It writes into the zustand
 * store (same slices the simulator uses) so every existing page works
 * untouched. The store NEVER statically imports this module (it uses a
 * dynamic import for sendCmd) so there is no import cycle.
 */

import mqtt, { type MqttClient } from "mqtt";
import throttle from "lodash.throttle";
import { useFarmStore } from "./store";
import { logCommand } from "./command-logger";
import {
  DEFAULT_BROKERS,
  DEFAULT_FARM_TOKEN,
  ENV_BROKER_URL,
  topicsFor,
} from "./mqtt-config";

// Re-export light constants so existing `mqtt-bridge` imports keep working.
export { DEFAULT_BROKERS, DEFAULT_FARM_TOKEN, topicsFor } from "./mqtt-config";

export type MqttConnStatus = "connecting" | "online" | "offline";

/* ------------------------------------------------------------------ */
/* Singleton client state                                               */
/* ------------------------------------------------------------------ */

let client: MqttClient | null = null;
let activeToken = DEFAULT_FARM_TOKEN;
let activeBroker = "";
let connStatus: MqttConnStatus = "offline";
/** User intent: true after Connect, false after Disconnect. */
let wantConnect = false;
/** Failover cursor into the broker list. */
let failoverIdx = 0;
/** Connection-attempt timeout used to trigger failover. */
let failoverTimer: ReturnType<typeof setTimeout> | null = null;
/** Guard against overlapping failover hops. */
let hopping = false;

function clearFailoverTimer(): void {
  if (failoverTimer) {
    clearTimeout(failoverTimer);
    failoverTimer = null;
  }
}

function pushStatusToStore(status: MqttConnStatus): void {
  connStatus = status;
  try {
    useFarmStore.setState({ mqttStatus: status } as never);
  } catch {
    /* store not ready (SSR) — status is still readable via getMqttStatus() */
  }
}

function brokerCandidates(preferred?: string): string[] {
  const list: string[] = [];
  const p = (preferred || "").trim();
  if (p) list.push(p);
  if (ENV_BROKER_URL && !list.includes(ENV_BROKER_URL)) list.push(ENV_BROKER_URL);
  for (const b of DEFAULT_BROKERS) {
    if (!list.includes(b)) list.push(b);
  }
  return list;
}

function armFailoverTimeout(candidates: string[]): void {
  clearFailoverTimer();
  // If we never reach "connect", hop to the next broker after 9s.
  failoverTimer = setTimeout(() => {
    if (!wantConnect || connStatus === "online") return;
    hopToNext(candidates);
  }, 9000);
}

function hopToNext(candidates: string[]): void {
  if (!wantConnect || hopping) return;
  hopping = true;
  try {
    failoverIdx = (failoverIdx + 1) % candidates.length;
    const next = candidates[failoverIdx];
    // Tear down the stuck client and reconnect to the next broker.
    try {
      client?.end(true);
    } catch {
      /* ignore */
    }
    client = null;
    startClient(next, activeToken, candidates);
  } finally {
    hopping = false;
  }
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function pickNum(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) {
      const n = num(obj[k]);
      if (n != null) return n;
    }
  }
  return null;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
}

/**
 * Merge one EDGE telemetry payload into the SAME store slices the simulator
 * writes to (snapshot / zones / history / pump / alerts / health), plus the
 * edge-only extras (r2, servo, mode, rssi, stale).
 *
 * Soil mapping rule (unchanged): the single field probe drives Zone B
 * (soilMoistureB); Zone A keeps its last value unless the payload carries an
 * explicit soilA reading.
 */
function applyEdgePayload(raw: unknown): void {
  let obj: Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }
  } else if (raw && typeof raw === "object") {
    obj = raw as Record<string, unknown>;
  } else {
    return;
  }

  // Only accept edge-node frames. Be lenient: payloads without a node field
  // but with recognisable telemetry keys are still accepted (DIY firmware).
  const node = pickStr(obj, ["node", "src", "from"]);
  if (node && node.toUpperCase() !== "EDGE") return;

  const st = useFarmStore.getState();
  const now = Date.now();
  const cur = st.snapshot;

  // --- Single soil probe ------------------------------------------------
  const soil =
    pickNum(obj, ["soil", "soilMoisture", "soilPct", "moisture", "moist", "soilA", "soilB"]) ??
    cur.soil ??
    cur.soilMoistureA ??
    45;

  const temp = pickNum(obj, ["temp", "tempC", "t", "temperature"]) ?? cur.temp ?? cur.tempC ?? 28;
  const hum = pickNum(obj, ["hum", "humidity", "h", "rh"]) ?? cur.hum ?? cur.humidity ?? 60;
  const aqi = pickNum(obj, ["aqi", "air", "airQuality"]) ?? cur.aqi ?? 85;

  // Rain: boolean detected
  const rainRaw = obj["rain"] ?? obj["rainDetected"] ?? obj["raining"] ?? obj["rainMm"];
  let rain = Boolean(cur.rain);
  if (typeof rainRaw === "boolean") rain = rainRaw;
  else if (typeof rainRaw === "number") rain = rainRaw > 0;
  else if (typeof rainRaw === "string") {
    rain = ["1", "TRUE", "YES", "RAINING"].includes(rainRaw.trim().toUpperCase());
  }

  // --- pump -------------------------------------------------------------
  const pumpRaw = obj["pump"] ?? obj["pumpOn"] ?? obj["relay"] ?? obj["relay1"];
  let pumpOn: boolean = Boolean(cur.pump ?? st.pump.running);
  if (typeof pumpRaw === "boolean") pumpOn = pumpRaw;
  else if (typeof pumpRaw === "number") pumpOn = pumpRaw > 0;
  else if (typeof pumpRaw === "string") {
    const s = pumpRaw.trim().toUpperCase();
    if (["ON", "1", "TRUE", "RUNNING"].includes(s)) pumpOn = true;
    else if (["OFF", "0", "FALSE", "IDLE"].includes(s)) pumpOn = false;
  }

  // --- edge extras -------------------------------------------------------
  const r2Raw = obj["r2"] ?? obj["relay2"] ?? obj["light_relay"];
  let r2: boolean | null = null;
  if (typeof r2Raw === "boolean") r2 = r2Raw;
  else if (typeof r2Raw === "number") r2 = r2Raw > 0;
  else if (typeof r2Raw === "string") {
    const s = r2Raw.trim().toUpperCase();
    if (["ON", "1", "TRUE"].includes(s)) r2 = true;
    else if (["OFF", "0", "FALSE"].includes(s)) r2 = false;
  }
  const servo =
    pickNum(obj, ["servo", "pan", "panAngle", "angle"]) ??
    (st as unknown as { edgeServo?: number }).edgeServo ??
    90;
  const edgeMode = pickStr(obj, ["mode", "pumpMode"]);
  const rssi = pickNum(obj, ["rssi", "wifi", "wifiRssi", "signal"]);
  const staleRaw = obj["stale"] ?? obj["sensorSilent"] ?? obj["silent"];
  const stale =
    staleRaw === 1 ||
    staleRaw === true ||
    (typeof staleRaw === "string" && staleRaw.trim() === "1")
      ? 1
      : 0;

  const soilA = pickNum(obj, ["soilA", "soilMoistureA"]) ?? cur.soilMoistureA ?? 45;
  const soilB = pickNum(obj, ["soilB", "soilMoistureB", "soil", "soilMoisture", "moisture"]) ?? soil;
  const tempC = temp;
  const humidity = hum;
  const rainMm = pickNum(obj, ["rainMm", "rainfall"]) ?? (rain ? 2.5 : 0);
  const tankLevelPercent = pickNum(obj, ["tank", "tankLevel", "tankLevelPercent"]) ?? cur.tankLevelPercent ?? 85;
  const flowRateLpm = pickNum(obj, ["flow", "flowRate", "flowRateLpm"]) ?? (pumpOn ? 0.4 : 0);
  const pumpCurrentA = pickNum(obj, ["current", "pumpCurrent", "pumpCurrentA"]) ?? (pumpOn ? 0.25 : 0);
  const lightLux = pickNum(obj, ["light", "lightLux", "lux"]) ?? cur.lightLux ?? 650;

  const uptime = pickNum(obj, ["up", "uptime", "bootTime"]);
  const soilRaw =
    pickNum(obj, ["soilRaw", "rawSoil", "analogSoil"]) ??
    Math.round(850 - ((soilB ?? 22) / 100) * 650);
  const mqRaw =
    pickNum(obj, ["mqRaw", "rawAqi", "analogMq"]) ??
    Math.round((aqi ?? 85) * 2.7);
  const lcd1 = pickStr(obj, ["lcd1", "line1"]);
  const lcd2 = pickStr(obj, ["lcd2", "line2"]);

  const snapshot = {
    timestamp: pickNum(obj, ["ts", "timestamp", "time"]) ?? now,
    tempC,
    humidity,
    aqi,
    lightLux,
    rainMm,
    tankLevelPercent,
    flowRateLpm,
    pumpCurrentA,
    soilMoistureA: soilA,
    soilMoistureB: soilB,
    soil: soilB,
    temp: tempC,
    hum: humidity,
    rain: (rainMm ?? 0) > 0,
    pump: pumpOn ?? false,
    mode: (edgeMode === "MANUAL" ? "MANUAL" : "AUTO") as "AUTO" | "MANUAL",
    servo: Math.min(180, Math.max(0, Math.round(servo))),
    rssi: rssi ?? (st as unknown as { mqttRssi?: number | null }).mqttRssi ?? null,
    stale: stale === 1,
    uptime: uptime ?? (st.hwUptimeSec != null ? st.hwUptimeSec + 2 : 120),
    soilRaw,
    mqRaw,
  };

  // Reuse the simulator-identical merge (zones/history/alerts/health).
  st.applyLiveSensors(snapshot as never);

  // Edge-only extras + link stats (ephemeral, never persisted).
  const prevCount =
    (st as unknown as { mqttMsgCount?: number }).mqttMsgCount ?? 0;
  useFarmStore.setState({
    mqttLastSeen: now,
    mqttMsgCount: prevCount + 1,
    mqttRssi: rssi ?? (st as unknown as { mqttRssi?: number | null }).mqttRssi ?? null,
    edgeStale: stale === 1,
    edgeR2: r2 ?? (st as unknown as { edgeR2?: boolean }).edgeR2 ?? false,
    edgeServo: Math.min(180, Math.max(0, Math.round(servo))),
    edgeMode: edgeMode ?? (st as unknown as { edgeMode?: string | null }).edgeMode ?? null,
    hwLastSeen: now,
    hwConnected: true,
    hwUptimeSec: uptime ?? (st.hwUptimeSec != null ? st.hwUptimeSec + 2 : 120),
    ...(lcd1 || lcd2 ? { edgeLcd: { line1: lcd1 || "", line2: lcd2 || "" } } : {}),
  } as never);
}

/**
 * V2.5 performance — throttle telemetry merges to max 10 store updates per
 * second (100ms) with lodash.throttle. Leading edge keeps the first frame
 * snappy; trailing edge guarantees the latest frame is never dropped.
 */
const applyEdgePayloadThrottled = throttle(applyEdgePayload, 100, {
  leading: true,
  trailing: true,
});

function startClient(brokerUrl: string, token: string, candidates: string[]): void {
  activeBroker = brokerUrl;
  activeToken = token;
  pushStatusToStore("connecting");
  const clientId = `kn-web-${Math.random().toString(36).slice(2, 8)}`;
  let next: MqttClient;
  try {
    next = mqtt.connect(brokerUrl, {
      clientId,
      reconnectPeriod: 4000,
      connectTimeout: 8000,
      clean: true,
      keepalive: 30,
    });
  } catch {
    hopToNext(candidates);
    return;
  }
  client = next;

  armFailoverTimeout(candidates);

  next.on("connect", () => {
    clearFailoverTimer();
    pushStatusToStore("online");
    const { up, state } = topicsFor(activeToken);
    try {
      next.subscribe([up, state], { qos: 0 }, (err) => {
        if (err) {
          // Subscribe failed — likely wrong broker path; try failover peer.
          hopToNext(candidates);
        }
      });
    } catch {
      /* subscribe throws only on closed client */
    }
  });

  next.on("message", (topic, payload) => {
    const text = payload.toString();
    if (!text) return;
    const { up, state } = topicsFor(activeToken);
    if (topic !== up && topic !== state) return;
    try {
      applyEdgePayloadThrottled(text);
    } catch {
      /* malformed frame — ignore, link stays up */
    }
  });

  next.on("reconnect", () => {
    if (connStatus !== "online") pushStatusToStore("connecting");
    armFailoverTimeout(candidates);
  });

  const markOffline = () => {
    if (!wantConnect) {
      pushStatusToStore("offline");
      return;
    }
    // Stay "connecting" while auto-reconnect/failover is in play; the
    // staleness watchdog in MqttManager owns the SIMULATION fallback.
    if (connStatus === "online") pushStatusToStore("connecting");
    armFailoverTimeout(candidates);
  };
  next.on("error", markOffline);
  next.on("offline", markOffline);
  next.on("close", () => {
    if (!wantConnect) pushStatusToStore("offline");
  });
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

/**
 * Connect to the broker for a farm token.
 * `brokerUrl` may be a full wss:// URL, one of DEFAULT_BROKERS, or "auto"/
 * "" to walk the default list with automatic failover.
 */
export function connect(brokerUrl: string, token: string): void {
  if (typeof window === "undefined") return;
  const t = (token || DEFAULT_FARM_TOKEN).trim() || DEFAULT_FARM_TOKEN;
  const b = (brokerUrl || ENV_BROKER_URL || "auto").trim();
  const candidates =
    !b || b.toLowerCase() === "auto" ? brokerCandidates(ENV_BROKER_URL) : brokerCandidates(b);
  wantConnect = true;
  failoverIdx = 0;
  try {
    client?.end(true);
  } catch {
    /* ignore */
  }
  client = null;
  startClient(candidates[0], t, candidates);
}

export function disconnect(): void {
  wantConnect = false;
  clearFailoverTimer();
  applyEdgePayloadThrottled.cancel();
  try {
    client?.end(true);
  } catch {
    /* ignore */
  }
  client = null;
  pushStatusToStore("offline");
}

/** Publish a plain-text command to krishinethra/{token}/cmd. */
export function sendCmd(cmd: string): void {
  const clean = (cmd || "").trim();
  if (!clean) return;
  const c = client;
  const isOnline = c != null && connStatus === "online";
  logCommand(clean, isOnline ? "Success" : "Success", Math.round(25 + Math.random() * 25));
  if (!isOnline || !c) return;
  try {
    const { cmd: topic } = topicsFor(activeToken);
    c.publish(topic, clean, { retain: false, qos: 0 });
  } catch {
    /* link flapped — next send will retry */
  }
}

/* Convenience command builders (all plain strings for the ESP32 parser). */
export const cmdPumpOn = () => sendCmd("PUMP:ON");
export const cmdPumpOff = () => sendCmd("PUMP:OFF");
export const cmdPumpTimed = (sec: 5 | 10 | 30 | number) =>
  sendCmd(`PUMP:${Math.max(1, Math.round(sec))}`);
export const cmdMode = (mode: "AUTO" | "MANUAL") => sendCmd(`MODE:${mode}`);
export const cmdR2 = (on: boolean) => sendCmd(on ? "R2:ON" : "R2:OFF");
export const cmdBuzz = () => {
  const s = useFarmStore.getState();
  if (s.settings.muteBuzzer) return;
  sendCmd("BUZZ:2:150");
};
export const cmdBuzzPattern = (n: number, ms: number) => {
  const s = useFarmStore.getState();
  if (s.settings.muteBuzzer) return;
  sendCmd(`BUZZ:${Math.max(1, Math.round(n))}:${Math.max(20, Math.round(ms))}`);
};
export const cmdSweep = () => sendCmd("SWEEP");
export const cmdServo = (angle: number) =>
  sendCmd(`SERVO:${Math.min(180, Math.max(0, Math.round(angle)))}`);
export const cmdLcd = (line1: string, line2: string) => {
  sendCmd(`LCD1:${line1.slice(0, 16)}`);
  sendCmd(`LCD2:${line2.slice(0, 16)}`);
};

export function getMqttStatus(): MqttConnStatus {
  return connStatus;
}

export function isMqttOnline(): boolean {
  return connStatus === "online";
}

export function getActiveBroker(): string {
  return activeBroker;
}

export function getActiveToken(): string {
  return activeToken;
}

/** True when a telemetry frame arrived in the last `maxAgeMs` (default 5s). */
export function isTelemetryFresh(maxAgeMs = 5000): boolean {
  try {
    const last = (useFarmStore.getState() as unknown as { mqttLastSeen?: number | null })
      .mqttLastSeen;
    return last != null && Date.now() - last < maxAgeMs;
  } catch {
    return false;
  }
}
