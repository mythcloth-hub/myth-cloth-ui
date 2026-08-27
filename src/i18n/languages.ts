export const SUPPORTED_LANGUAGES = ["en", "mx", "es", "fr"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

const SUPPORTED_LANGUAGE_SET = new Set<SupportedLanguage>(SUPPORTED_LANGUAGES);

export const LANGUAGE_META: Record<SupportedLanguage, { label: string; englishLabel: string; countryCode: string }> = {
  en: { label: "English", englishLabel: "English", countryCode: "US" },
  mx: { label: "Español", englishLabel: "Spanish", countryCode: "MX" },
  es: { label: "Español", englishLabel: "Spanish", countryCode: "ES" },
  fr: { label: "Français", englishLabel: "French", countryCode: "FR" },
};

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return Boolean(value) && SUPPORTED_LANGUAGE_SET.has(value as SupportedLanguage);
}

/** Maps a full tag such as `es-MX` down to the base language we ship translations for. */
export function normalizeLanguage(value: string | null | undefined): SupportedLanguage {
  if (!value) {
    return DEFAULT_LANGUAGE;
  }

  const base = value.split("-")[0].toLowerCase();
  return isSupportedLanguage(base) ? base : DEFAULT_LANGUAGE;
}
