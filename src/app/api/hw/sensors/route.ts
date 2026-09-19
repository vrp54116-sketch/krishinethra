/**
 * GET /api/hw/sensors — latest sensor snapshot.
 *
 * Query: ?gw=<override base URL> (else HARDWARE_GATEWAY_URL env)
 *        ?mode=simulation forces the simulation snapshot.
 *
 * Simulation: returns a fresh snapshot from the same simulation engine
 * shape (SensorSnapshot in src/lib/types.ts) with source:"simulation".
 * Live: proxies GET <gateway>/sensors, sanitized to the identical shape.
 * Always HTTP 200 with the normalized envelope; never throws.
 */

export const runtime = "nodejs";

import {
  gatewayHeaders,
  normalized,
  proxyGateway,
  resolveGatewayUrl,
  resolveMode,
  sanitizeSnapshot,
} from "@/lib/hw-gateway";
import { createInitialSnapshot } from "@/lib/simulation-engine";

export async function GET(req: Request) {
  try {
    const gw = resolveGatewayUrl(req);
    const mode = resolveMode(req);
    if (!gw || mode === "simulation") {
      return normalized(true, createInitialSnapshot(Date.now()), "simulation");
    }
    const proxied = await proxyGateway(gw, "/sensors", {
      method: "GET",
      headers: gatewayHeaders(req),
    });
    if (!proxied.ok) return normalized(false, proxied.body, "live");
    return normalized(true, sanitizeSnapshot(proxied.body), "live");
  } catch (err) {
    return normalized(
      false,
      { error: err instanceof Error ? err.message : "Unexpected bridge error" },
      "simulation",
    );
  }
}
