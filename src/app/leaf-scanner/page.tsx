"use client";

import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import LeafScanner from "@/components/camera/LeafScanner";

/**
 * /leaf-scanner — Real Plant Disease Doctor
 * Powered by on-device 11-class TensorFlow.js tomato disease model.
 */
export default function LeafScannerPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <div className="mx-auto w-full max-w-5xl py-2">
          <LeafScanner />
        </div>
      </Suspense>
    </AppShell>
  );
}
