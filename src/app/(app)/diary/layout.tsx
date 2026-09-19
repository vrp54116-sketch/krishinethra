import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Farm Diary",
  description: "Daily farm diary — irrigation, disease, fertilizer and harvest notes.",
};

export default function DiaryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
