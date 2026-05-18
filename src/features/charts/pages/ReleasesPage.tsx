import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardMedia,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  getReleaseYearDetail,
  getReleaseYearsSummary,
  type ReleaseYearMonthDetail,
  type ReleaseYearSummary,
} from "../api/releaseStatsApi";

function getLineupColor(lineup: string) {
  const palette = ["#4fc3f7", "#81c784", "#ffb74d", "#ba68c8", "#64b5f6", "#f06292", "#4db6ac", "#ffd54f"];
  const hash = lineup.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function buildChartLineupColors(lineups: string[]) {
  const priorityColors: Record<string, string> = {
    "Myth Cloth": "#f6c344",
    "Myth Cloth EX": "#4fc3f7",
  };
  const secondaryLineups = lineups.filter((lineup) => !(lineup in priorityColors));

  return Object.fromEntries(
    lineups.map((lineup) => {
      if (priorityColors[lineup]) {
        return [lineup, priorityColors[lineup]];
      }

      const secondaryIndex = secondaryLineups.indexOf(lineup);
      const hue = Math.round((secondaryIndex * 360) / Math.max(secondaryLineups.length, 1));
      return [lineup, `hsl(${hue} 38% 52%)`];
    }),
  );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

function YearBarChart({
  years,
  selectedYear,
  lineupColors,
  onSelectYear,
}: {
  years: ReleaseYearSummary[];
  selectedYear: number | null;
  lineupColors: Record<string, string>;
  onSelectYear: (year: number) => void;
}) {
  if (years.length === 0) {
    return (
      <Box sx={{ minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No release data available.
        </Typography>
      </Box>
    );
  }

  const sortedYears = [...years].map((y) => ({
    ...y,
    lineUp: y.lineUp.filter((l) => l.line.trim() !== ""),
  })).sort((a, b) => a.year - b.year).filter((y) => y.lineUp.reduce((s, l) => s + l.count, 0) > 0);
  const maxTotal = Math.max(
    ...sortedYears.map((y) => y.lineUp.reduce((s, l) => s + l.count, 0)),
    1,
  );
  const allLineups = Array.from(new Set(sortedYears.flatMap((y) => y.lineUp.map((l) => l.line))));
  const BAR_MAX_H = 200;
  const LABEL_H = 44;

  return (
    <Box>
      {/* Chart area */}
      <Box sx={{ overflowX: "auto" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: "6px",
            width: "100%",
            height: BAR_MAX_H + LABEL_H,
            px: 1,
            pt: 1,
          }}
        >
          {sortedYears.map((yearItem) => {
            const total = yearItem.lineUp.reduce((s, l) => s + l.count, 0);
            const barH = total > 0 ? Math.max((total / maxTotal) * BAR_MAX_H, 8) : 0;
            // ascending so smallest segment is at top, largest at bottom
            const segmentsAsc = [...yearItem.lineUp].sort((a, b) => a.count - b.count);
            const isSelected = selectedYear === yearItem.year;

            return (
              <Tooltip
                key={yearItem.year}
                placement="top"
                title={
                  <Box sx={{ minWidth: 130 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {yearItem.year} · {total} releases
                    </Typography>
                    {[...yearItem.lineUp]
                      .sort((a, b) => b.count - a.count)
                      .map((l) => (
                        <Box key={l.line} sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.3 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: lineupColors[l.line] ?? getLineupColor(l.line),
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="caption">
                            {l.line}: {l.count}
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                }
              >
                <Box
                  onClick={() => onSelectYear(yearItem.year)}
                  sx={{
                    flex: "1 0 42px",
                    minWidth: 42,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  {/* Stacked bar */}
                  <Box
                    sx={{
                      width: "100%",
                      height: barH,
                      borderRadius: "4px 4px 0 0",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      outline: isSelected
                        ? "2px solid rgba(255,255,255,0.85)"
                        : "2px solid transparent",
                      outlineOffset: "2px",
                      transition: "outline-color 0.15s, opacity 0.15s",
                      "&:hover": { opacity: 0.75 },
                    }}
                  >
                    {segmentsAsc.map((l) => (
                      <Box
                        key={l.line}
                        sx={{
                          width: "100%",
                          flex: `${l.count} 0 0`,
                          bgcolor: lineupColors[l.line] ?? getLineupColor(l.line),
                        }}
                      />
                    ))}
                  </Box>

                  {/* Year label — vertical text */}
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.5,
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      fontSize: "0.65rem",
                      lineHeight: 1,
                      height: LABEL_H - 4,
                      color: isSelected ? "text.primary" : "text.secondary",
                      fontWeight: isSelected ? 700 : 400,
                      userSelect: "none",
                    }}
                  >
                    {yearItem.year}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Baseline */}
      <Box sx={{ height: 1, bgcolor: "rgba(255,255,255,0.1)", mx: 1, mb: 2 }} />

      {/* Legend */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, px: 1 }}>
        {allLineups.map((lineup) => (
          <Box key={lineup} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "2px",
                bgcolor: lineupColors[lineup] ?? getLineupColor(lineup),
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
              {lineup}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function FigurineImageCard({
  figurine,
  lineupColor,
}: {
  figurine: { id: number; name: string; url?: string };
  lineupColor: string;
}) {
  return (
    <Card
      sx={{
        width: 130,
        flexShrink: 0,
        bgcolor: "rgba(255,255,255,0.03)",
        border: `1px solid ${lineupColor}44`,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {figurine.url ? (
        <CardMedia
          component="img"
          image={figurine.url}
          alt={figurine.name}
          sx={{ height: 150, objectFit: "cover", objectPosition: "top" }}
        />
      ) : (
        <Box
          sx={{
            height: 150,
            bgcolor: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            No image
          </Typography>
        </Box>
      )}
      <Box sx={{ p: 1 }}>
        <Typography variant="caption" sx={{ display: "block", lineHeight: 1.3, fontWeight: 600 }}>
          {figurine.name}
        </Typography>
      </Box>
    </Card>
  );
}

function ReleaseYearDetailView({
  year,
  months,
  lineupColors,
}: {
  year: number;
  months: ReleaseYearMonthDetail[];
  lineupColors: Record<string, string>;
}) {
  if (months.length === 0) {
    return (
      <Box sx={{ minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No monthly releases found for {year}.
        </Typography>
      </Box>
    );
  }

  const sortedMonths = [...months].sort((a, b) => a.month - b.month);
  const totalReleases = months.reduce(
    (sum, m) => sum + m.lineUp.reduce((s, l) => s + l.figurines.length, 0),
    0,
  );

  return (
    <Stack spacing={0}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {totalReleases} figurines released across {months.length} month{months.length !== 1 ? "s" : ""}.
        </Typography>
      </Box>

      {sortedMonths.map((monthItem, monthIndex) => (
        <Box key={`${monthItem.month}-${monthItem.name}`} sx={{ display: "flex", gap: 2 }}>
          {/* Timeline spine */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "primary.main",
                mt: 2.5,
                flexShrink: 0,
                zIndex: 1,
              }}
            />
            {monthIndex < sortedMonths.length - 1 && (
              <Box sx={{ width: 2, flex: 1, bgcolor: "rgba(255,255,255,0.08)", mt: 0.5 }} />
            )}
          </Box>

          {/* Month content */}
          <Box sx={{ flex: 1, pb: 3 }}>
            <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 1 }}>
              {monthItem.name}
            </Typography>
            {monthItem.lineUp.map((lineup) => (
              <Box key={`${monthItem.month}-${lineup.line}`} sx={{ mt: 1 }}>
                {(() => {
                  const lineupColor = lineupColors[lineup.line] ?? getLineupColor(lineup.line);

                  return (
                    <>
                      <Chip
                        size="small"
                        label={lineup.line}
                        sx={{
                          mb: 1,
                          bgcolor: `${lineupColor}22`,
                          color: lineupColor,
                          fontWeight: 700,
                          border: `1px solid ${lineupColor}44`,
                        }}
                      />
                      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                        {lineup.figurines.map((figurine) => (
                          <FigurineImageCard
                            key={figurine.id}
                            figurine={figurine}
                            lineupColor={lineupColor}
                          />
                        ))}
                      </Box>
                    </>
                  );
                })()}
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

export default function ReleasesPage() {
  const [summary, setSummary] = useState<ReleaseYearSummary[]>([]);
  const [detail, setDetail] = useState<ReleaseYearMonthDetail[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const detailRef = useRef<HTMLDivElement>(null);
  const lineupColors = buildChartLineupColors(
    Array.from(
      new Set(
        summary
          .flatMap((year) => year.lineUp)
          .filter((lineup) => lineup.line.trim() !== "" && lineup.count > 0)
          .map((lineup) => lineup.line),
      ),
    ),
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const data = await getReleaseYearsSummary();
        if (!active) return;
        setSummary(data);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setErrorMessage("Failed to load release summary. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const handleSelectYear = async (year: number) => {
    // Toggle off when clicking the same bar
    if (selectedYear === year) {
      setSelectedYear(null);
      setDetail([]);
      setDetailError(null);
      return;
    }

    setSelectedYear(year);
    setDetailLoading(true);
    setDetailError(null);
    setDetail([]);

    try {
      const data = await getReleaseYearDetail(year);
      setDetail(data);
    } catch (error) {
      console.error(error);
      setDetailError("Failed to load year details. Please try again.");
    } finally {
      setDetailLoading(false);
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 700 }}>
          Release Timeline
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Releases per year stacked by lineup. Click a bar to explore monthly detail.
        </Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Bar chart — always visible */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        {loading ? (
          <Box sx={{ minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <YearBarChart
            years={summary}
            selectedYear={selectedYear}
            lineupColors={lineupColors}
            onSelectYear={handleSelectYear}
          />
        )}
      </Paper>

      {/* Detail section — slides in below chart when a year is selected */}
      {selectedYear && (
        <Box ref={detailRef}>
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {selectedYear}
            </Typography>
            <Typography
              variant="caption"
              onClick={() => handleSelectYear(selectedYear)}
              sx={{
                color: "text.secondary",
                cursor: "pointer",
                textDecoration: "underline",
                "&:hover": { color: "text.primary" },
              }}
            >
              dismiss
            </Typography>
          </Box>

          {detailError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {detailError}
            </Alert>
          )}

          {detailLoading ? (
            <Box sx={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <ReleaseYearDetailView year={selectedYear} months={detail} lineupColors={lineupColors} />
          )}
        </Box>
      )}
    </Box>
  );
}
