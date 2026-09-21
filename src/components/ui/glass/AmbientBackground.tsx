import * as React from "react";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/**
 * Fixed ambient background rendered once behind the whole app.
 * Four large blurred radial blobs drifting on 40–70s loops,
 * plus a faint noise overlay and an edge vignette.
 * Visual layer only — no logic, routes, or data affected.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050807]"
    >
      {/* emerald — 18% */}
      <div
        className="ambient-blob ambient-blob-a"
        style={{
          width: "55vw",
          height: "55vw",
          left: "-12vw",
          top: "-14vw",
          background:
            "radial-gradient(circle at center, rgba(16,185,129,0.18) 0%, transparent 65%)",
        }}
      />
      {/* lime — 12% */}
      <div
        className="ambient-blob ambient-blob-b"
        style={{
          width: "48vw",
          height: "48vw",
          right: "-14vw",
          top: "8vh",
          background:
            "radial-gradient(circle at center, rgba(132,204,22,0.12) 0%, transparent 65%)",
        }}
      />
      {/* amber — 10% */}
      <div
        className="ambient-blob ambient-blob-c"
        style={{
          width: "42vw",
          height: "42vw",
          left: "8vw",
          bottom: "-16vw",
          background:
            "radial-gradient(circle at center, rgba(245,158,11,0.10) 0%, transparent 65%)",
        }}
      />
      {/* teal — 12% */}
      <div
        className="ambient-blob ambient-blob-d"
        style={{
          width: "60vw",
          height: "60vw",
          right: "-18vw",
          bottom: "-22vw",
          background:
            "radial-gradient(circle at center, rgba(20,184,166,0.12) 0%, transparent 65%)",
        }}
      />

      {/* faint SVG noise texture */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: NOISE_SVG, opacity: 0.03 }}
      />

      {/* edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}

export default AmbientBackground;
