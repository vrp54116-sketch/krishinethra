import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KrishiGPT",
  description: "Ask your farm's AI doctor — irrigation, disease, weather and tasks.",
};

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
