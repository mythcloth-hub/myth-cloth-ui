import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Snackbar,
  Alert,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";

import { getFigurines } from "../api/figurineApi";
import { lineupsApi, seriesApi, groupsApi } from "../../catalogs/api/catalogApi";
import type { Catalog } from "../../catalogs/types/catalog";
import type { Figurine } from "../types/figurine";

const PAGE_SIZE = 12;

type Badge = { label: string; color: "warning" | "info" | "success" | "error" | "default" };

function getBadges(f: Figurine): Badge[] {
  const badges: Badge[] = [];
  if (f.isOriginalColorEdition) badges.push({ label: "OCE",          color: "warning" });
  if (f.isRevival)              badges.push({ label: "Revival",      color: "info"    });
  if (f.isBattleDamaged)        badges.push({ label: "Battle Dmg",   color: "error"   });
  if (f.isMetalBody)            badges.push({ label: "Metal Body",   color: "default" });
  if (f.isGoldenArmor)          badges.push({ label: "Gold Armor",   color: "warning" });
  if (f.isGold24kEdition)       badges.push({ label: "Gold 24K",     color: "warning" });
  if (f.isMangaVersion)         badges.push({ label: "Manga",        color: "info"    });
  if (f.isPlainCloth)           badges.push({ label: "Plain Cloth",  color: "default" });
  if (f.isMultiPack)            badges.push({ label: "Multi-Pack",   color: "success" });
  return badges;
}

function FigurineCard({ figurine, onClick }: { figurine: Figurine; onClick: () => void }) {
  const imageUrl = figurine.officialImageUrls?.[0] ?? null;
  const badges = getBadges(figurine);

  return (
    <Card
      onClick={onClick}
      sx={
        {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 12px 40px rgba(212, 175, 55, 0.25)",
          borderColor: "rgba(212, 175, 55, 0.5)",
        },
      }}
    >
      {/* Image area */}
      <Box sx={{ position: "relative", paddingTop: "120%", bgcolor: "#0a0b14", flexShrink: 0 }}>
        {imageUrl ? (
          <CardMedia
            component="img"
            image={imageUrl}
            alt={figurine.name}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 1,
              color: "text.secondary",
            }}
          >
            <ImageNotSupportedOutlinedIcon sx={{ fontSize: 48, opacity: 0.3 }} />
            <Typography variant="caption" sx={{ opacity: 0.4 }}>
              No image
            </Typography>
          </Box>
        )}

        {/* Bottom gradient overlay */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "45%",
            background: "linear-gradient(transparent, rgba(10, 11, 20, 0.92))",
            pointerEvents: "none",
          }}
        />

        {/* Edition badges – top-right corner */}
        {badges.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 0.5,
            }}
          >
            {badges.map((b) => (
              <Chip
                key={b.label}
                label={b.label}
                color={b.color}
                size="small"
                sx={{
                  fontSize: "0.6rem",
                  height: 18,
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                  opacity: 0.92,
                }}
              />
            ))}
          </Box>
        )}

        {/* Lineup badge – bottom-left inside image */}
        <Box sx={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <Typography
            variant="caption"
            sx={{
              color: "primary.main",
              fontWeight: 700,
              fontSize: "0.65rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {figurine.lineUp.description}
          </Typography>
        </Box>
      </Box>

      {/* Card content */}
      <CardContent sx={{ flexGrow: 1, p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          noWrap
          title={figurine.name}
          sx={{ color: "text.primary", mb: 0.5, lineHeight: 1.3 }}
        >
          {figurine.name}
        </Typography>

        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mb: 0.25, fontSize: "0.7rem" }}
          noWrap
          title={figurine.series.description}
        >
          {figurine.series.description}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: "rgba(212, 175, 55, 0.55)",
            display: "block",
            fontSize: "0.68rem",
          }}
          noWrap
          title={figurine.group.description}
        >
          {figurine.group.description}
        </Typography>
      </CardContent>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card sx={{ height: "100%" }}>
      <Skeleton variant="rectangular" sx={{ paddingTop: "120%" }} />
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Skeleton variant="text" width="80%" height={18} />
        <Skeleton variant="text" width="60%" height={14} sx={{ mt: 0.5 }} />
        <Skeleton variant="text" width="50%" height={14} sx={{ mt: 0.25 }} />
      </CardContent>
    </Card>
  );
}

// How many results per page when browsing normally or searching
const SEARCH_BATCH = 5000; // fetch all to enable full-collection search

export default function FigurineCollectionPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query  = searchParams.get("q")      ?? "";
  const lineup  = searchParams.get("lineup") ?? "";
  const series  = searchParams.get("series") ?? "";
  const group   = searchParams.get("group")  ?? "";
  const revival  = searchParams.get("revival") ?? "";
  const page    = Number(searchParams.get("page") ?? "1");

  // Normal-mode state (paginated from server)
  const [figurines,     setFigurines]     = useState<Figurine[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [totalPages,    setTotalPages]    = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter-mode state (full collection cached locally)
  const [allFigurines,  setAllFigurines]  = useState<Figurine[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const allFetched = useRef(false);

  // Lineup, series & group options for the dropdowns
  const [lineupOptions, setLineupOptions] = useState<Catalog[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<Catalog[]>([]);
  const [groupOptions,  setGroupOptions]  = useState<Catalog[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFilterMode = Boolean(query) || Boolean(lineup) || Boolean(series) || Boolean(group) || Boolean(revival);

  // Fetch dropdown options once on mount
  useEffect(() => {
    lineupsApi.getAll().then(setLineupOptions).catch(console.error);
    seriesApi.getAll().then(setSeriesOptions).catch(console.error);
    groupsApi.getAll().then(setGroupOptions).catch(console.error);
  }, []);

  // Fetch paginated data (normal browse mode)
  useEffect(() => {
    if (isFilterMode) return;
    setLoading(true);
    setFigurines([]);
    getFigurines(page - 1, PAGE_SIZE)
      .then((data) => {
        setFigurines(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Failed to load figurines. Please check your connection and try again.");
      })
      .finally(() => setLoading(false));
  }, [page, isFilterMode]);

  // Fetch full collection once when filter mode is first activated
  useEffect(() => {
    if (!isFilterMode || allFetched.current) return;
    setFilterLoading(true);
    getFigurines(0, SEARCH_BATCH)
      .then((data) => {
        setAllFigurines(data.content);
        allFetched.current = true;
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Failed to load figurines for filtering.");
      })
      .finally(() => setFilterLoading(false));
  }, [isFilterMode]);

  // Apply all active filters client-side
  const filteredFigurines = useMemo(() => {
    if (!isFilterMode) return [];
    let results = allFigurines;
    if (query) {
      const q = query.toLowerCase();
      results = results.filter((f) => f.name.toLowerCase().includes(q));
    }
    if (lineup) {
      results = results.filter((f) => String(f.lineUp.id) === lineup);
    }
    if (series) {
      results = results.filter((f) => String(f.series.id) === series);
    }
    if (group) {
      results = results.filter((f) => String(f.group.id) === group);
    }
    if (revival === "true")  results = results.filter((f) => f.isRevival === true);
    if (revival === "false") results = results.filter((f) => f.isRevival === false);
    return results;
  }, [query, lineup, series, group, revival, allFigurines, isFilterMode]);

  const filterTotalPages = Math.ceil(filteredFigurines.length / PAGE_SIZE);
  const filterPageItems  = filteredFigurines.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Unified display values
  const displayLoading = isFilterMode ? filterLoading : loading;
  const displayItems   = isFilterMode ? filterPageItems : figurines;
  const displayTotal   = isFilterMode ? filteredFigurines.length : totalElements;
  const displayPages   = isFilterMode ? filterTotalPages : totalPages;

  // Build params preserving all active filters
  const makeParams = (overrides: Record<string, string>) => {
    const p: Record<string, string> = {};
    if (query)   p.q       = query;
    if (lineup)  p.lineup  = lineup;
    if (series)  p.series  = series;
    if (group)   p.group   = group;
    if (revival) p.revival = revival;
    p.page = "1";
    return { ...p, ...overrides };
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setSearchParams(makeParams({ page: String(value) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (value: string) => {
    const p: Record<string, string> = { page: "1" };
    if (value.trim()) p.q      = value.trim();
    if (lineup)       p.lineup = lineup;
    if (series)       p.series = series;
    if (group)        p.group  = group;
    if (revival)      p.revival = revival;
    setSearchParams(p);
  };

  const handleClearSearch = () => {
    const p: Record<string, string> = { page: "1" };
    if (lineup)  p.lineup  = lineup;
    if (series)  p.series  = series;
    if (group)   p.group   = group;
    if (revival) p.revival = revival;
    setSearchParams(p);
  };

  const handleLineupChange = (value: string) => {
    const p: Record<string, string> = { page: "1" };
    if (query)   p.q       = query;
    if (value)   p.lineup  = value;
    if (series)  p.series  = series;
    if (group)   p.group   = group;
    if (revival) p.revival = revival;
    setSearchParams(p);
  };

  const handleSeriesChange = (value: string) => {
    const p: Record<string, string> = { page: "1" };
    if (query)   p.q       = query;
    if (lineup)  p.lineup  = lineup;
    if (value)   p.series  = value;
    if (group)   p.group   = group;
    if (revival) p.revival = revival;
    setSearchParams(p);
  };

  const handleGroupChange = (value: string) => {
    const p: Record<string, string> = { page: "1" };
    if (query)   p.q       = query;
    if (lineup)  p.lineup  = lineup;
    if (series)  p.series  = series;
    if (value)   p.group   = value;
    if (revival) p.revival = revival;
    setSearchParams(p);
  };

  const handleRevivalChange = (value: string) => {
    const p: Record<string, string> = { page: "1" };
    if (query)  p.q      = query;
    if (lineup) p.lineup = lineup;
    if (series) p.series = series;
    if (group)  p.group  = group;
    if (value)  p.revival = value;
    setSearchParams(p);
  };

  return (
    <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" }, flexShrink: 0 }}>
          Collection
        </Typography>
        <Button variant="contained" onClick={() => navigate("/figurines/new")} sx={{ flexShrink: 0 }}>
          + New Figurine
        </Button>
      </Box>

      {/* Filters row */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search by name…"
          defaultValue={query}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch((e.target as HTMLInputElement).value);
          }}
          onBlur={(e) => handleSearch(e.target.value)}
          sx={{ flex: "1 1 240px", maxWidth: 400 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.disabled", fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch} sx={{ color: "text.disabled" }}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
        <FormControl size="small" sx={{ flex: "1 1 180px", maxWidth: 240 }}>
          <InputLabel>Line Up</InputLabel>
          <Select
            label="Line Up"
            value={lineup}
            onChange={(e) => handleLineupChange(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {lineupOptions.map((opt) => (
              <MenuItem key={opt.id} value={String(opt.id)}>{opt.description}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: "1 1 180px", maxWidth: 240 }}>
          <InputLabel>Series</InputLabel>
          <Select
            label="Series"
            value={series}
            onChange={(e) => handleSeriesChange(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {seriesOptions.map((opt) => (
              <MenuItem key={opt.id} value={String(opt.id)}>{opt.description}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: "1 1 180px", maxWidth: 240 }}>
          <InputLabel>Group</InputLabel>
          <Select
            label="Group"
            value={group}
            onChange={(e) => handleGroupChange(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {groupOptions.map((opt) => (
              <MenuItem key={opt.id} value={String(opt.id)}>{opt.description}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: "1 1 140px", maxWidth: 180 }}>
          <InputLabel>Revival</InputLabel>
          <Select
            label="Revival"
            value={revival}
            onChange={(e) => handleRevivalChange(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Status line */}
      {!displayLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isFilterMode
            ? (() => {
                const lineupLabel = lineupOptions.find((o) => String(o.id) === lineup)?.description;
                const seriesLabel = seriesOptions.find((o) => String(o.id) === series)?.description;
                const groupLabel  = groupOptions.find((o)  => String(o.id) === group)?.description;
                const parts: string[] = [];
                if (query)       parts.push(`matching "${query}"`);
                if (lineupLabel) parts.push(`in ${lineupLabel}`);
                if (seriesLabel) parts.push(`· ${seriesLabel}`);
                if (groupLabel)  parts.push(`· ${groupLabel}`);
                if (revival)     parts.push(`· Revival: ${revival === "true" ? "Yes" : "No"}`);
                return `${displayTotal.toLocaleString()} result${displayTotal !== 1 ? "s" : ""}${parts.length ? " " + parts.join(" ") : ""}`;
              })()
            : displayTotal > 0 ? `${displayTotal.toLocaleString()} figurines · page ${page} of ${displayPages}` : null
          }
        </Typography>
      )}

      {/* Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {displayLoading
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Grid key={i} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                <CardSkeleton />
              </Grid>
            ))
          : displayItems.map((fig) => (
              <Grid key={fig.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                <FigurineCard figurine={fig} onClick={() => navigate(`/figurines/${fig.id}`)} />
              </Grid>
            ))}
      </Grid>

      {/* Empty state */}
      {!displayLoading && displayItems.length === 0 && !errorMessage && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 300,
            gap: 1,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {isFilterMode ? "No figurines match the current filters." : "No figurines in the collection yet."}
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {!displayLoading && displayPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
          <Pagination
            count={displayPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
            sx={{
              "& .MuiPaginationItem-root": { color: "text.secondary" },
              "& .MuiPaginationItem-root.Mui-selected": {
                backgroundColor: "rgba(212, 175, 55, 0.2)",
                color: "primary.main",
                fontWeight: 700,
              },
            }}
          />
        </Box>
      )}

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
