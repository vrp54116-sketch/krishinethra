"use client";

import { Suspense } from "react";
import LeafScanner from "@/components/camera/LeafScanner";

/**
 * /app/leaf-scanner — Real Plant Disease Doctor
 * Powered by on-device 11-class TensorFlow.js tomato disease model.
 */
export default function AppLeafScannerPage() {
  return (
    <Suspense fallback={null}>
      <div className="mx-auto w-full max-w-5xl py-2">
        <LeafScanner />
      </div>
    </Suspense>
  );
}
