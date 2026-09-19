/**
 * POST /api/hw/pump — pump relay control.
 *
 * Body: { action: "on" | "off", durationSec?: number }
 * Query: ?gw=<override base URL> (else HARDWARE_GATEWAY_URL env)
 *        ?mode=simulation forces the simulation acknowledgement.
 *
 * Simulation: acknowledges without touching hardware (the client store
 * applies the run locally) → source:"simulation".
 * Live: proxies POST <gateway>/pump with the same body.
 * Always HTTP 200 with the normalized envelope; never throws.
 */

export const runtime = "nodejs";

import {
  gatewayHeaders,
  normalized,
  proxyGateway,
  readJsonBody,
  resolveGatewayUrl,
  resolveMode,
} from "@/lib/hw-gateway";

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    const action = typeof body["action"] === "string" ? body["action"] : "";
    if (action !== "on" && action !== "off") {
      return normalized(
        false,
        { error: 'Invalid body: "action" must be "on" or "off".' },
        "simulation",
      );
    }
    let durationSec: number | undefined;
    if (body["durationSec"] !== undefined) {
      const n = Number(body["durationSec"]);
      if (!Number.isFinite(n) || n <= 0) {
        return normalized(
          false,
          { error: 'Invalid body: "durationSec" must be a positive number.' },
          "simulation",
        );
      }
      durationSec = Math.min(3600, Math.round(n));
    }

    const gw = resolveGatewayUrl(req);
    const mode = resolveMode(req);
    const payload =
      durationSec === undefined ? { action } : { action, durationSec };
    if (!gw || mode === "simulation") {
      return normalized(
        true,
        { ...payload, applied: "simulation" as const },
        "simulation",
      );
    }
    const proxied = await proxyGateway(
      gw,
      "/pump",
      { method: "POST", headers: gatewayHeaders(req), body: payload },
      8000,
    );
    return normalized(proxied.ok, proxied.body, "live");
  } catch (err) {
    return normalized(
      false,
      { error: err instanceof Error ? err.message : "Unexpected bridge error" },
      "simulation",
    );
  }
}
