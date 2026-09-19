import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Irrigation",
  description: "Smart pump control, schedules, tank, water usage and energy.",
};

export default function IrrigationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
