import i18n from "../i18n";

export type CurrencyAmountDisplayStyle = "currency" | "symbolCode";

export type FormatCurrencyAmountOptions = {
  locale?: string;
  style?: CurrencyAmountDisplayStyle;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: Intl.NumberFormatOptions["notation"];
  fallbackCurrency?: string;
};

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY"]);

function normalizeCurrencyCode(currency?: string | null, fallbackCurrency = "USD"): string {
  const normalized = currency?.trim().toUpperCase();
  return normalized && normalized.length > 0 ? normalized : fallbackCurrency;
}

function getFractionDigits(
  currencyCode: string,
  options: FormatCurrencyAmountOptions,
): { minimumFractionDigits: number; maximumFractionDigits: number } {
  const providedMin = options.minimumFractionDigits;
  const providedMax = options.maximumFractionDigits;

  if (typeof providedMin === "number" && typeof providedMax === "number") {
    return {
      minimumFractionDigits: providedMin,
      maximumFractionDigits: providedMax,
    };
  }

  const defaults = ZERO_DECIMAL_CURRENCIES.has(currencyCode)
    ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  return {
    minimumFractionDigits: typeof providedMin === "number" ? providedMin : defaults.minimumFractionDigits,
    maximumFractionDigits: typeof providedMax === "number" ? providedMax : defaults.maximumFractionDigits,
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
  const currencyCode = normalizeCurrencyCode(currency, options.fallbackCurrency ?? "USD");

  if (!Number.isFinite(amount)) {
    return `- ${currencyCode}`;
  }

  const locale = options.locale ?? i18n.resolvedLanguage ?? "en-US";
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
