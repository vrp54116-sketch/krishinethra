import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spray Planner",
  description: "Weather-aware spray schedules with rain-safe windows.",
};

export default function SprayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
