export type CurrencyAmountDisplayStyle = "currency" | "symbolCode";

export type FormatCurrencyAmountOptions = {
  locale?: string;
  style?: CurrencyAmountDisplayStyle;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: Intl.NumberFormatOptions["notation"];
  fallbackCurrency?: string;
};

const DEFAULT_FALLBACK_CURRENCY = "JPY";
const ZERO_DECIMAL_CURRENCIES = new Set(["JPY"]);

function normalizeCurrencyCode(currency?: string | null, fallbackCurrency = DEFAULT_FALLBACK_CURRENCY): string {
  const normalized = currency?.trim().toUpperCase();
  return normalized && normalized.length > 0 ? normalized : fallbackCurrency;
}

function getFractionDigits(
  currencyCode: string,
  options: FormatCurrencyAmountOptions,
): { minimumFractionDigits: number; maximumFractionDigits: number } {
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currencyCode);
  const defaultDigits = isZeroDecimal ? 0 : 2;

  const providedMin = options.minimumFractionDigits;
  const providedMax = options.maximumFractionDigits;

  if (typeof providedMin === "number" && typeof providedMax === "number") {
    return {
      minimumFractionDigits: Math.min(providedMin, providedMax),
      maximumFractionDigits: Math.max(providedMin, providedMax),
    };
  }

  if (typeof providedMin === "number") {
    return {
      minimumFractionDigits: providedMin,
      maximumFractionDigits: Math.max(providedMin, defaultDigits),
    };
  }

  if (typeof providedMax === "number") {
    return {
      minimumFractionDigits: Math.min(defaultDigits, providedMax),
      maximumFractionDigits: providedMax,
    };
  }

  return {
    minimumFractionDigits: defaultDigits,
    maximumFractionDigits: defaultDigits,
  };
}

function getCurrencySymbol(currencyCode: string, locale: string, minimumFractionDigits: number, maximumFractionDigits: number): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits,
      maximumFractionDigits,
    }).formatToParts(1);

    const symbolPart = parts.find((part) => part.type === "currency")?.value;
    return symbolPart ?? currencyCode;
  } catch {
    return currencyCode;
  }
}

export function formatCurrencyAmount(
  amount: number,
  currency?: string | null,
  options: FormatCurrencyAmountOptions = {},
): string {
  const currencyCode = normalizeCurrencyCode(currency, options.fallbackCurrency ?? DEFAULT_FALLBACK_CURRENCY);

  if (!Number.isFinite(amount)) {
    return `- ${currencyCode}`;
  }

  const locale = options.locale ?? "en-US";
  const displayStyle = options.style ?? "currency";
  const { minimumFractionDigits, maximumFractionDigits } = getFractionDigits(currencyCode, options);

  if (displayStyle === "symbolCode") {
    try {
      const formattedAmount = new Intl.NumberFormat(locale, {
        notation: options.notation,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount);
      const symbol = getCurrencySymbol(currencyCode, locale, minimumFractionDigits, maximumFractionDigits);
      return `${symbol}${formattedAmount} ${currencyCode}`;
    } catch {
      return `${amount.toFixed(maximumFractionDigits)} ${currencyCode}`;
    }
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      notation: options.notation,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    return `${amount.toFixed(maximumFractionDigits)} ${currencyCode}`;
  }
}
