"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemePreference = "light" | "dark" | "system";

export interface ThemeToggleBoxProps {
  className?: string;
  onChange?: (theme: ThemePreference) => void;
}

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("editorial-theme-change", callback);
  window.addEventListener("krishinethra-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("editorial-theme-change", callback);
    window.removeEventListener("krishinethra-theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = (localStorage.getItem("krishinethra-field-theme") ||
      localStorage.getItem("krishinethra-theme")) as ThemePreference | null;
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch {
    // Ignore
  }
  return "dark";
}

function getServerSnapshot(): ThemePreference {
  return "dark";
}

function getMountedSnapshot(): boolean {
  return true;
}

function getServerMountedSnapshot(): boolean {
  return false;
}

export function applyTheme(theme: ThemePreference) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("krishinethra-field-theme", theme);
    localStorage.setItem(
      "krishinethra-theme",
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark"
        : theme,
    );
  } catch {
    // Ignore
  }

  let resolved: "light" | "dark" = "dark";
  if (theme === "system") {
    resolved = window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } else {
    resolved = theme;
  }

  document.documentElement.setAttribute("data-theme", resolved);
  if (resolved === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }

  window.dispatchEvent(new Event("editorial-theme-change"));
  window.dispatchEvent(new Event("krishinethra-theme-change"));
}

export function ThemeToggleBox({ className, onChange }: ThemeToggleBoxProps) {
  const currentTheme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerSnapshot,
  );
  const mounted = useSyncExternalStore(
    subscribeTheme,
    getMountedSnapshot,
    getServerMountedSnapshot,
  );

  useEffect(() => {
    // Sync system theme changes dynamically when preference is set to system
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      try {
        const pref = localStorage.getItem("krishinethra-field-theme");
        if (pref === "system") {
          const resolved = e.matches ? "light" : "dark";
          document.documentElement.setAttribute("data-theme", resolved);
          if (resolved === "light") {
            document.documentElement.classList.add("light");
          } else {
            document.documentElement.classList.remove("light");
          }
        }
      } catch {
        // Ignore
      }
    };

    const mql = window.matchMedia("(prefers-color-scheme: light)");
    mql.addEventListener("change", handleSystemThemeChange);

    return () => {
      mql.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  const handleSelect = (next: ThemePreference) => {
    applyTheme(next);
    onChange?.(next);
  };

  return (
    <div
      role="group"
      aria-label="Theme selector"
      className={cn(
        "inline-flex items-center gap-0.5 p-1 shrink-0",
        "border border-[var(--line)] bg-[var(--panel)] rounded-[2px]",
        "select-none",
        className,
      )}
    >
      {/* Sun: Light Theme */}
      <button
        type="button"
        onClick={() => handleSelect("light")}
        aria-label="Light theme"
        title="Light theme"
        className={cn(
          "w-7 h-7 inline-flex items-center justify-center rounded-[2px] transition-all duration-200 cursor-pointer",
          mounted && currentTheme === "light"
            ? "bg-[var(--ink)] text-[var(--bg)] shadow-sm"
            : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--panel-2)]",
        )}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      {/* Moon: Dark Theme */}
      <button
        type="button"
        onClick={() => handleSelect("dark")}
        aria-label="Dark theme"
        title="Dark theme"
        className={cn(
          "w-7 h-7 inline-flex items-center justify-center rounded-[2px] transition-all duration-200 cursor-pointer",
          mounted && currentTheme === "dark"
            ? "bg-[var(--ink)] text-[var(--bg)] shadow-sm"
            : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--panel-2)]",
        )}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      {/* Half: System Theme */}
      <button
        type="button"
        onClick={() => handleSelect("system")}
        aria-label="System theme"
        title="System theme"
        className={cn(
          "w-7 h-7 inline-flex items-center justify-center rounded-[2px] transition-all duration-200 cursor-pointer",
          mounted && currentTheme === "system"
            ? "bg-[var(--ink)] text-[var(--bg)] shadow-sm"
            : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--panel-2)]",
        )}
      >
        {/* Custom Half Moon / Half Circle icon */}
        <svg
          viewBox="0 0 16 16"
          className="w-3.5 h-3.5 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M8 1a7 7 0 1 0 0 14V1z" />
          <circle
            cx="8"
            cy="8"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </button>
    </div>
  );
}

export default ThemeToggleBox;
