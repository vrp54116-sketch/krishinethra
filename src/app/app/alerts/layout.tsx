import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerts",
  description: "Alert center — critical, warning and info signals with Telegram forwarding.",
};

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
