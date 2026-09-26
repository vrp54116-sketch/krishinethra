import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schemes",
  description: "Government schemes matched to your farm profile and crops.",
};

export default function SchemesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
