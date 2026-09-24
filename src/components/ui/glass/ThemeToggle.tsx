"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { playToggleClick } from "@/lib/audio";

function subscribeNoop() {
  return () => {};
}
function getMounted() {
  return true;
}
function getServerMounted() {
  return false;
}

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    try {
      const saved = localStorage.getItem("krishinethra-theme") as "dark" | "light" | null;
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    } catch {
      // Ignore localStorage errors
    }
    return "dark";
  });

  const mounted = useSyncExternalStore(subscribeNoop, getMounted, getServerMounted);

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    playToggleClick();
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
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "liquid-glass-pill flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-300 border border-white/10",
          className,
        )}
      >
        <Moon className="h-4 w-4" />
      </div>
    );
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "liquid-glass-pill relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-200 transition-all hover:border-emerald-400/50 hover:text-white cursor-pointer overflow-hidden",
        isLight && "text-amber-500 hover:text-amber-600 border-amber-400/40",
        className,
      )}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      title={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLight ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <Sun className="h-4 w-4 text-amber-400" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <Moon className="h-4 w-4 text-emerald-300" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default ThemeToggle;
