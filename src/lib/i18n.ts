import { useMemo } from "react";
import { translations } from "./translations";
import { useFarmStore } from "./store";

/** Resolve a dot-path like "nav.dashboard" inside a nested object. */
function getPath(obj: unknown, path: string): string | undefined {
  let cur: unknown = obj;
  for (const part of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

/**
 * useT() — translation hook wired to settings.language.
 *
 * Fallback chain: selected language → Hindi → English → key itself.
 * (Gujarati / Marathi dictionaries fall back to Hindi where a key
 * is missing, so the shell never renders an empty label.)
 */
export function useT(): (key: string) => string {
  const language = useFarmStore((s) => s.settings.language);

  return useMemo(() => {
    const dict = translations[language];
    const hi = translations.hi;
    const fallbackEn = translations.en;
    return (key: string): string =>
      getPath(dict, key) ?? getPath(hi, key) ?? getPath(fallbackEn, key) ?? key;
  }, [language]);
}

/** Non-hook version for use outside React components. */
export function translate(
  language: keyof typeof translations,
  key: string,
): string {
  const dict = translations[language];
  return (
    getPath(dict, key) ??
    getPath(translations.hi, key) ??
    getPath(translations.en, key) ??
    key
  );
}
