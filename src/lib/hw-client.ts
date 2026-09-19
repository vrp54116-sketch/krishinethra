/**
 * hw-client.ts
 * Client-side wrappers for the hardware bridge (`/api/hw/*`).
 *
 * The `gw` argument is the gateway base URL from
 * `settings.hardwareGatewayUrl` (Settings → Hardware Bridge). It is sent
 * as the `?gw=` runtime override so the server route can proxy to a
 * LAN gateway the browser may not resolve the same way — plus the
 * `HARDWARE_GATEWAY_URL` env fallback stays available server-side.
 *
 * Every helper returns the normalized envelope
 * `{ ok, data, source }` and NEVER throws (network errors → ok:false),
 * so the live poller can treat "unreachable" as a state, not an error.
 */

export type HwSource = "live" | "simulation";

export interface HwEnvelope<T = unknown> {
  ok: boolean;
  data: T;
  source: HwSource;
}

function bridgeQuery(gw: string, extra?: string): string {
  const q = `gw=${encodeURIComponent(gw.trim())}&mode=live`;
  return extra ? `${q}&${extra}` : q;
}

async function readEnvelope<T>(res: Response): Promise<HwEnvelope<T>> {
  try {
    const body = (await res.json()) as {
      ok?: boolean;
      data?: T;
      source?: HwSource;
    };
    return {
      ok: body.ok === true,
      data: (body.data ?? null) as T,
      source: body.source === "live" ? "live" : "simulation",
    };
  } catch {
    return { ok: false, data: null as T, source: "live" };
  }
}

function unreachable<T>(message: string): HwEnvelope<T> {
  return { ok: false, data: { error: message } as T, source: "live" };
}

export async function fetchHwStatus(
  gw: string,
): Promise<HwEnvelope<{ ok?: boolean; uptime?: number; firmware?: string }>> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`/api/hw/status?${bridgeQuery(gw)}`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return await readEnvelope(res);
  } catch (err) {
    return unreachable(err instanceof Error ? err.message : "Network error");
  }
}

export async function fetchHwSensors(
  gw: string,
): Promise<HwEnvelope<Record<string, number>>> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`/api/hw/sensors?${bridgeQuery(gw)}`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return await readEnvelope(res);
  } catch (err) {
    return unreachable(err instanceof Error ? err.message : "Network error");
  }
}

export async function sendHwPump(
  gw: string,
  action: "on" | "off",
  durationSec?: number,
): Promise<HwEnvelope> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(`/api/hw/pump?${bridgeQuery(gw)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        durationSec === undefined ? { action } : { action, durationSec },
      ),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return await readEnvelope(res);
  } catch (err) {
    return unreachable(err instanceof Error ? err.message : "Network error");
  }
}

export async function sendHwServo(
  gw: string,
  axis: "pan" | "tilt",
  angle: number,
): Promise<HwEnvelope> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(`/api/hw/servo?${bridgeQuery(gw)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ axis, angle: Math.round(angle) }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return await readEnvelope(res);
  } catch (err) {
    return unreachable(err instanceof Error ? err.message : "Network error");
  }
}
