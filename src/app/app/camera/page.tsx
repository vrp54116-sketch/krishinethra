"use client";

import { Suspense } from "react";
import LeafScanner from "@/components/camera/LeafScanner";

/**
 * /app/camera (Leaf Scanner) — Real Plant Disease Doctor
 * Powered by on-device TensorFlow.js neural network trained on tomato diseases.
 */
export default function CameraPage() {
  return (
    <Suspense fallback={null}>
      <div className="mx-auto w-full max-w-5xl py-2">
        <LeafScanner />
      </div>
    </Suspense>
  );
}
