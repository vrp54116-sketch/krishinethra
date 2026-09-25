"use client";

import { lazy, Suspense } from "react";
import PageSkeleton from "@/components/layout/PageSkeleton";

// V2.5 performance — code-split the Recharts-heavy sensors telemetry bundle.
const SensorsView = lazy(() => import("./SensorsView"));

export default function SensorsPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={5} />}>
      <SensorsView />
    </Suspense>
  );
}
