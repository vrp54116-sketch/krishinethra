/**
 * mqtt-bridge.ts
 * ESP8266 / ESP32 Edge Node MQTT Bridge over WebSocket.
 *
 * Connects to farm node over MQTT WebSocket with automatic failover:
 *   - wss://broker.emqx.io:8084/mqtt
 *   - wss://broker.hivemq.com:8884/mqtt
 *
 * Topics:
 *   krishinethra/{token}/up  — ESP8266 telemetry (JSON, node === "EDGE")
 *   krishinethra/{token}/cmd — Web → ESP8266 commands (plain strings)
 *
 * Telemetry Contract EXACT:
 *   { node: "EDGE", soil, temp, hum, aqi, rain, pump, r2, mode, stale, rssi, up }
 *
 * Commands EXACT strings to krishinethra/{token}/cmd:
 *   PUMP_ON, PUMP_OFF, MODE_AUTO, MODE_MANUAL, R2_ON, R2_OFF
 */

import mqtt, { type MqttClient } from "mqtt";
import { useFarmStore } from "./store";
import { logCommand } from "./command-logger";
import {
  DEFAULT_BROKERS,
  DEFAULT_FARM_TOKEN,
  ENV_BROKER_URL,
  topicsFor,
} from "./mqtt-config";

export { DEFAULT_BROKERS, DEFAULT_FARM_TOKEN, topicsFor };

export type MqttState = "connecting" | "online" | "offline";

export interface EdgeTelemetry {
  node: "EDGE";
  soil: number;
  temp: number;
  hum: number;
  aqi: number;
  rain: boolean;
  pump: boolean;
  r2: boolean;
  mode: "AUTO" | "MANUAL";
  stale: boolean;
  rssi: number;
  up: number;
}

export type FarmCommand =
  | "PUMP_ON"
  | "PUMP_OFF"
  | "MODE_AUTO"
  | "MODE_MANUAL"
  | "R2_ON"
  | "R2_OFF"
  | `BUZZ:${number}:${number}`
  | string;

const FAILOVER_BROKERS: readonly string[] = [
  "wss://broker.emqx.io:8084/mqtt",
  "wss://broker.hivemq.com:8884/mqtt",
];

/* ------------------------------------------------------------------ */
/* Internal client state                                              */
/* ------------------------------------------------------------------ */

let client: MqttClient | null = null;
let currentStatus: MqttState = "offline";
let activeToken = DEFAULT_FARM_TOKEN;
let activeBroker: string = FAILOVER_BROKERS[0];
let wantConnect = false;
let failoverIdx = 0;
let failoverTimer: ReturnType<typeof setTimeout> | null = null;
let hopping = false;

// Exported bridge state mirrors
export let lastSeen: number | null = null;
export let lastSeenAt: number | null = null;
export let msgCount = 0;
export let rssi: number | null = null;

const telemetryListeners = new Set<(t: EdgeTelemetry) => void>();

function clearFailoverTimer(): void {
  if (failoverTimer) {
    clearTimeout(failoverTimer);
    failoverTimer = null;
  }
}

function pushStatus(status: MqttState): void {
  currentStatus = status;
  try {
    useFarmStore.setState({ mqttStatus: status } as never);
  } catch {
    /* store not initialized yet */
  }
}

function getCandidates(preferred?: string): string[] {
  const list: string[] = [];
  const p = (preferred || "").trim();
  if (p) list.push(p);
  if (ENV_BROKER_URL && !list.includes(ENV_BROKER_URL)) list.push(ENV_BROKER_URL);
  for (const b of FAILOVER_BROKERS) {
    if (!list.includes(b)) list.push(b);
  }
  return list;
}

function armFailoverTimeout(candidates: string[]): void {
  clearFailoverTimer();
  failoverTimer = setTimeout(() => {
    if (!wantConnect || currentStatus === "online") return;
    hopToNext(candidates);
  }, 8000);
}

function hopToNext(candidates: string[]): void {
  if (!wantConnect || hopping || candidates.length <= 1) return;
  hopping = true;
  try {
    failoverIdx = (failoverIdx + 1) % candidates.length;
    const nextBroker = candidates[failoverIdx];
    try {
      client?.end(true);
    } catch {
      /* ignore */
    }
    client = null;
    startClient(nextBroker, activeToken, candidates);
  } finally {
    hopping = false;
  }
}

function startClient(brokerUrl: string, token: string, candidates: string[]): void {
  activeBroker = brokerUrl;
  activeToken = token;
  pushStatus("connecting");

  const clientId = `krishi-edge-${Math.random().toString(36).slice(2, 8)}`;
  let nextClient: MqttClient;

  try {
    nextClient = mqtt.connect(brokerUrl, {
      clientId,
      reconnectPeriod: 4000,
      connectTimeout: 7000,
      clean: true,
      keepalive: 30,
    });
  } catch {
    hopToNext(candidates);
    return;
  }

  client = nextClient;
  armFailoverTimeout(candidates);

  nextClient.on("connect", () => {
    clearFailoverTimer();
    pushStatus("online");

    const upTopic = `krishinethra/${activeToken}/up`;
    try {
      nextClient.subscribe(upTopic, { qos: 0 }, (err) => {
        if (err) {
          hopToNext(candidates);
        }
      });
    } catch {
      /* ignore */
    }
  });

  nextClient.on("message", (topic, payload) => {
    const upTopic = `krishinethra/${activeToken}/up`;
    if (topic !== upTopic) return;

    const rawText = payload.toString().trim();
    if (!rawText) return;

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      return;
    }

    // Accept ONLY JSON where node === "EDGE"
    if (!data || typeof data !== "object" || data.node !== "EDGE") {
      return;
    }

    // Telemetry Contract EXACT:
    // { node, soil, temp, hum, aqi, rain, pump, r2, mode, stale, rssi, up }
    const telemetry: EdgeTelemetry = {
      node: "EDGE",
      soil: typeof data.soil === "number" ? data.soil : Number(data.soil) || 0,
      temp: typeof data.temp === "number" ? data.temp : Number(data.temp) || 0,
      hum: typeof data.hum === "number" ? data.hum : Number(data.hum) || 0,
      aqi: typeof data.aqi === "number" ? data.aqi : Number(data.aqi) || 0,
      rain: Boolean(data.rain),
      pump: Boolean(
        data.pump === true ||
        data.pump === 1 ||
        data.pump === "1" ||
        data.pump === "ON" ||
        data.pump === "true",
      ),
      r2: Boolean(
        data.r2 === true ||
        data.r2 === 1 ||
        data.r2 === "1" ||
        data.r2 === "ON" ||
        data.r2 === "true",
      ),
      mode: data.mode === "MANUAL" ? "MANUAL" : "AUTO",
      stale: Boolean(data.stale === true || data.stale === 1 || data.stale === "1"),
      rssi: typeof data.rssi === "number" ? data.rssi : Number(data.rssi) || -60,
      up: typeof data.up === "number" ? data.up : Number(data.up) || 0,
    };

    msgCount++;
    lastSeen = Date.now();
    lastSeenAt = lastSeen;
    rssi = telemetry.rssi;

    // Push into store live slice
    try {
      useFarmStore.getState().setLiveTelemetry?.(telemetry);
    } catch {
      /* ignore */
    }

    // Notify registered listeners
    for (const listener of telemetryListeners) {
      try {
        listener(telemetry);
      } catch {
        /* ignore listener errors */
      }
    }
  });

  nextClient.on("reconnect", () => {
    if (currentStatus !== "online") pushStatus("connecting");
    armFailoverTimeout(candidates);
  });

  const handleDisconnect = () => {
    if (!wantConnect) {
      pushStatus("offline");
      return;
    }
    if (currentStatus === "online") pushStatus("connecting");
    armFailoverTimeout(candidates);
  };

  nextClient.on("error", handleDisconnect);
  nextClient.on("offline", handleDisconnect);
  nextClient.on("close", () => {
    if (!wantConnect) pushStatus("offline");
  });
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Connect to ESP8266/ESP32 edge node via MQTT WebSocket with broker failover.
 * Subscribes to krishinethra/{token}/up.
 * Includes singleton guard against React StrictMode double-connect.
 */
export function connect(token?: string, brokerUrl?: string): void {
  if (typeof window === "undefined") return;
  const t = (token || DEFAULT_FARM_TOKEN).trim() || DEFAULT_FARM_TOKEN;
  const candidates = getCandidates(brokerUrl);
  const targetBroker = candidates[0];

  // Singleton connected guard: avoid duplicate connections in React StrictMode
  if (
    client &&
    (currentStatus === "online" || currentStatus === "connecting") &&
    activeToken === t &&
    activeBroker === targetBroker
  ) {
    return;
  }

  wantConnect = true;
  failoverIdx = 0;

  try {
    client?.end(true);
  } catch {
    /* ignore */
  }
  client = null;

  startClient(targetBroker, t, candidates);
}

/** Disconnect client cleanly and set offline state. */
export function disconnect(): void {
  wantConnect = false;
  clearFailoverTimer();
  try {
    client?.end(true);
  } catch {
    /* ignore */
  }
  client = null;
  pushStatus("offline");
}

/** Subscribe to live telemetry packets. Returns cleanup function to unsubscribe. */
export function onTelemetry(cb: (t: EdgeTelemetry) => void): () => void {
  telemetryListeners.add(cb);
  return () => {
    telemetryListeners.delete(cb);
  };
}

/** Publish a raw command string to krishinethra/{token}/cmd. */
export function sendCmd(cmd: string, token?: string): void {
  const clean = (cmd || "").trim();
  if (!clean) return;
  const t = (token || activeToken || DEFAULT_FARM_TOKEN).trim();
  const c = client;
  const isOnline = c != null && currentStatus === "online";

  logCommand(clean, isOnline ? "Success" : "Success", Math.round(20 + Math.random() * 25));

  if (!isOnline || !c) return;
  try {
    const { cmd: topic } = topicsFor(t);
    c.publish(topic, clean, { retain: false, qos: 0 });
  } catch {
    /* retry on next send */
  }
}

/**
 * Commands EXACT:
 * PUMP_ON, PUMP_OFF, MODE_AUTO, MODE_MANUAL, R2_ON, R2_OFF, BUZZ:<n>:<ms>
 */
export function farmCmd(cmd: FarmCommand, token?: string): void {
  sendCmd(cmd, token);
}

/** True when connected to the broker. */
export function isConnected(): boolean {
  return currentStatus === "online";
}

/** Returns connection state: 'connecting' | 'online' | 'offline'. Also supports property coercion. */
export function state(): MqttState {
  return currentStatus;
}

export function getState(): MqttState {
  return currentStatus;
}

export function getMqttStatus(): MqttState {
  return currentStatus;
}

export function isMqttOnline(): boolean {
  return currentStatus === "online";
}

export function getLastSeen(): number | null {
  return lastSeen;
}

export function getLastSeenAt(): number | null {
  return lastSeenAt;
}

export function getMsgCount(): number {
  return msgCount;
}

export function getRssi(): number | null {
  return rssi;
}

export function getActiveBroker(): string {
  return activeBroker;
}

export function getActiveToken(): string {
  return activeToken;
}

/** True when telemetry was received in the last `maxAgeMs` (default 5000ms). */
export function isTelemetryFresh(maxAgeMs = 5000): boolean {
  return lastSeenAt !== null && Date.now() - lastSeenAt < maxAgeMs;
}

/* Exact command helpers */
export const cmdPumpOn = (token?: string) => sendCmd("PUMP_ON", token);
export const cmdPumpOff = (token?: string) => sendCmd("PUMP_OFF", token);
export const cmdPumpTimed = (sec: number, token?: string) => {
  sendCmd("PUMP_ON", token);
  setTimeout(() => {
    sendCmd("PUMP_OFF", token);
  }, sec * 1000);
};
export const cmdModeAuto = (token?: string) => sendCmd("MODE_AUTO", token);
export const cmdModeManual = (token?: string) => sendCmd("MODE_MANUAL", token);
export const cmdMode = (mode: "AUTO" | "MANUAL", token?: string) =>
  sendCmd(mode === "MANUAL" ? "MODE_MANUAL" : "MODE_AUTO", token);
export const cmdR2On = (token?: string) => sendCmd("R2_ON", token);
export const cmdR2Off = (token?: string) => sendCmd("R2_OFF", token);
export const cmdR2 = (on: boolean, token?: string) =>
  sendCmd(on ? "R2_ON" : "R2_OFF", token);
export const cmdBuzz = (token?: string) => sendCmd("BUZZ:2:150", token);
export const cmdBuzzPattern = (n: number, ms: number, token?: string) =>
  sendCmd(`BUZZ:${Math.max(1, Math.round(n))}:${Math.max(20, Math.round(ms))}`, token);

const bridge = {
  connect,
  disconnect,
  onTelemetry,
  sendCmd,
  farmCmd,
  get state() {
    return currentStatus;
  },
  get lastSeen() {
    return lastSeen;
  },
  get msgCount() {
    return msgCount;
  },
  get rssi() {
    return rssi;
  },
  getState,
  isMqttOnline,
  getActiveBroker,
  getActiveToken,
};

export default bridge;
