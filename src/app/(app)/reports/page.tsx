"use client";

import { lazy, Suspense } from "react";
import PageSkeleton from "@/components/layout/PageSkeleton";

// V2.5 performance — code-split the Recharts-heavy reports bundle.
const ReportsView = lazy(() => import("./ReportsView"));

export default function ReportsPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={5} />}>
      <ReportsView />
    </Suspense>
  );
}
