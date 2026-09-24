/**
 * mqtt-config — pure constants/helpers shared by the app and mqtt-bridge.
 *
 * Deliberately free of any `mqtt` package import so components can read
 * broker lists/topics without pulling the MQTT client into their bundle.
 */

export const DEFAULT_BROKERS = [
  "wss://broker.emqx.io:8084/mqtt",
  "wss://broker.hivemq.com:8884/mqtt",
] as const;

/** Optional deployment overrides (set in Vercel env / .env.local). */
export const ENV_BROKER_URL =
  process.env.NEXT_PUBLIC_MQTT_BROKER_URL?.trim() || "";
const ENV_MQTT_TOKEN = process.env.NEXT_PUBLIC_MQTT_TOKEN?.trim() || "";

export const DEFAULT_FARM_TOKEN = ENV_MQTT_TOKEN || "patelfarm01";

export function topicsFor(token: string): {
  up: string;
  state: string;
  cmd: string;
} {
  const t = (token || DEFAULT_FARM_TOKEN).trim() || DEFAULT_FARM_TOKEN;
  return {
    up: `krishinethra/${t}/up`,
    state: `krishinethra/${t}/state`,
    cmd: `krishinethra/${t}/cmd`,
  };
}
