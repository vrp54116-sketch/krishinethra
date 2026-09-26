import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crop Doctor",
  description: "AI leaf scanner — detect disease, severity heatmap and treatment plans.",
};

export default function CameraLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
