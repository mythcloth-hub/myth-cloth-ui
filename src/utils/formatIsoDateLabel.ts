type MonthCase = "title" | "upper";

type FormatIsoDateLabelOptions = {
  includeDay?: boolean;
  monthCase?: MonthCase;
};

const MONTHS_TITLE = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatIsoDateLabel(
  dateStr: string,
  options: FormatIsoDateLabelOptions = {}
): string {
  const { includeDay = true, monthCase = "title" } = options;
  const [year, month, day] = dateStr.split("-");
  const monthIndex = Number(month) - 1;

  if (!year || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return dateStr;
  }

  const monthLabel = monthCase === "upper"
    ? MONTHS_TITLE[monthIndex].toUpperCase()
    : MONTHS_TITLE[monthIndex];

  if (includeDay && day) {
    return `${monthLabel} ${day}, ${year}`;
  }

  return `${monthLabel} ${year}`;
}