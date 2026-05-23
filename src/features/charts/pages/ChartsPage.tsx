import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

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
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.08)",
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
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.08)",
        background: `linear-gradient(140deg, ${accent}24 0%, rgba(255,255,255,0.03) 70%)`,
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

function StoryLayout({ dashboard }: { dashboard: DashboardData }) {
  return (
    <Stack spacing={2}>
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
    </Stack>
  );
}

export default function ChartsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const statsResponse = await getStats();

        if (!active) return;

        setStats(statsResponse);
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

  const dashboard = useMemo(() => (stats ? buildDashboardData(stats) : null), [stats]);
  const released = dashboard?.statusData.find((item) => item.key === "RELEASED")?.value ?? 0;
  const releaseRate = dashboard && dashboard.totalFigurines > 0
    ? Math.round((released / dashboard.totalFigurines) * 100)
    : 0;

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
          COLLECTION ANALYTICS
        </Typography>
        <Typography variant="h3" sx={{ fontSize: { xs: "2rem", md: "2.7rem" }, fontWeight: 900, lineHeight: 1.02 }}>
          Statistics overview
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, maxWidth: 780, color: "rgba(255,255,255,0.72)" }}>
          Get a quick overview of your collection, including total figurines, release status, and how your catalog
          is distributed across categories.
        </Typography>

        {dashboard && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap flexWrap="wrap" sx={{ mt: 2.25 }}>
            <Chip label={`${dashboard.totalFigurines} total figurines`} sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)", fontWeight: 700 }} />
            <Chip label={`${dashboard.totalFigurines - released} pending`} sx={{ bgcolor: "rgba(212,175,55,0.14)", color: "#F3D36B", border: "1px solid rgba(212,175,55,0.24)", fontWeight: 700 }} />
            <Chip label={`${releaseRate}% release rate`} sx={{ bgcolor: "rgba(79,195,247,0.14)", color: "#9FD7F4", border: "1px solid rgba(79,195,247,0.24)", fontWeight: 700 }} />
            <Chip label={`${released} released`} sx={{ bgcolor: "rgba(129,199,132,0.14)", color: "#b8e5ba", border: "1px solid rgba(129,199,132,0.24)", fontWeight: 700 }} />
          </Stack>
        )}
      </Paper>

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
        <StoryLayout dashboard={dashboard} />
      )}
    </Box>
  );
}