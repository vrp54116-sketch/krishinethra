import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Farm Map",
  description: "Zone map — soil moisture per plot with crop status.",
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
