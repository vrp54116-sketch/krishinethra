/**
 * POST /api/hw/servo — pan-tilt camera head control.
 *
 * Body: { axis: "pan" | "tilt", angle: number (0–180) }
 * Query: ?gw=<override base URL> (else HARDWARE_GATEWAY_URL env)
 *        ?mode=simulation forces the simulation acknowledgement.
 *
 * Out-of-range angles are clamped to 0–180 (the clamped value is echoed
 * back in `data.angle`). Non-numeric angles are rejected with ok:false.
 * Live: proxies POST <gateway>/servo with the clamped body.
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
    const axis = typeof body["axis"] === "string" ? body["axis"] : "";
    if (axis !== "pan" && axis !== "tilt") {
      return normalized(
        false,
        { error: 'Invalid body: "axis" must be "pan" or "tilt".' },
        "simulation",
      );
    }
    const rawAngle = Number(body["angle"]);
    if (!Number.isFinite(rawAngle)) {
      return normalized(
        false,
        { error: 'Invalid body: "angle" must be a number (0–180).' },
        "simulation",
      );
    }
    const angle = Math.min(180, Math.max(0, Math.round(rawAngle)));
    const payload = { axis, angle };

    const gw = resolveGatewayUrl(req);
    const mode = resolveMode(req);
    if (!gw || mode === "simulation") {
      return normalized(
        true,
        { ...payload, applied: "simulation" as const },
        "simulation",
      );
    }
    const proxied = await proxyGateway(
      gw,
      "/servo",
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
