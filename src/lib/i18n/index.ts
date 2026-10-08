"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import type { LanguageCode } from "@/lib/types";
import { en } from "./dict/en";
import { hi } from "./dict/hi";
import { gu } from "./dict/gu";
import { mr } from "./dict/mr";
import { useFarmStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export type Dict = Record<string, string>;

export const dicts: Record<LanguageCode, Dict> = { en, hi, gu, mr };

export const LOCALES: Record<LanguageCode, string> = {
  en: "en-IN",
  hi: "hi-IN",
  gu: "gu-IN",
  mr: "mr-IN",
};

export const LANG_STORAGE_KEY = "kn_lang";

let activeGlobalLang: LanguageCode = "en";

export function getInitialLang(): LanguageCode {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "en" || saved === "hi" || saved === "gu" || saved === "mr") {
      activeGlobalLang = saved;
      return saved;
    }
  } catch {
    /* localStorage access error */
  }
  return "en";
}

/**
 * Global t() function supporting parameters, language fallback to English,
 * and dev-only console warnings.
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  langOverride?: LanguageCode,
): string {
  const activeLang = langOverride ?? activeGlobalLang;
  const dict = dicts[activeLang] ?? dicts.en;
  let text = dict[key];

  if (text === undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[i18n] Missing translation key "${key}" for language "${activeLang}". Falling back to English.`,
      );
    }
    text = dicts.en[key] ?? key;
  }

  if (params && typeof text === "string") {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}

export type Lang = LanguageCode;

/**
 * Return live coverage percentage per language (0-100%).
 */
export function getLangCoverage(): Record<
  LanguageCode,
  { total: number; valid: number; translated: number; pct: number }
> {
  const enTotal = Object.keys(en).length || 1;
  const out = {} as Record<
    LanguageCode,
    { total: number; valid: number; translated: number; pct: number }
  >;
  for (const [code, dict] of Object.entries(dicts) as [LanguageCode, Dict][]) {
    const valid = Object.values(dict).filter((v) => Boolean(v && v.trim())).length;
    out[code] = {
      total: enTotal,
      valid,
      translated: valid,
      pct: Number(((valid / enTotal) * 100).toFixed(1)),
    };
  }
  return out;
}

export interface LangContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  formatNumber: (n: number, opts?: Intl.NumberFormatOptions) => string;
  formatDate: (d: Date | number, opts?: Intl.DateTimeFormatOptions) => string;
  formatTime: (d: Date | number, opts?: Intl.DateTimeFormatOptions) => string;
  coverage: Record<
    LanguageCode,
    { total: number; valid: number; translated: number; pct: number }
  >;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(getInitialLang);
  const storeSetLanguage = useFarmStore((s) => s.setLanguage);

  const applyLang = useCallback(
    (newLang: LanguageCode) => {
      activeGlobalLang = newLang;
      setLangState(newLang);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LANG_STORAGE_KEY, newLang);
        } catch {
          /* ignore */
        }
        document.documentElement.lang = newLang;
        try {
          if (useFarmStore.getState().settings.language !== newLang) {
            storeSetLanguage(newLang);
          }
        } catch {
          /* ignore */
        }
      }
    },
    [storeSetLanguage],
  );

  useEffect(() => {
    const initial = getInitialLang();
    applyLang(initial);

    // Cross-tab storage synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LANG_STORAGE_KEY && e.newValue) {
        if (["en", "hi", "gu", "mr"].includes(e.newValue)) {
          applyLang(e.newValue as LanguageCode);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [applyLang]);

  // Sync if store language changed outside provider
  const storeLang = useFarmStore((s) => s.settings.language);
  useEffect(() => {
    if (storeLang && storeLang !== lang && ["en", "hi", "gu", "mr"].includes(storeLang)) {
      applyLang(storeLang);
    }
  }, [storeLang, lang, applyLang]);

  const locale = LOCALES[lang] ?? "en-IN";

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => t(key, params, lang),
    [lang],
  );

  const formatNumber = useCallback(
    (n: number, opts?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale, opts).format(n),
    [locale],
  );

  const formatDate = useCallback(
    (d: Date | number, opts?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, opts).format(
        typeof d === "number" ? new Date(d) : d,
      ),
    [locale],
  );

  const formatTime = useCallback(
    (d: Date | number, opts?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        ...opts,
      }).format(typeof d === "number" ? new Date(d) : d),
    [locale],
  );

  const coverage = useMemo(() => getLangCoverage(), []);

  const value = useMemo(
    () => ({
      lang,
      setLang: applyLang,
      t: translate,
      locale,
      formatNumber,
      formatDate,
      formatTime,
      coverage,
    }),
    [lang, applyLang, translate, locale, formatNumber, formatDate, formatTime, coverage],
  );

  return React.createElement(LangContext.Provider, { value }, children);
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    const storeLang = useFarmStore.getState().settings?.language || "en";
    const loc = LOCALES[storeLang] ?? "en-IN";
    return {
      lang: storeLang,
      setLang: (l: LanguageCode) => {
        activeGlobalLang = l;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(LANG_STORAGE_KEY, l);
          } catch {}
          document.documentElement.lang = l;
        }
        useFarmStore.getState().setLanguage(l);
      },
      t: (key: string, params?: Record<string, string | number>) =>
        t(key, params, storeLang),
      locale: loc,
      formatNumber: (n: number, opts?: Intl.NumberFormatOptions) =>
        new Intl.NumberFormat(loc, opts).format(n),
      formatDate: (d: Date | number, opts?: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(loc, opts).format(
          typeof d === "number" ? new Date(d) : d,
        ),
      formatTime: (d: Date | number, opts?: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(loc, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          ...opts,
        }).format(typeof d === "number" ? new Date(d) : d),
      coverage: getLangCoverage(),
    };
  }
  return ctx;
}

/**
 * useT() hook matching established hook signature across existing components.
 */
export function useT(): (key: string, params?: Record<string, string | number>) => string {
  const { t: tr } = useLang();
  return tr;
}

/**
 * Header switcher [EN][हिं][ગુ][मरा] applying instantly without reload,
 * setting document.documentElement.lang and driving Intl locale for dates/numbers.
 */
export function HeaderLangSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLang();

  const options: Array<{ code: LanguageCode; label: string; full: string }> = [
    { code: "en", label: "EN", full: "English" },
    { code: "hi", label: "हिं", full: "हिंदी" },
    { code: "gu", label: "ગુ", full: "ગુજરાતી" },
    { code: "mr", label: "मरा", full: "मराठी" },
  ];

  return React.createElement(
    "div",
    {
      role: "group",
      "aria-label": "Language Selector",
      className: cn(
        "inline-flex items-center border border-[var(--line)] bg-[var(--panel-2)] p-0.5 font-editorial-mono text-[11px]",
        className,
      ),
    },
    options.map((opt) => {
      const isActive = lang === opt.code;
      return React.createElement(
        "button",
        {
          key: opt.code,
          type: "button",
          onClick: () => setLang(opt.code),
          title: opt.full,
          "aria-pressed": isActive,
          className: cn(
            "px-2 py-1 font-bold transition-all cursor-pointer select-none",
            isActive
              ? "bg-[var(--terra)] text-white shadow-sm"
              : "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--panel)]",
          ),
        },
        opt.label,
      );
    }),
  );
}
