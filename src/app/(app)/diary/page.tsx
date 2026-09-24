"use client";

import { lazy, Suspense } from "react";
import PageSkeleton from "@/components/layout/PageSkeleton";

// V2.5 performance — code-split the diary bundle (includes a Recharts pie).
const DiaryView = lazy(() => import("./DiaryView"));

export default function DiaryPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={5} />}>
      <DiaryView />
    </Suspense>
  );
}
