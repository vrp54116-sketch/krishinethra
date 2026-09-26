export interface SectionAccent {
  key: string;
  name: string;
  color: string;
  rgb: string;
  glow: string;
  glowSubtle: string;
  borderHover: string;
  borderActive: string;
  bgLight: string;
  textClass: string;
}

export const CARBON_EMBER_ACCENT: SectionAccent = {
  key: "ember",
  name: "ember",
  color: "#FF6B1A",
  rgb: "255, 107, 26",
  glow: "rgba(255, 107, 26, 0.35)",
  glowSubtle: "rgba(255, 107, 26, 0.14)",
  borderHover: "rgba(255, 107, 26, 0.40)",
  borderActive: "rgba(255, 107, 26, 0.60)",
  bgLight: "rgba(255, 107, 26, 0.14)",
  textClass: "text-[#FF8A4C]",
};

export const SECTION_ACCENTS: Record<string, SectionAccent> = {
  dashboard: { ...CARBON_EMBER_ACCENT, key: "dashboard" },
  irrigation: { ...CARBON_EMBER_ACCENT, key: "irrigation" },
  climate: { ...CARBON_EMBER_ACCENT, key: "climate" },
  camera: { ...CARBON_EMBER_ACCENT, key: "camera" },
  scanner: { ...CARBON_EMBER_ACCENT, key: "scanner" },
  spray: { ...CARBON_EMBER_ACCENT, key: "spray" },
  fertilizer: { ...CARBON_EMBER_ACCENT, key: "fertilizer" },
  market: { ...CARBON_EMBER_ACCENT, key: "market" },
  schemes: { ...CARBON_EMBER_ACCENT, key: "schemes" },
  diary: { ...CARBON_EMBER_ACCENT, key: "diary" },
  tasks: { ...CARBON_EMBER_ACCENT, key: "tasks" },
  assistant: { ...CARBON_EMBER_ACCENT, key: "assistant" },
  reports: { ...CARBON_EMBER_ACCENT, key: "reports" },
  alerts: { ...CARBON_EMBER_ACCENT, key: "alerts" },
  voice: { ...CARBON_EMBER_ACCENT, key: "voice" },
  settings: { ...CARBON_EMBER_ACCENT, key: "settings" },
  sensors: { ...CARBON_EMBER_ACCENT, key: "sensors" },
  map: { ...CARBON_EMBER_ACCENT, key: "map" },
};

/**
 * Semantic dots ONLY (tiny pills/dots, never large areas):
 * ok #22C55E, warn #FBBF24, crit #FF453A.
 */
export const STATUS_COLORS = {
  optimal: {
    hex: "#22C55E",
    text: "text-[#22C55E]",
    bg: "bg-white/[0.04]",
    border: "border-white/10",
    dot: "bg-[#22C55E] shadow-[0_0_6px_rgba(34,197,94,0.8)]",
  },
  warning: {
    hex: "#FBBF24",
    text: "text-[#FBBF24]",
    bg: "bg-white/[0.04]",
    border: "border-white/10",
    dot: "bg-[#FBBF24] shadow-[0_0_6px_rgba(251,191,36,0.8)]",
  },
  critical: {
    hex: "#FF453A",
    text: "text-[#FF453A]",
    bg: "bg-white/[0.04]",
    border: "border-white/10",
    dot: "bg-[#FF453A] shadow-[0_0_6px_rgba(255,69,58,0.8)]",
  },
  info: {
    hex: "#FF8A4C",
    text: "text-[#FF8A4C]",
    bg: "bg-white/[0.04]",
    border: "border-white/10",
    dot: "bg-[#FF8A4C] shadow-[0_0_6px_rgba(255,138,76,0.8)]",
  },
} as const;

export function getSectionAccent(pathname: string | null | undefined): SectionAccent {
  if (!pathname) return CARBON_EMBER_ACCENT;
  const segments = pathname.split("/").filter(Boolean);
  const segment = (segments[0] === "app" ? segments[1] : segments[0]) || "dashboard";
  if (segment in SECTION_ACCENTS) {
    return SECTION_ACCENTS[segment];
  }
  return CARBON_EMBER_ACCENT;
}
