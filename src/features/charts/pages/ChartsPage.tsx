import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
  CircularProgress,
  Grid,
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
import { getStats, type StatsResponse } from "../api/statsApi";

const RELEASE_STATUS_META: Record<string, { label: string; color: string }> = {
  ANNOUNCED: { label: "Announced", color: "#4fc3f7" },
  RELEASED: { label: "Released", color: "#81c784" },
  RUMORED: { label: "Rumored", color: "#ffb74d" },
  PROTOTYPE: { label: "Prototype", color: "#90a4ae" },
  UNRELEASED: { label: "Unreleased", color: "#e57373" },
};

type CountDatum = {
  label: string;
  value: number;
  color?: string;
};

type StatusDatum = CountDatum & {
  key: string;
};

type DashboardData = {
  totalFigurines: number;
  statusData: StatusDatum[];
  seriesData: CountDatum[];
  lineupData: CountDatum[];
  groupData: CountDatum[];
  anniversaryData: CountDatum[];
}

function toSortedData(entries: Record<string, number>) {
  return Object.entries(entries)
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
}

function buildDashboardData(stats: StatsResponse): DashboardData {
  const statusData = Object.entries(stats.totalByReleaseStatus)
    .map(([key, value]) => ({
      key,
      label: RELEASE_STATUS_META[key]?.label ?? key,
      color: RELEASE_STATUS_META[key]?.color ?? "#b39ddb",
      value,
    }))
    .sort((left, right) => right.value - left.value);

  return {
    totalFigurines: stats.totalFigurines,
    statusData,
    seriesData: toSortedData(stats.countBySeries),
    lineupData: toSortedData(stats.countByLineUp),
    groupData: toSortedData(stats.countByGroup),
    anniversaryData: toSortedData(stats.countByAnniversary),
  };
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        height: "100%",
        border: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {subtitle}
      </Typography>
      {children}
    </Paper>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.06)",
        background: `linear-gradient(135deg, ${accent}22 0%, rgba(255,255,255,0.02) 75%)`,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.75 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function HorizontalBars({ data }: { data: CountDatum[] }) {
  if (data.length === 0) {
    return (
      <Box sx={{ minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No data available.
        </Typography>
      </Box>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <Stack spacing={1.5}>
      {data.map((item) => (
        <Box key={item.label}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.5 }}>
            <Typography variant="body2">{item.label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {item.value}
            </Typography>
          </Box>
          <Box sx={{ height: 10, borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <Box
              sx={{
                width: `${(item.value / maxValue) * 100}%`,
                height: "100%",
                borderRadius: 999,
                background: item.color
                  ? `linear-gradient(90deg, ${item.color} 0%, ${item.color}cc 100%)`
                  : "linear-gradient(90deg, #d4af37 0%, #f2d272 100%)",
              }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function StatusStack({ data }: { data: StatusDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", height: 18, borderRadius: 999, overflow: "hidden", bgcolor: "rgba(255,255,255,0.08)" }}>
        {data.map((item) => (
          <Box
            key={item.key}
            sx={{
              width: `${total === 0 ? 0 : (item.value / total) * 100}%`,
              bgcolor: item.color,
              transition: "width 0.3s ease",
            }}
          />
        ))}
      </Box>
      <Grid container spacing={1.5}>
        {data.map((item) => (
          <Grid key={item.key} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper sx={{ p: 1.5, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
                <Typography variant="body2">{item.label}</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {item.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function getTopInsight(data: CountDatum[], noun: string) {
  if (data.length === 0) return `No ${noun} data available yet.`;
  const top = data[0];
  return `${top.label} leads with ${top.value} figurines in this category.`;
}

function getLineupColor(lineup: string) {
  const palette = ["#4fc3f7", "#81c784", "#ffb74d", "#ba68c8", "#64b5f6", "#f06292", "#4db6ac", "#ffd54f"];
  const hash = lineup.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function ReleaseYearsSummaryView({
  years,
  onSelectYear,
}: {
  years: ReleaseYearSummary[];
  onSelectYear: (year: number) => void;
}) {
  if (years.length === 0) {
    return (
      <Box sx={{ minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No release timeline data available.
        </Typography>
      </Box>
    );
  }

  const sortedYears = [...years].sort((a, b) => b.year - a.year);
  const maxCount = Math.max(
    ...sortedYears.map((item) => item.lineUp.reduce((sum, line) => sum + line.count, 0)),
    1,
  );

  return (
    <Grid container spacing={1.5}>
      {sortedYears.map((yearItem) => {
        const total = yearItem.lineUp.reduce((sum, line) => sum + line.count, 0);
        const topLineup = [...yearItem.lineUp].sort((a, b) => b.count - a.count)[0];
        return (
          <Grid key={yearItem.year} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
            <Paper
              onClick={() => onSelectYear(yearItem.year)}
              sx={{
                p: 2,
                height: "100%",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.06)",
                bgcolor: "rgba(255,255,255,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                transition: "border-color 0.2s, background 0.2s",
                "&:hover": {
                  borderColor: topLineup ? getLineupColor(topLineup.line) : "rgba(255,255,255,0.18)",
                  bgcolor: "rgba(255,255,255,0.05)",
                },
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
                {yearItem.year}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {total} releases
              </Typography>

              <Box sx={{ height: 6, borderRadius: 999, overflow: "hidden", bgcolor: "rgba(255,255,255,0.08)", mt: "auto" }}>
                <Box sx={{ display: "flex", width: `${(total / maxCount) * 100}%`, height: "100%" }}>
                  {yearItem.lineUp
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map((line) => (
                      <Tooltip key={`${yearItem.year}-${line.line}`} title={`${line.line}: ${line.count}`}>
                        <Box
                          sx={{
                            width: `${total === 0 ? 0 : (line.count / total) * 100}%`,
                            bgcolor: getLineupColor(line.line),
                          }}
                        />
                      </Tooltip>
                    ))}
                </Box>
              </Box>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}

function FigurineImageCard({ figurine, lineupColor }: { figurine: { id: number; name: string; url?: string }; lineupColor: string }) {
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

function ReleaseYearDetailView({ months }: { months: ReleaseYearMonthDetail[] }) {
  if (months.length === 0) {
    return (
      <Box sx={{ minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No monthly releases found for this year.
        </Typography>
      </Box>
    );
  }

  const sortedMonths = [...months].sort((a, b) => a.month - b.month);

  return (
    <Stack spacing={0}>
      {sortedMonths.map((monthItem, monthIndex) => (
        <Box
          key={`${monthItem.month}-${monthItem.name}`}
          sx={{ display: "flex", gap: 2 }}
        >
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
                <Chip
                  size="small"
                  label={lineup.line}
                  sx={{
                    mb: 1,
                    bgcolor: `${getLineupColor(lineup.line)}22`,
                    color: getLineupColor(lineup.line),
                    fontWeight: 700,
                    border: `1px solid ${getLineupColor(lineup.line)}44`,
                  }}
                />
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  {lineup.figurines.map((figurine) => (
                    <FigurineImageCard
                      key={figurine.id}
                      figurine={figurine}
                      lineupColor={getLineupColor(lineup.line)}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function StoryLayout({
  dashboard,
  releaseSummary,
  releaseDetail,
  releaseLoading,
  releaseError,
  selectedYear,
  onSelectYear,
  onBackToSummary,
}: {
  dashboard: DashboardData;
  releaseSummary: ReleaseYearSummary[];
  releaseDetail: ReleaseYearMonthDetail[];
  releaseLoading: boolean;
  releaseError: string | null;
  selectedYear: number | null;
  onSelectYear: (year: number) => void;
  onBackToSummary: () => void;
}) {
  const released = dashboard.statusData.find((item) => item.key === "RELEASED")?.value ?? 0;
  const releaseRate = dashboard.totalFigurines > 0
    ? Math.round((released / dashboard.totalFigurines) * 100)
    : 0;

  return (
    <Stack spacing={2}>
      <Paper
        sx={{
          p: { xs: 2.5, md: 3 },
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(120deg, rgba(212,175,55,0.22) 0%, rgba(79,195,247,0.12) 55%, rgba(129,199,132,0.14) 100%)",
        }}
      >
        <Typography variant="overline" sx={{ letterSpacing: 1.2, color: "text.secondary" }}>
          Collection Story
        </Typography>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.6rem", md: "2.1rem" }, fontWeight: 800, mb: 1 }}>
          The current Myth Cloth catalog in one narrative flow
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 820, mb: 2.5 }}>
          The collection has {dashboard.totalFigurines} figurines total, and {releaseRate}% are already released.
          The sections below highlight where the catalog is concentrated and how status evolves.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard label="Total Figurines" value={String(dashboard.totalFigurines)} accent="#d4af37" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard label="Released" value={String(released)} accent="#81c784" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard label="Release Rate" value={`${releaseRate}%`} accent="#4fc3f7" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard label="Release Status Types" value={String(dashboard.statusData.length)} accent="#ffb74d" />
          </Grid>
        </Grid>
      </Paper>

      <SectionCard
        title="1. Catalog Concentration"
        subtitle={getTopInsight(dashboard.lineupData, "lineup")}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, xl: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Top Lineups
            </Typography>
            <HorizontalBars data={dashboard.lineupData.slice(0, 10)} />
          </Grid>
          <Grid size={{ xs: 12, xl: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Top Series
            </Typography>
            <HorizontalBars data={dashboard.seriesData.slice(0, 10)} />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard
        title="2. Release Journey"
        subtitle={getTopInsight(dashboard.statusData, "release status")}
      >
        <StatusStack data={dashboard.statusData} />
      </SectionCard>

      <SectionCard
        title="3. Character Group Emphasis"
        subtitle={getTopInsight(dashboard.groupData, "group")}
      >
        <HorizontalBars data={dashboard.groupData.slice(0, 12)} />
      </SectionCard>

      <SectionCard
        title="4. Anniversary Presence"
        subtitle={getTopInsight(dashboard.anniversaryData, "anniversary")}
      >
        <HorizontalBars data={dashboard.anniversaryData.slice(0, 12)} />
      </SectionCard>

      <SectionCard
        title="5. Release Timeline"
        subtitle={
          selectedYear
            ? `Monthly release details for ${selectedYear}.`
            : "Yearly release summary by lineup. Click a year to drill down."
        }
      >
        {releaseError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {releaseError}
          </Alert>
        )}

        {selectedYear && (
          <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {selectedYear} detail
            </Typography>
            <Button variant="outlined" size="small" onClick={onBackToSummary}>
              Back to yearly summary
            </Button>
          </Box>
        )}

        {releaseLoading ? (
          <Box sx={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : selectedYear ? (
          <ReleaseYearDetailView months={releaseDetail} />
        ) : (
          <ReleaseYearsSummaryView years={releaseSummary} onSelectYear={onSelectYear} />
        )}
      </SectionCard>
    </Stack>
  );
}

export default function ChartsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [releaseSummary, setReleaseSummary] = useState<ReleaseYearSummary[]>([]);
  const [releaseDetail, setReleaseDetail] = useState<ReleaseYearMonthDetail[]>([]);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const [statsResponse, releaseSummaryResponse] = await Promise.all([
          getStats(),
          getReleaseYearsSummary(),
        ]);

        if (!active) return;

        setStats(statsResponse);
        setReleaseSummary(releaseSummaryResponse);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setErrorMessage("Failed to load statistics. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const handleSelectYear = async (year: number) => {
    setSelectedYear(year);
    setReleaseLoading(true);
    setReleaseError(null);

    try {
      const detail = await getReleaseYearDetail(year);
      setReleaseDetail(detail);
    } catch (error) {
      console.error(error);
      setReleaseError("Failed to load year details. Please try again.");
      setReleaseDetail([]);
    } finally {
      setReleaseLoading(false);
    }
  };

  const handleBackToSummary = () => {
    setSelectedYear(null);
    setReleaseDetail([]);
    setReleaseError(null);
  };

  const dashboard = useMemo(() => (stats ? buildDashboardData(stats) : null), [stats]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 700, mb: 1.5 }}>
          Statistics
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
          Live summary from the backend statistics endpoint for total figurines, release status, and catalog
          breakdowns.
        </Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {loading || !dashboard ? (
        <Box sx={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <StoryLayout
          dashboard={dashboard}
          releaseSummary={releaseSummary}
          releaseDetail={releaseDetail}
          releaseLoading={releaseLoading}
          releaseError={releaseError}
          selectedYear={selectedYear}
          onSelectYear={handleSelectYear}
          onBackToSummary={handleBackToSummary}
        />
      )}
    </Box>
  );
}