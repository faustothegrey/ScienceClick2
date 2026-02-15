export interface Term {
  id: string;
  translations: Record<string, string>;
  defaultLocale: string;
}

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "wo", label: "Wolof" },
] as const;

/**
 * Returns the best available label for a term in the given locale.
 * Falls back to defaultLocale, then any available translation.
 */
export function getTermLabel(term: Term, locale: string): string {
  if (term.translations[locale]) return term.translations[locale];
  if (term.translations[term.defaultLocale]) return term.translations[term.defaultLocale];
  const keys = Object.keys(term.translations);
  return keys.length > 0 ? term.translations[keys[0]] : "";
}

/**
 * Migrates a term from old { label } format to new { translations, defaultLocale } format.
 * If already in the new format, returns as-is.
 */
export function migrateTerm(raw: Record<string, unknown>): Term {
  if (raw.translations && raw.defaultLocale) {
    return raw as unknown as Term;
  }
  return {
    id: raw.id as string,
    translations: { en: (raw.label as string) ?? "" },
    defaultLocale: "en",
  };
}
