"use client";

import { useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { playToggleClick } from "@/lib/audio";

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("krishinethra-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("krishinethra-theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem("krishinethra-theme") as "dark" | "light" | null;
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  } catch {
    // Ignore
  }
  return "dark";
}

function getServerSnapshot(): "dark" | "light" {
  return "dark";
}

export function applyTheme(next: "dark" | "light") {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("krishinethra-theme", next);
  } catch {
    // Ignore
  }
  if (next === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
  window.dispatchEvent(new Event("krishinethra-theme-change"));
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerSnapshot);
  return {
    theme,
    isLight: theme === "light",
    isDark: theme === "dark",
    setTheme: applyTheme,
    toggleTheme: () => applyTheme(theme === "dark" ? "light" : "dark"),
  };
}

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const currentTheme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(subscribeTheme, () => true, () => false);

  useEffect(() => {
    // Ensure documentElement has proper class on mount
    const active = getThemeSnapshot();
    if (active === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = currentTheme === "dark" ? "light" : "dark";
    playToggleClick();
    applyTheme(next);
  };

  const isLight = mounted ? currentTheme === "light" : false;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "liquid-glass-pill relative flex h-9 shrink-0 items-center justify-center gap-2 px-2.5 rounded-full border border-white/10 text-zinc-300 transition-all hover:border-[#FF6B1A]/50 hover:text-white cursor-pointer overflow-hidden",
        !showLabel && "w-9 px-0",
        isLight && "border-black/10 text-zinc-800 hover:border-[#FF6B1A]/50",
        className,
      )}
      aria-label={`Switch to ${isLight ? "Carbon (Dark)" : "Paper (Light)"} mode`}
      title={`Theme: ${isLight ? "Paper (Light)" : "Carbon (Dark)"} — click to toggle`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLight ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <Sun className="h-4 w-4 text-[#FF6B1A]" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <Moon className="h-4 w-4 text-[#FF8A4C]" />
          </motion.div>
        )}
      </AnimatePresence>
      {showLabel && (
        <span className="text-xs font-semibold">
          {isLight ? "Paper" : "Carbon"}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
