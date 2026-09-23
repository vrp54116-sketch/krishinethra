import * as React from "react";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/**
 * V2.1 Ambient Background — six large radial blobs behind every liquid glass
 * surface, each blur(100px) with its own 50–80s drift loop:
 *
 *  1. emerald #10B981 @ 14%  ·  2. teal   #0D9488 @ 10%
 *  3. lime    #A3E635 @  8%  ·  4. amber  #F59E0B @  7%
 *  5. sky     #38BDF8 @  6%  ·  6. rose   #FB7185 @  5%
 *
 * Plus an SVG noise texture (opacity 0.03) and a vignette
 * (transparent 50% → rgba(0,0,0,0.6) 100%). All drift is disabled under
 * prefers-reduced-motion (see liquid-glass.css + globals.css).
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#070B09]"
    >
      {/* 1. emerald #10B981 @ 14% — top-left quadrant */}
      <div
        className="ambient-blob ambient-blob-a"
        style={{
          width: "64vw",
          height: "64vw",
          left: "-10vw",
          top: "-8vw",
          background:
            "radial-gradient(circle at center, rgba(16,185,129,0.14) 0%, transparent 70%)",
        }}
      />

      {/* 2. teal #0D9488 @ 10% — bottom-right quadrant */}
      <div
        className="ambient-blob ambient-blob-b"
        style={{
          width: "68vw",
          height: "68vw",
          right: "-12vw",
          bottom: "-15vw",
          background:
            "radial-gradient(circle at center, rgba(13,148,136,0.10) 0%, transparent 70%)",
        }}
      />

      {/* 3. lime #A3E635 @ 8% — top-right quadrant */}
      <div
        className="ambient-blob ambient-blob-c"
        style={{
          width: "56vw",
          height: "56vw",
          right: "-8vw",
          top: "4vh",
          background:
            "radial-gradient(circle at center, rgba(163,230,53,0.08) 0%, transparent 70%)",
        }}
      />

      {/* 4. amber #F59E0B @ 7% — bottom-left quadrant */}
      <div
        className="ambient-blob ambient-blob-d"
        style={{
          width: "52vw",
          height: "52vw",
          left: "2vw",
          bottom: "-10vw",
          background:
            "radial-gradient(circle at center, rgba(245,158,11,0.07) 0%, transparent 70%)",
        }}
      />

      {/* 5. sky #38BDF8 @ 6% — center / mid-right */}
      <div
        className="ambient-blob ambient-blob-e"
        style={{
          width: "60vw",
          height: "60vw",
          left: "26vw",
          top: "22vh",
          background:
            "radial-gradient(circle at center, rgba(56,189,248,0.06) 0%, transparent 70%)",
        }}
      />

      {/* 6. rose #FB7185 @ 5% — upper-center accent */}
      <div
        className="ambient-blob ambient-blob-f"
        style={{
          width: "48vw",
          height: "48vw",
          left: "8vw",
          top: "38vh",
          background:
            "radial-gradient(circle at center, rgba(251,113,133,0.05) 0%, transparent 70%)",
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
          background: "radial-gradient(transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
}

export default AmbientBackground;
