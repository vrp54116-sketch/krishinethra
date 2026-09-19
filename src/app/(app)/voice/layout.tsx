import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voice Control",
  description: "Hands-free farm control — voice commands in Hindi, Gujarati, Marathi and English.",
};

export default function VoiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
