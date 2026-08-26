import i18n from "../i18n";

type MonthCase = "title" | "upper";

type FormatIsoDateLabelOptions = {
  includeDay?: boolean;
  monthCase?: MonthCase;
  locale?: string;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, includeDay: boolean): Intl.DateTimeFormat {
  const cacheKey = `${locale}|${includeDay}`;
  let formatter = formatterCache.get(cacheKey);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      ...(includeDay ? { day: "numeric" } : {}),
      timeZone: "UTC",
    });
    formatterCache.set(cacheKey, formatter);
  }

  return formatter;
}

export function formatIsoDateLabel(
  dateStr: string,
  options: FormatIsoDateLabelOptions = {}
): string {
  const {
    includeDay = true,
    monthCase = "title",
    locale = i18n.resolvedLanguage ?? "en",
  } = options;
  const [year, month, day] = dateStr.split("-");
  const monthIndex = Number(month) - 1;

  if (!year || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return dateStr;
  }

  const withDay = includeDay && Boolean(day);
  const date = new Date(Date.UTC(Number(year), monthIndex, withDay ? Number(day) : 1));

  return getFormatter(locale, withDay)
    .formatToParts(date)
    .map((part) =>
      part.type === "month" && monthCase === "upper" ? part.value.toUpperCase() : part.value
    )
    .join("");
}