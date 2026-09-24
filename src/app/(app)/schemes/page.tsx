"use client";

import { lazy, Suspense } from "react";
import PageSkeleton from "@/components/layout/PageSkeleton";

// V2.5 performance — code-split the schemes catalogue.
const SchemesView = lazy(() => import("./SchemesView"));

export default function SchemesPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={5} />}>
      <SchemesView />
    </Suspense>
  );
}
