import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Live farm command center — health score, sensors, pump and AI suggestions.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
