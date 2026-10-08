export * from "./i18n/index";
import { t } from "./i18n/index";
import type { LanguageCode } from "./types";

/** Legacy non-hook translation helper outside React components */
export function translate(language: LanguageCode, key: string): string {
  return t(key, undefined, language);
}
