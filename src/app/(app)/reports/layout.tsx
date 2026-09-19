import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
  description: "30-day farm reports — health, water, energy, scans and savings.",
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
