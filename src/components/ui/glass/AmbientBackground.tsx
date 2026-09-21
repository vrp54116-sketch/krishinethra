import * as React from "react";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/**
 * Aurora Harvest Ambient Background:
 * Page base #070B09 with 5 drifting blurred blobs:
 * 1. emerald #10B981 @ 16%
 * 2. teal #0D9488 @ 12%
 * 3. lime #A3E635 @ 9%
 * 4. amber #F59E0B @ 8%
 * 5. sky #38BDF8 @ 7%
 * blur 90px, slow drift loops, faint noise + vignette overlay.
 * Positioned so every glass surface has rich color behind it.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#070B09]"
    >
      {/* 1. emerald #10B981 @ 16% — top-left quadrant */}
      <div
        className="ambient-blob ambient-blob-a"
        style={{
          width: "62vw",
          height: "62vw",
          left: "-10vw",
          top: "-8vw",
          background:
            "radial-gradient(circle at center, rgba(16,185,129,0.16) 0%, transparent 70%)",
        }}
      />

      {/* 2. teal #0D9488 @ 12% — bottom-right quadrant */}
      <div
        className="ambient-blob ambient-blob-b"
        style={{
          width: "66vw",
          height: "66vw",
          right: "-12vw",
          bottom: "-15vw",
          background:
            "radial-gradient(circle at center, rgba(13,148,136,0.12) 0%, transparent 70%)",
        }}
      />

      {/* 3. lime #A3E635 @ 9% — top-right quadrant */}
      <div
        className="ambient-blob ambient-blob-c"
        style={{
          width: "54vw",
          height: "54vw",
          right: "-8vw",
          top: "4vh",
          background:
            "radial-gradient(circle at center, rgba(163,230,53,0.09) 0%, transparent 70%)",
        }}
      />

      {/* 4. amber #F59E0B @ 8% — bottom-left quadrant */}
      <div
        className="ambient-blob ambient-blob-d"
        style={{
          width: "50vw",
          height: "50vw",
          left: "2vw",
          bottom: "-10vw",
          background:
            "radial-gradient(circle at center, rgba(245,158,11,0.08) 0%, transparent 70%)",
        }}
      />

      {/* 5. sky #38BDF8 @ 7% — center / mid-right */}
      <div
        className="ambient-blob ambient-blob-e"
        style={{
          width: "58vw",
          height: "58vw",
          left: "26vw",
          top: "22vh",
          background:
            "radial-gradient(circle at center, rgba(56,189,248,0.07) 0%, transparent 70%)",
        }}
      />

      {/* faint SVG noise texture */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: NOISE_SVG, opacity: 0.035 }}
      />

      {/* edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 45%, transparent 50%, rgba(0,0,0,0.58) 100%)",
        }}
      />
    </div>
  );
}

export default AmbientBackground;
