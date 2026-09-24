"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/**
 * V2.1 Ambient Background with Liquid Micro-Interactions:
 * - 6 radial blobs behind every liquid glass surface, each with 50-80s drift loop
 * - Subtle pulsing: scale 1→1.05→1 over 8s for each blob
 * - Mouse interaction: blobs gently repel from cursor position
 * - Respect prefers-reduced-motion: freeze all blob animations & transforms
 */
function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServerSnapshot() {
  return false;
}

export function AmbientBackground() {
  const [repel, setRepel] = React.useState({ x: 0, y: 0 });
  const reducedMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const rafId = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (reducedMotion) return;

    const onMouseMove = (e: MouseEvent) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const w = window.innerWidth || 1;
        const h = window.innerHeight || 1;
        // Normalized cursor coords (-1 to +1 from center)
        const nx = (e.clientX / w - 0.5) * 2;
        const ny = (e.clientY / h - 0.5) * 2;
        // Gentle repulsion offset: up to 24px in opposite direction
        setRepel({
          x: -nx * 24,
          y: -ny * 20,
        });
      });
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [reducedMotion]);

  const getRepelStyle = (factor = 1): React.CSSProperties => {
    if (reducedMotion) return {};
    return {
      transform: `translate3d(${(repel.x * factor).toFixed(1)}px, ${(repel.y * factor).toFixed(1)}px, 0)`,
      transition: "transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    };
  };

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[var(--background,#070B09)] transition-colors duration-600"
    >
      {/* 1. emerald #10B981 @ 14% — top-left quadrant */}
      <div
        className="ambient-blob-wrapper"
        style={getRepelStyle(1.1)}
      >
        <div
          className={cn("ambient-blob ambient-blob-a", !reducedMotion && "blob-pulse")}
          style={{
            width: "64vw",
            height: "64vw",
            left: "-10vw",
            top: "-8vw",
            background:
              "radial-gradient(circle at center, rgba(16,185,129,0.14) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* 2. teal #0D9488 @ 10% — bottom-right quadrant */}
      <div
        className="ambient-blob-wrapper"
        style={getRepelStyle(0.9)}
      >
        <div
          className={cn("ambient-blob ambient-blob-b", !reducedMotion && "blob-pulse")}
          style={{
            width: "68vw",
            height: "68vw",
            right: "-12vw",
            bottom: "-15vw",
            background:
              "radial-gradient(circle at center, rgba(13,148,136,0.10) 0%, transparent 70%)",
            animationDelay: "1.2s",
          }}
        />
      </div>

      {/* 3. lime #A3E635 @ 8% — top-right quadrant */}
      <div
        className="ambient-blob-wrapper"
        style={getRepelStyle(1.25)}
      >
        <div
          className={cn("ambient-blob ambient-blob-c", !reducedMotion && "blob-pulse")}
          style={{
            width: "56vw",
            height: "56vw",
            right: "-8vw",
            top: "4vh",
            background:
              "radial-gradient(circle at center, rgba(163,230,53,0.08) 0%, transparent 70%)",
            animationDelay: "2.4s",
          }}
        />
      </div>

      {/* 4. amber #F59E0B @ 7% — bottom-left quadrant */}
      <div
        className="ambient-blob-wrapper"
        style={getRepelStyle(0.85)}
      >
        <div
          className={cn("ambient-blob ambient-blob-d", !reducedMotion && "blob-pulse")}
          style={{
            width: "52vw",
            height: "52vw",
            left: "2vw",
            bottom: "-10vw",
            background:
              "radial-gradient(circle at center, rgba(245,158,11,0.07) 0%, transparent 70%)",
            animationDelay: "3.6s",
          }}
        />
      </div>

      {/* 5. sky #38BDF8 @ 6% — center / mid-right */}
      <div
        className="ambient-blob-wrapper"
        style={getRepelStyle(1.0)}
      >
        <div
          className={cn("ambient-blob ambient-blob-e", !reducedMotion && "blob-pulse")}
          style={{
            width: "60vw",
            height: "60vw",
            left: "26vw",
            top: "22vh",
            background:
              "radial-gradient(circle at center, rgba(56,189,248,0.06) 0%, transparent 70%)",
            animationDelay: "4.8s",
          }}
        />
      </div>

      {/* 6. rose #FB7185 @ 5% — upper-center accent */}
      <div
        className="ambient-blob-wrapper"
        style={getRepelStyle(1.15)}
      >
        <div
          className={cn("ambient-blob ambient-blob-f", !reducedMotion && "blob-pulse")}
          style={{
            width: "48vw",
            height: "48vw",
            left: "8vw",
            top: "38vh",
            background:
              "radial-gradient(circle at center, rgba(251,113,133,0.05) 0%, transparent 70%)",
            animationDelay: "6s",
          }}
        />
      </div>

      {/* faint SVG noise texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: NOISE_SVG, opacity: 0.03 }}
      />

      {/* edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
}

export default AmbientBackground;
