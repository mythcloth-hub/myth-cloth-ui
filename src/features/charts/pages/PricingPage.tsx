import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  getReleaseYearPriceStats,
  type ReleaseYearPriceStats,
} from "../api/priceStatsApi";

type PriceSummary = {
  totalReleases: number;
  weightedAverage: number;
  highestPrice: number;
  lowestPrice: number;
  firstYear: number;
  lastYear: number;
};

function formatCurrency(value: number) {
  const compactValue = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

  return `${compactValue} JPY`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function buildSummary(data: ReleaseYearPriceStats[]): PriceSummary | null {
  if (data.length === 0) {
    return null;
  }

  const sorted = [...data].sort((a, b) => a.year - b.year);
  const totalReleases = sorted.reduce((sum, row) => sum + row.releaseCount, 0);
  const totalAverageWeight = sorted.reduce(
    (sum, row) => sum + row.averageReleasePrice * row.releaseCount,
    0,
  );

  return {
    totalReleases,
    weightedAverage: totalReleases > 0 ? totalAverageWeight / totalReleases : 0,
    highestPrice: Math.max(...sorted.map((row) => row.highestReleasePrice)),
    lowestPrice: Math.min(...sorted.map((row) => row.lowestReleasePrice)),
    firstYear: sorted[0].year,
    lastYear: sorted[sorted.length - 1].year,
  };
}

function PriceMetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        background: `linear-gradient(140deg, ${accent}24 0%, rgba(255,255,255,0.03) 70%)`,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.75, fontWeight: 800 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function PriceTrendChart({
  data,
  selectedYear,
  onSelectYear,
}: {
  data: ReleaseYearPriceStats[];
  selectedYear: number | null;
  onSelectYear: (year: number) => void;
}) {
  if (data.length === 0) {
    return (
      <Box sx={{ minHeight: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No pricing data available.
        </Typography>
      </Box>
    );
  }

  const sorted = [...data].sort((a, b) => a.year - b.year);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const width = Math.max(sorted.length * 54, 760);
  const height = 320;
  const margin = { top: 22, right: 20, bottom: 52, left: 62 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const minPrice = Math.min(...sorted.map((row) => row.lowestReleasePrice));
  const maxPrice = Math.max(...sorted.map((row) => row.highestReleasePrice));
  const safeRange = Math.max(maxPrice - minPrice, 1);

  const xStep = sorted.length > 1 ? plotWidth / (sorted.length - 1) : 0;
  const toX = (index: number) => margin.left + index * xStep;
  const toY = (price: number) => margin.top + ((maxPrice - price) / safeRange) * plotHeight;

  const points = sorted.map((row, index) => ({
    ...row,
    x: toX(index),
    yLow: toY(row.lowestReleasePrice),
    yAvg: toY(row.averageReleasePrice),
    yHigh: toY(row.highestReleasePrice),
  }));

  const toPolyline = (coords: Array<{ x: number; y: number }>) => coords.map((point) => `${point.x},${point.y}`).join(" ");

  const lowLine = toPolyline(points.map((point) => ({ x: point.x, y: point.yLow })));
  const avgLine = toPolyline(points.map((point) => ({ x: point.x, y: point.yAvg })));
  const highLine = toPolyline(points.map((point) => ({ x: point.x, y: point.yHigh })));

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, index) => {
    const ratio = index / (tickCount - 1);
    const value = maxPrice - safeRange * ratio;
    return {
      value,
      y: margin.top + plotHeight * ratio,
    };
  });

  const hoveredYearData = hoveredYear !== null
    ? sorted.find((row) => row.year === hoveredYear) ?? null
    : null;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Chip
          size="small"
          label="High"
          sx={{ bgcolor: "rgba(129,199,132,0.16)", color: "#b8e5ba", border: "1px solid rgba(129,199,132,0.28)" }}
        />
        <Chip
          size="small"
          label="Average"
          sx={{ bgcolor: "rgba(79,195,247,0.16)", color: "#9fd7f4", border: "1px solid rgba(79,195,247,0.28)" }}
        />
        <Chip
          size="small"
          label="Low"
          sx={{ bgcolor: "rgba(255,183,77,0.16)", color: "#ffd7a2", border: "1px solid rgba(255,183,77,0.28)" }}
        />
      </Stack>

      <Paper
        sx={{
          p: 1.25,
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.08)",
          bgcolor: "rgba(255,255,255,0.02)",
        }}
      >
        {hoveredYearData ? (
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap">
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {hoveredYearData.year}
            </Typography>
            <Typography variant="caption" sx={{ color: "#b8e5ba" }}>
              High: {hoveredYearData.highestPriceFigurines?.name ?? "N/A"} ({formatCurrency(hoveredYearData.highestReleasePrice)})
            </Typography>
            <Typography variant="caption" sx={{ color: "#ffd7a2" }}>
              Low: {hoveredYearData.lowestPriceFigurines?.name ?? "N/A"} ({formatCurrency(hoveredYearData.lowestReleasePrice)})
            </Typography>
          </Stack>
        ) : (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Hover a year in the chart to preview its highest and lowest price figurines.
          </Typography>
        )}
      </Paper>

      <Box sx={{ overflowX: "auto", pb: 1 }}>
        <Box sx={{ width, minWidth: "100%" }}>
          <svg width={width} height={height} role="img" aria-label="Price trends by year">
            {yTicks.map((tick) => (
              <g key={tick.y}>
                <line
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={tick.y}
                  y2={tick.y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="3 4"
                />
                <text
                  x={margin.left - 10}
                  y={tick.y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.62)"
                  fontSize="11"
                >
                  {formatCurrency(tick.value)}
                </text>
              </g>
            ))}

            {points.map((point, index) => (
              <g key={point.year}>
                <line
                  x1={point.x}
                  x2={point.x}
                  y1={margin.top}
                  y2={height - margin.bottom}
                  stroke="transparent"
                  strokeWidth="24"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectYear(point.year)}
                  onMouseEnter={() => setHoveredYear(point.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                />
                <line
                  x1={point.x}
                  x2={point.x}
                  y1={point.yHigh}
                  y2={point.yLow}
                  stroke={selectedYear === point.year ? "rgba(212,175,55,0.8)" : "rgba(212,175,55,0.35)"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectYear(point.year)}
                  onMouseEnter={() => setHoveredYear(point.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                />
                {(index === 0 || index === points.length - 1 || index % 2 === 0) && (
                  <text
                    x={point.x}
                    y={height - 14}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.7)"
                    fontSize="11"
                  >
                    {point.year}
                  </text>
                )}
              </g>
            ))}

            <polyline fill="none" stroke="rgba(129,199,132,0.95)" strokeWidth="2.4" points={highLine} />
            <polyline fill="none" stroke="rgba(79,195,247,1)" strokeWidth="2.4" points={avgLine} />
            <polyline fill="none" stroke="rgba(255,183,77,1)" strokeWidth="2.2" points={lowLine} />

            {points.map((point) => (
              <g key={`${point.year}-points`}>
                <circle
                  cx={point.x}
                  cy={point.yHigh}
                  r={selectedYear === point.year ? "4" : "2.6"}
                  fill="rgba(129,199,132,1)"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectYear(point.year)}
                  onMouseEnter={() => setHoveredYear(point.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                />
                <circle
                  cx={point.x}
                  cy={point.yAvg}
                  r={selectedYear === point.year ? "4.2" : "2.8"}
                  fill="rgba(79,195,247,1)"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectYear(point.year)}
                  onMouseEnter={() => setHoveredYear(point.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                />
                <circle
                  cx={point.x}
                  cy={point.yLow}
                  r={selectedYear === point.year ? "3.8" : "2.4"}
                  fill="rgba(255,183,77,1)"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectYear(point.year)}
                  onMouseEnter={() => setHoveredYear(point.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                />
                <title>
                  {`${point.year}\nHigh: ${point.highestPriceFigurines?.name ?? "N/A"} (${formatCurrency(point.highestReleasePrice)})\nLow: ${point.lowestPriceFigurines?.name ?? "N/A"} (${formatCurrency(point.lowestReleasePrice)})`}
                </title>
              </g>
            ))}
          </svg>
        </Box>
      </Box>
    </Stack>
  );
}

function YearExtremeCard({
  title,
  figurine,
  price,
  accent,
}: {
  title: string;
  figurine?: ReleaseYearPriceStats["highestPriceFigurines"] | null;
  price: number;
  accent: string;
}) {
  return (
    <Paper
      sx={{
        p: 1.5,
        borderRadius: 3,
        border: `1px solid ${accent}55`,
        background: `linear-gradient(150deg, ${accent}22 0%, rgba(255,255,255,0.02) 70%)`,
      }}
    >
      <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: 0.5 }}>
        {title}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 1 }}>
        <Box
          sx={{
            width: { xs: "100%", sm: 84 },
            height: 84,
            flexShrink: 0,
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            bgcolor: "rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {figurine?.url ? (
            <Box
              component="img"
              src={figurine.url}
              alt={figurine.name}
              sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              No image
            </Typography>
          )}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {figurine?.name ?? "No figurine data"}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.4 }}>
            {figurine?.id ? `ID ${figurine.id}` : "ID not available"}
          </Typography>
          <Chip
            size="small"
            label={formatCurrency(price)}
            sx={{ mt: 1, bgcolor: `${accent}33`, color: "text.primary", border: `1px solid ${accent}55` }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}

function ReleaseCountBars({ data }: { data: ReleaseYearPriceStats[] }) {
  if (data.length === 0) {
    return null;
  }

  const sorted = [...data].sort((a, b) => a.year - b.year);
  const maxCount = Math.max(...sorted.map((row) => row.releaseCount), 1);

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ minWidth: sorted.length * 32, px: 0.5, pt: 1 }}>
        {sorted.map((row, index) => {
          const barHeight = Math.max((row.releaseCount / maxCount) * 90, 8);
          const showYear = index === 0 || index === sorted.length - 1 || index % 2 === 0;

          return (
            <Box key={row.year} sx={{ width: 24, textAlign: "center", flexShrink: 0 }}>
              <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "rgba(255,255,255,0.72)", fontSize: "0.65rem" }}>
                {formatCount(row.releaseCount)}
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  height: barHeight,
                  borderRadius: "8px 8px 3px 3px",
                  background: "linear-gradient(180deg, rgba(212,175,55,0.95) 0%, rgba(212,175,55,0.45) 100%)",
                  border: "1px solid rgba(212,175,55,0.4)",
                }}
              />
              <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "rgba(255,255,255,0.58)", fontSize: "0.62rem" }}>
                {showYear ? row.year : ""}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export default function PricingPage() {
  const [priceData, setPriceData] = useState<ReleaseYearPriceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = await getReleaseYearPriceStats();
        if (!active) return;
        setPriceData(response);
        const sortedYears = [...response].sort((a, b) => a.year - b.year);
        if (sortedYears.length > 0) {
          setSelectedYear((current) => current ?? sortedYears[sortedYears.length - 1].year);
        }
      } catch (error) {
        console.error(error);
        if (!active) return;
        setErrorMessage("Failed to load pricing analysis. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => buildSummary(priceData), [priceData]);
  const selectedYearData = useMemo(() => {
    if (priceData.length === 0) return null;

    if (selectedYear !== null) {
      const match = priceData.find((row) => row.year === selectedYear);
      if (match) return match;
    }

    return [...priceData].sort((a, b) => b.year - a.year)[0];
  }, [priceData, selectedYear]);

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        minHeight: "100%",
        background:
          "radial-gradient(circle at top left, rgba(212,175,55,0.1), transparent 24%), radial-gradient(circle at 85% 8%, rgba(79,195,247,0.1), transparent 20%)",
      }}
    >
      <Paper
        sx={{
          mb: 3,
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "radial-gradient(circle at top left, rgba(212,175,55,0.14), transparent 26%), radial-gradient(circle at right, rgba(79,195,247,0.14), transparent 24%), linear-gradient(135deg, rgba(10,14,22,0.98) 0%, rgba(15,20,31,0.98) 100%)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
        }}
      >
        <Typography variant="overline" sx={{ color: "rgba(212,175,55,0.9)", letterSpacing: 2.2 }}>
          PRICE ANALYSIS
        </Typography>
        <Typography variant="h3" sx={{ fontSize: { xs: "2rem", md: "2.7rem" }, fontWeight: 900, lineHeight: 1.02 }}>
          Release pricing by year
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, maxWidth: 780, color: "rgba(255,255,255,0.72)" }}>
          This section tracks yearly release prices with average, highest, lowest, and release volume metrics.
          It is prepared to include additional pricing indicators as new endpoints are added.
        </Typography>

        {summary && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2.5 }}>
            <Box sx={{ flex: 1 }}>
              <PriceMetricCard
                label="Year range"
                value={`${summary.firstYear} - ${summary.lastYear}`}
                accent="#d4af37"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <PriceMetricCard
                label="Weighted average"
                value={formatCurrency(summary.weightedAverage)}
                accent="#4fc3f7"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <PriceMetricCard
                label="Absolute range"
                value={`${formatCurrency(summary.lowestPrice)} - ${formatCurrency(summary.highestPrice)}`}
                accent="#81c784"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <PriceMetricCard
                label="Total releases"
                value={formatCount(summary.totalReleases)}
                accent="#ffb74d"
              />
            </Box>
          </Stack>
        )}
      </Paper>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Paper
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Yearly pricing snapshot
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Trend chart shows low, average, and high prices for each year, plus release volume distribution.
        </Typography>

        {loading ? (
          <Box sx={{ minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            <PriceTrendChart
              data={priceData}
              selectedYear={selectedYearData?.year ?? null}
              onSelectYear={setSelectedYear}
            />
            {selectedYearData && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "1.15fr 0.85fr" },
                  gap: 1.5,
                }}
              >
                <Paper
                  sx={{
                    p: { xs: 1.5, md: 2 },
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: "rgba(255,255,255,0.02)",
                    position: { xs: "static", lg: "sticky" },
                    top: { lg: 20 },
                    alignSelf: "start",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Year focus: {selectedYearData.year}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 1.5 }}>
                    Snapshot for the selected year with key price metrics and release activity.
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <PriceMetricCard
                      label="Average price"
                      value={formatCurrency(selectedYearData.averageReleasePrice)}
                      accent="#4fc3f7"
                    />
                    <PriceMetricCard
                      label="Release count"
                      value={formatCount(selectedYearData.releaseCount)}
                      accent="#d4af37"
                    />
                    <PriceMetricCard
                      label="Highest"
                      value={formatCurrency(selectedYearData.highestReleasePrice)}
                      accent="#81c784"
                    />
                    <PriceMetricCard
                      label="Spread (high-low)"
                      value={formatCurrency(selectedYearData.highestReleasePrice - selectedYearData.lowestReleasePrice)}
                      accent="#ffb74d"
                    />
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Releases per year
                  </Typography>
                  <ReleaseCountBars data={priceData} />
                </Paper>

                <Paper
                  sx={{
                    p: { xs: 1.5, md: 2 },
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Price extremes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 1.5 }}>
                    Highest and lowest priced figurines for {selectedYearData.year}.
                  </Typography>

                  <Stack spacing={1.5}>
                    <YearExtremeCard
                      title="Highest price figurine"
                      figurine={selectedYearData.highestPriceFigurines}
                      price={selectedYearData.highestReleasePrice}
                      accent="#81c784"
                    />
                    <YearExtremeCard
                      title="Lowest price figurine"
                      figurine={selectedYearData.lowestPriceFigurines}
                      price={selectedYearData.lowestReleasePrice}
                      accent="#ffb74d"
                    />
                  </Stack>
                </Paper>
              </Box>
            )}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
