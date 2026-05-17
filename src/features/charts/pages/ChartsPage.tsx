import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
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
        const response = await getStats();

        if (!active) return;

        setStats(response);
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

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" }, fontWeight: 700 }}>
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
        <>
          <SectionCard
            title="Collection Stats"
            subtitle="Statistics loaded from /api/v1/stats."
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <MetricCard label="Total Figurines" value={String(dashboard.totalFigurines)} accent="#d4af37" />
              </Grid>
            </Grid>
          </SectionCard>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <SectionCard
                title="Lineup Distribution"
                subtitle="Count of figurines by lineup."
              >
                <HorizontalBars data={dashboard.lineupData} />
              </SectionCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <SectionCard
                title="Series Distribution"
                subtitle="Count of figurines by series."
              >
                <HorizontalBars data={dashboard.seriesData} />
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <SectionCard
                title="Group Distribution"
                subtitle="Count of figurines by group."
              >
                <HorizontalBars data={dashboard.groupData} />
              </SectionCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <SectionCard
                title="Anniversary Distribution"
                subtitle="Count of figurines by anniversary."
              >
                <HorizontalBars data={dashboard.anniversaryData} />
              </SectionCard>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <SectionCard
                title="Release Status Mix"
                subtitle="Distribution of announced, released, prototype, unreleased, and rumored figurines."
              >
                <StatusStack data={dashboard.statusData} />
              </SectionCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}