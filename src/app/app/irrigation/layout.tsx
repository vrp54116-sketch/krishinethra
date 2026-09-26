import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Irrigation",
  description: "Smart pump control, schedules, water usage and irrigation automation.",
};

export default function IrrigationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
