"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

/** Shared shell for every route except the landing page "/". */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <AppShell>
      <div key={pathname} className="contents">
        {children}
      </div>
    </AppShell>
  );
}
