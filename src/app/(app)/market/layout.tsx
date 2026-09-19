import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market",
  description: "Mandi prices, trends and sell-vs-hold guidance for your crops.",
};

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
