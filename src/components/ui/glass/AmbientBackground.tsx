"use client";

import * as React from "react";

/**
 * Performance Budget Rule 4:
 * Background: ONE fixed div with 3 static radial gradients (orange, warm gray, deep amber),
 * animated ONLY via transform translate, 60s+ loops, will-change: transform on that div only.
 * No mouse-tracking, no per-frame JS background updates.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="ambient-bg pointer-events-none fixed -inset-[8%] z-0"
    />
  );
}

export default AmbientBackground;
