/**
 * hw-gateway.ts
 * Server-side helper for the hardware bridge (Next.js API routes only).
 *
 * Resolution order for the gateway base URL:
 *   1. `?gw=` query param (runtime override, e.g. from Settings → gateway URL)
 *   2. `HARDWARE_GATEWAY_URL` server env var
 *   3. (none) → caller falls back to simulation responses
 *
 * Every route returns a normalized envelope and never throws to the client:
 *   { ok: boolean, data: unknown, source: "live" | "simulation" }
 */

export type HwSource = "live" | "simulation";

export interface HwEnvelope {
  ok: boolean;
  data: unknown;
  source: HwSource;
}

const DEFAULT_TIMEOUT_MS = 6000;

export function normalized(
  ok: boolean,
  data: unknown,
  source: HwSource,
): Response {
  const body: HwEnvelope = { ok, data, source };
  // Always HTTP 200 so client pollers never have to catch HTTP errors —
  // reachability is signalled by `ok` + `source` instead.
  return Response.json(body, { status: 200 });
}

/** Strip trailing slashes so `${base}/status` concatenation is safe. */
function cleanBase(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Resolve the gateway base URL for an incoming bridge request.
 * Returns "" when neither `?gw=` nor the env var is set (→ simulation).
 */
export function resolveGatewayUrl(req: Request): string {
  try {
    const u = new URL(req.url);
    const override = (u.searchParams.get("gw") ?? "").trim();
    if (override) return cleanBase(override);
  } catch {
    /* malformed request URL — fall through to env */
  }
  const env = (process.env.HARDWARE_GATEWAY_URL ?? "").trim();
  return env ? cleanBase(env) : "";
}

/** Explicit `?mode=simulation|live` override; null when absent/invalid. */
export function resolveMode(req: Request): "simulation" | "live" | null {
  try {
    const u = new URL(req.url);
    const m = (u.searchParams.get("mode") ?? "").trim().toLowerCase();
    if (m === "simulation" || m === "live") return m;
    return null;
  } catch {
    return null;
  }
}

/**
 * Forward the optional auth header to the gateway.
 * The app sends `X-Farm-Key`; the gateway may enforce it or ignore it.
 */
export function gatewayHeaders(req: Request): Record<string, string> {
  const key =
    req.headers.get("x-farm-key") ?? req.headers.get("X-Farm-Key") ?? "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (key.trim()) headers["X-Farm-Key"] = key.trim();
  return headers;
}

export interface ProxyResult {
  ok: boolean;
  status: number;
  body: unknown;
  error?: string;
}

/** GET/POST passthrough to the gateway with a hard timeout. Never throws. */
export async function proxyGateway(
  base: string,
  path: "/status" | "/sensors" | "/pump" | "/servo",
  init: { method?: string; body?: unknown; headers?: Record<string, string> },
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ProxyResult> {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, {
      method: init.method ?? "GET",
      headers: init.headers ?? { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    let body: unknown = null;
    const text = await res.text().catch(() => "");
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = { raw: text.slice(0, 500) };
      }
    }
    if (res.ok) return { ok: true, status: res.status, body };
    return {
      ok: false,
      status: res.status,
      body,
      error: `Gateway responded with HTTP ${res.status}`,
    };
  } catch (err) {
    const msg =
      err instanceof DOMException && err.name === "TimeoutError"
        ? `Gateway request timed out after ${timeoutMs}ms`
        : err instanceof Error
          ? err.message
          : "Network error while contacting gateway";
    return { ok: false, status: 0, body: { error: msg }, error: msg };
  }
}

/** Safely parse a JSON request body. Returns {} on empty/invalid bodies. */
export async function readJsonBody(
  req: Request,
): Promise<Record<string, unknown>> {
  try {
    const body = (await req.json()) as unknown;
    if (body !== null && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

/**
 * Coerce any gateway payload into the exact SensorSnapshot shape
 * (see src/lib/types.ts). Guarantees every field exists as a finite
 * number so the UI can merge live data into the same slices the
 * simulator writes to without extra guards.
 */
export function sanitizeSnapshot(raw: unknown): Record<string, unknown> {
  const r =
    raw !== null && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};
  const soil = num(r["soil"], num(r["soilMoistureB"], num(r["soilMoistureA"], 0)));
  const temp = num(r["temp"], num(r["tempC"], 0));
  const hum = num(r["hum"], num(r["humidity"], 0));
  const aqi = num(r["aqi"], 0);
  const rain = Boolean(r["rain"]);
  const pump = Boolean(r["pump"]);
  const mode = r["mode"] === "AUTO" ? "AUTO" : "MANUAL";
  const servo = num(r["servo"], 90);

  return {
    timestamp: num(r["timestamp"], Date.now()),
    soil,
    temp,
    hum,
    aqi,
    rain,
    pump,
    mode,
    servo,
    rssi: num(r["rssi"], 0),
    stale: Boolean(r["stale"]),
    uptime: num(r["uptime"], 0),
    tempC: temp,
    humidity: hum,
    lightLux: num(r["lightLux"], 0),
    rainMm: num(r["rainMm"], rain ? 2.5 : 0),
    tankLevelPercent: num(r["tankLevelPercent"], 0),
    flowRateLpm: num(r["flowRateLpm"], 0),
    pumpCurrentA: num(r["pumpCurrentA"], 0),
    soilMoistureA: soil,
    soilMoistureB: soil,
  };
}
