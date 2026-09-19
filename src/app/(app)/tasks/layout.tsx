import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tasks",
  description: "AI-generated daily tasks with priorities and due dates.",
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
