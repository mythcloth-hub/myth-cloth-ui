export const SUPPORTED_CURRENCIES = ["JPY", "MXN", "EUR", "USD", "CNY", "CAD"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = "JPY";

const SUPPORTED_CURRENCY_SET = new Set<SupportedCurrency>(SUPPORTED_CURRENCIES);

const REGION_TO_CURRENCY: Record<string, SupportedCurrency> = {
  JP: "JPY",
  MX: "MXN",
  US: "USD",
  CA: "CAD",
  CN: "CNY",
  AT: "EUR",
  BE: "EUR",
  BG: "EUR",
  CY: "EUR",
  CZ: "EUR",
  DE: "EUR",
  DK: "EUR",
  EE: "EUR",
  ES: "EUR",
  FI: "EUR",
  FR: "EUR",
  GR: "EUR",
  HR: "EUR",
  HU: "EUR",
  IE: "EUR",
  IT: "EUR",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  MT: "EUR",
  NL: "EUR",
  PL: "EUR",
  PT: "EUR",
  RO: "EUR",
  SE: "EUR",
  SI: "EUR",
  SK: "EUR",
};

function getRegionFromLocale(locale: string): string | null {
  try {
    const localeApi = (Intl as typeof Intl & { Locale?: new (tag: string) => { region?: string } }).Locale;
    const parsedRegion = localeApi ? new localeApi(locale).region : undefined;
    if (parsedRegion) {
      return parsedRegion.toUpperCase();
    }
  } catch {
    // Ignore invalid locale formats and fall back to string parsing.
  }

  const normalized = locale.replace(/_/g, "-");
  const parts = normalized.split("-");
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const candidate = parts[index]?.trim();
    if (/^[A-Za-z]{2}$/.test(candidate)) {
      return candidate.toUpperCase();
    }
  }

  return null;
}

export function isSupportedCurrency(value: string | null | undefined): value is SupportedCurrency {
  return Boolean(value) && SUPPORTED_CURRENCY_SET.has(value as SupportedCurrency);
}

export function getCurrencyFromLocale(locale: string): SupportedCurrency | null {
  const region = getRegionFromLocale(locale);
  if (!region) return null;

  return REGION_TO_CURRENCY[region] ?? null;
}

export function getBrowserPreferredCurrency(): SupportedCurrency | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const languageCandidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter((entry): entry is string => Boolean(entry && entry.trim()));

  for (const locale of languageCandidates) {
    const inferredCurrency = getCurrencyFromLocale(locale);
    if (inferredCurrency) {
      return inferredCurrency;
    }
  }

  return null;
}

export function toCurrencyParam(currency: SupportedCurrency | null | undefined): { currency: SupportedCurrency } | undefined {
  if (!currency) {
    return undefined;
  }

  return { currency };
}
