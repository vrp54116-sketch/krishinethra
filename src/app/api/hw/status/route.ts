/**
 * GET /api/hw/status — gateway reachability + firmware info.
 *
 * Query: ?gw=<override base URL> (else HARDWARE_GATEWAY_URL env)
 *        ?mode=simulation forces the simulation response.
 *
 * Simulation (no gateway configured): { ok:true, data:{mode:"simulation",ok:true}, source:"simulation" }
 * Live: proxies GET <gateway>/status → { ok, data, source:"live" }.
 * Always HTTP 200 with the normalized envelope; never throws.
 */

export const runtime = "nodejs";

import {
  gatewayHeaders,
  normalized,
  proxyGateway,
  resolveGatewayUrl,
  resolveMode,
} from "@/lib/hw-gateway";

export async function GET(req: Request) {
  try {
    const gw = resolveGatewayUrl(req);
    const mode = resolveMode(req);
    if (!gw || mode === "simulation") {
      return normalized(true, { mode: "simulation", ok: true }, "simulation");
    }
    const proxied = await proxyGateway(gw, "/status", {
      method: "GET",
      headers: gatewayHeaders(req),
    });
    return normalized(proxied.ok, proxied.body, "live");
  } catch (err) {
    return normalized(
      false,
      { error: err instanceof Error ? err.message : "Unexpected bridge error" },
      "simulation",
    );
  }
}
