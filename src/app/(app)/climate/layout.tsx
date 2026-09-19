import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Climate",
  description: "Micro-climate — live sensors, 5-day forecast, history and crop comfort.",
};

export default function ClimateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
