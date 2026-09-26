import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Farm profile, thresholds, hardware bridge, Telegram and preferences.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
