import AppShell from "@/components/layout/AppShell";

/** Shared shell for every route except the landing page "/". */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
