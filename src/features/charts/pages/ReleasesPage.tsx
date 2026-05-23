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
  const palette = ["#D4AF37", "#4AA3D8", "#E7A6C7", "#7B61C8", "#C97A3D", "#7FA36B", "#B8C6D9", "#6E7681"];
  const hash = lineup.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function buildChartLineupColors(lineups: string[]) {
  const themedColors: Record<string, string> = {
    "Myth Cloth": "#D4AF37",
    "Myth Cloth EX": "#4AA3D8",
    "Saintia Sho": "#E7A6C7",
    Omega: "#7B61C8",
    Appendix: "#C97A3D",
    Revival: "#7FA36B",
    "Legend of Sanctuary": "#B8C6D9",
    Other: "#6E7681",
  };
  const secondaryLineups = lineups.filter((lineup) => !(lineup in themedColors));

  return Object.fromEntries(
    lineups.map((lineup) => {
      if (themedColors[lineup]) {
        return [lineup, themedColors[lineup]];
      }

      const secondaryIndex = secondaryLineups.indexOf(lineup);
      const hue = Math.round((secondaryIndex * 360) / Math.max(secondaryLineups.length, 1));
      return [lineup, `hsl(${hue} 28% 56%)`];
    }),
  );
}

function getVisibleYears(years: ReleaseYearSummary[]) {
  return [...years]
    .map((year) => ({
      ...year,
      lineUp: year.lineUp.filter((lineup) => lineup.line.trim() !== ""),
    }))
    .sort((a, b) => a.year - b.year)
    .filter((year) => year.lineUp.reduce((sum, lineup) => sum + lineup.count, 0) > 0);
}

function getYearReleaseTotal(year: ReleaseYearSummary) {
  return year.lineUp.reduce((sum, lineup) => sum + lineup.count, 0);
}

function getMonthReleaseTotal(month: ReleaseYearMonthDetail) {
  return month.lineUp.reduce((sum, lineup) => sum + lineup.figurines.length, 0);
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

  const sortedYears = getVisibleYears(years);
  const maxTotal = Math.max(
    ...sortedYears.map((year) => getYearReleaseTotal(year)),
    1,
  );
  const allLineups = Array.from(new Set(sortedYears.flatMap((y) => y.lineUp.map((l) => l.line))));
  const BAR_MAX_H = 200;
  const LABEL_H = 44;
  const selectedYearData = selectedYear ? sortedYears.find((year) => year.year === selectedYear) : null;
  const selectedYearTotal = selectedYearData ? getYearReleaseTotal(selectedYearData) : null;

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid rgba(212, 175, 55, 0.18)",
        background:
          "radial-gradient(circle at top left, rgba(74,163,216,0.2), transparent 28%), radial-gradient(circle at 78% 18%, rgba(212,175,55,0.18), transparent 24%), linear-gradient(180deg, rgba(15,21,34,0.98) 0%, rgba(10,13,21,0.98) 100%)",
        boxShadow: "0 28px 80px rgba(0,0,0,0.28)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle at 12% 24%, rgba(255,255,255,0.22) 0 1px, transparent 1.5px), radial-gradient(circle at 72% 18%, rgba(255,255,255,0.2) 0 1px, transparent 1.5px), radial-gradient(circle at 32% 70%, rgba(255,255,255,0.14) 0 1px, transparent 1.5px), radial-gradient(circle at 84% 64%, rgba(255,255,255,0.16) 0 1px, transparent 1.5px)",
          opacity: 0.7,
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          px: { xs: 2, md: 3 },
          pt: { xs: 2, md: 3 },
          pb: 1,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="overline" sx={{ color: "rgba(212, 175, 55, 0.9)", letterSpacing: 2.2 }}>
            SANCTUARY RELEASE MAP
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            Track every era of Myth Cloth releases at a glance
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Chip
            label={`${sortedYears.length} active years`}
            sx={{
              bgcolor: "rgba(255,255,255,0.08)",
              color: "text.primary",
              border: "1px solid rgba(255,255,255,0.12)",
              fontWeight: 700,
            }}
          />
          <Chip
            label={selectedYearData ? `${selectedYear}: ${selectedYearTotal} releases` : "Select a year to inspect it"}
            sx={{
              bgcolor: selectedYearData ? "rgba(212,175,55,0.14)" : "rgba(74,163,216,0.12)",
              color: selectedYearData ? "#F3D36B" : "#9FD7F4",
              border: selectedYearData ? "1px solid rgba(212,175,55,0.28)" : "1px solid rgba(74,163,216,0.22)",
              fontWeight: 700,
            }}
          />
        </Stack>
      </Box>

      {/* Chart area */}
      <Box sx={{ overflowX: "auto", position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: "6px",
            width: "100%",
            height: BAR_MAX_H + LABEL_H,
            px: { xs: 2, md: 3 },
            pt: 2,
            pb: 1,
          }}
        >
          {sortedYears.map((yearItem) => {
            const total = getYearReleaseTotal(yearItem);
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
                      borderRadius: "10px 10px 2px 2px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      border: isSelected
                        ? "1px solid rgba(255,255,255,0.9)"
                        : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: isSelected
                        ? "0 0 0 2px rgba(255,255,255,0.2), 0 20px 40px rgba(74,163,216,0.28)"
                        : "0 10px 24px rgba(0,0,0,0.28)",
                      transition: "transform 0.18s, border-color 0.18s, box-shadow 0.18s, opacity 0.18s",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.02) 16%, rgba(0,0,0,0.1) 100%)",
                      "&:hover": {
                        opacity: 0.94,
                        transform: "translateY(-6px)",
                        borderColor: "rgba(255,255,255,0.35)",
                        boxShadow: "0 18px 36px rgba(0,0,0,0.34)",
                      },
                    }}
                  >
                    {segmentsAsc.map((l) => (
                      <Box
                        key={l.line}
                        sx={{
                          width: "100%",
                          flex: `${l.count} 0 0`,
                          bgcolor: lineupColors[l.line] ?? getLineupColor(l.line),
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                        }}
                      />
                    ))}
                  </Box>

                  {/* Year label — vertical text */}
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
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
                  <Typography variant="caption" sx={{ mt: 0.5, color: "rgba(255,255,255,0.65)", fontSize: "0.62rem" }}>
                    {total}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Baseline */}
      <Box sx={{ height: 1, bgcolor: "rgba(255,255,255,0.12)", mx: { xs: 2, md: 3 }, mb: 2 }} />

      {/* Legend */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
        {allLineups.map((lineup) => (
          <Box
            key={lineup}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1,
              py: 0.75,
              borderRadius: 99,
              bgcolor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: lineupColors[lineup] ?? getLineupColor(lineup),
                flexShrink: 0,
                boxShadow: `0 0 18px ${(lineupColors[lineup] ?? getLineupColor(lineup))}55`,
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem", fontWeight: 600 }}>
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
        width: 144,
        flexShrink: 0,
        position: "relative",
        bgcolor: "rgba(255,255,255,0.04)",
        border: `1px solid ${lineupColor}44`,
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 18px 36px rgba(0,0,0,0.22)",
        transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
        "&:hover": {
          transform: "translateY(-6px)",
          borderColor: `${lineupColor}88`,
          boxShadow: `0 24px 50px ${lineupColor}22`,
        },
      }}
    >
      {figurine.url ? (
        <Box sx={{ position: "relative" }}>
          <CardMedia
            component="img"
            image={figurine.url}
            alt={figurine.name}
            sx={{ height: 180, objectFit: "cover", objectPosition: "top" }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, transparent 0%, transparent 45%, ${lineupColor}22 100%)`,
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            height: 180,
            bgcolor: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: `radial-gradient(circle at top, ${lineupColor}22, transparent 55%)`,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            No image
          </Typography>
        </Box>
      )}
      <Box sx={{ p: 1.25, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <Box sx={{ width: 28, height: 3, borderRadius: 999, bgcolor: lineupColor, mb: 1 }} />
        <Typography
          variant="caption"
          sx={{ display: "block", lineHeight: 1.35, fontWeight: 700, fontSize: "0.75rem", textAlign: "center" }}
        >
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
  const totalReleases = months.reduce((sum, month) => sum + getMonthReleaseTotal(month), 0);

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 2,
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.08)",
          bgcolor: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Typography variant="overline" sx={{ color: "rgba(212,175,55,0.9)", letterSpacing: 2 }}>
          YEAR OVERVIEW
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {totalReleases} figurines released across {months.length} month{months.length !== 1 ? "s" : ""}.
        </Typography>
      </Box>

      {sortedMonths.map((monthItem, monthIndex) => (
        <Box
          key={`${monthItem.month}-${monthItem.name}`}
          sx={{
            display: "flex",
            gap: { xs: 1.5, md: 2.5 },
            p: { xs: 1.5, md: 2.5 },
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.08)",
            bgcolor: "rgba(8,12,20,0.72)",
            boxShadow: "0 18px 44px rgba(0,0,0,0.22)",
            backdropFilter: "blur(12px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top right, rgba(74,163,216,0.12), transparent 26%), radial-gradient(circle at bottom left, rgba(212,175,55,0.08), transparent 24%)",
              pointerEvents: "none",
            }}
          />
          {/* Timeline spine */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 52, flexShrink: 0, position: "relative", zIndex: 1 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.16)",
                background: "linear-gradient(180deg, rgba(212,175,55,0.3) 0%, rgba(74,163,216,0.18) 100%)",
                mt: 1,
                flexShrink: 0,
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 24px rgba(212,175,55,0.2)",
                color: "text.primary",
                fontSize: "0.78rem",
                fontWeight: 800,
              }}
            >
              {String(monthItem.month).padStart(2, "0")}
            </Box>
            {monthIndex < sortedMonths.length - 1 && (
              <Box
                sx={{
                  width: 2,
                  flex: 1,
                  mt: 0.75,
                  background: "linear-gradient(180deg, rgba(212,175,55,0.28) 0%, rgba(255,255,255,0.06) 100%)",
                }}
              />
            )}
          </Box>

          {/* Month content */}
          <Box sx={{ flex: 1, position: "relative", zIndex: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Box>
                <Typography variant="overline" sx={{ color: "rgba(212,175,55,0.88)", letterSpacing: 1.8 }}>
                  {monthItem.name}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  {getMonthReleaseTotal(monthItem)} release{getMonthReleaseTotal(monthItem) !== 1 ? "s" : ""}
                </Typography>
              </Box>
              <Chip
                label={`${monthItem.lineUp.length} lineup${monthItem.lineUp.length !== 1 ? "s" : ""}`}
                sx={{
                  alignSelf: "flex-start",
                  bgcolor: "rgba(255,255,255,0.05)",
                  color: "text.secondary",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </Stack>
            {monthItem.lineUp.map((lineup) => (
              <Box
                key={`${monthItem.month}-${lineup.line}`}
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.08)",
                  bgcolor: "rgba(255,255,255,0.03)",
                }}
              >
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
                          boxShadow: `inset 0 0 0 1px ${lineupColor}18`,
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
  const visibleSummary = getVisibleYears(summary);
  const totalReleases = visibleSummary.reduce((sum, year) => sum + getYearReleaseTotal(year), 0);
  const lineupColors = buildChartLineupColors(
    Array.from(
      new Set(
        visibleSummary
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
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        minHeight: "100%",
        background:
          "radial-gradient(circle at top, rgba(74,163,216,0.12), transparent 24%), radial-gradient(circle at 82% 12%, rgba(212,175,55,0.12), transparent 18%)",
      }}
    >
      {/* Header */}
      <Paper
        sx={{
          mb: 3,
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          color: "common.white",
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "radial-gradient(circle at top left, rgba(212,175,55,0.18), transparent 26%), radial-gradient(circle at right, rgba(74,163,216,0.18), transparent 24%), linear-gradient(135deg, rgba(9,12,20,0.98) 0%, rgba(16,22,34,0.98) 100%)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "radial-gradient(circle at 16% 22%, rgba(255,255,255,0.2) 0 1px, transparent 1.5px), radial-gradient(circle at 76% 30%, rgba(255,255,255,0.14) 0 1px, transparent 1.5px), radial-gradient(circle at 62% 76%, rgba(255,255,255,0.1) 0 1px, transparent 1.5px)",
          }}
        />
        <Stack spacing={2} sx={{ position: "relative" }}>
          <Box>
            <Typography variant="overline" sx={{ color: "rgba(212,175,55,0.9)", letterSpacing: 2.4 }}>
              CHRONICLE OF RELEASES
            </Typography>
            <Typography variant="h3" sx={{ fontSize: { xs: "2rem", md: "2.8rem" }, fontWeight: 900, lineHeight: 1.02 }}>
              A zodiac-inspired view of your Myth Cloth history
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, maxWidth: 760, color: "rgba(255,255,255,0.72)" }}>
              Explore the collection like a timeline of sagas: each year is stacked by lineup, and each month unfolds into a gallery of releases.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap flexWrap="wrap">
            <Chip label={`${visibleSummary.length} years with releases`} sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)", fontWeight: 700 }} />
            <Chip label={`${totalReleases} total releases`} sx={{ bgcolor: "rgba(212,175,55,0.14)", color: "#F3D36B", border: "1px solid rgba(212,175,55,0.24)", fontWeight: 700 }} />
            <Chip label={`${Object.keys(lineupColors).length} lineups represented`} sx={{ bgcolor: "rgba(74,163,216,0.12)", color: "#9FD7F4", border: "1px solid rgba(74,163,216,0.24)", fontWeight: 700 }} />
          </Stack>
        </Stack>
      </Paper>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Bar chart — always visible */}
      <Paper sx={{ p: 0, mb: 3, borderRadius: 4, bgcolor: "transparent", boxShadow: "none" }}>
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
          <Paper
            sx={{
              mb: 2.5,
              p: { xs: 2, md: 2.5 },
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(135deg, rgba(9,12,20,0.96) 0%, rgba(17,22,32,0.96) 100%)",
              boxShadow: "0 22px 60px rgba(0,0,0,0.24)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="overline" sx={{ color: "rgba(212,175,55,0.9)", letterSpacing: 2 }}>
                  YEAR FOCUS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
                  {selectedYear}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Month-by-month release breakdown with lineup accents and figurine cards.
                </Typography>
              </Box>
              <Chip
                label="Dismiss year"
                onClick={() => handleSelectYear(selectedYear)}
                sx={{
                  cursor: "pointer",
                  bgcolor: "rgba(255,255,255,0.05)",
                  color: "text.secondary",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontWeight: 700,
                  "&:hover": { color: "text.primary", bgcolor: "rgba(255,255,255,0.08)" },
                }}
              />
            </Box>
          </Paper>

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
