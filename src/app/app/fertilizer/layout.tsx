import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fertilizer",
  description: "Dose calculator and 15-day fertilizer cycle tracking.",
};

export default function FertilizerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
