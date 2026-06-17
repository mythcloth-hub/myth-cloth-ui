import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Collapse,
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
import TuneIcon from "@mui/icons-material/Tune";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";

import { getFigurines } from "../api/figurineApi";
import { countryCodeToFlag } from "../../../utils/countryFlag";
import { lineupsApi, seriesApi, groupsApi } from "../../catalogs/api/catalogApi";
import type { Catalog } from "../../catalogs/types/catalog";
import type { Figurine, ReleaseStatus } from "../types/figurine";
import { getAllAnniversaries } from "../../anniversaries/api/anniversaryApi";
import type { Anniversary } from "../../anniversaries/types/anniversary";
import AnniversaryIcon from "./AnniversaryIcon";
import { Tooltip } from "@mui/material";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

const PAGE_SIZE = 24;

type Badge = { label: string; color: "warning" | "info" | "success" | "error" | "default" };

const RELEASE_STATUS_CONFIG: Record<ReleaseStatus, { label: string; color: string; borderColor: string; hoverGlow: string }> = {
  RELEASED:  { label: "Released",  color: "#4caf50", borderColor: "rgba(76,175,80,0.28)",   hoverGlow: "rgba(76,175,80,0.14)"   },
  ANNOUNCED: { label: "Announced", color: "#42a5f5", borderColor: "rgba(66,165,245,0.28)",  hoverGlow: "rgba(66,165,245,0.14)"  },
  RUMORED:   { label: "Rumored",   color: "#ff9800", borderColor: "rgba(255,152,0,0.32)",   hoverGlow: "rgba(255,152,0,0.14)"   },
  PROTOTYPE: { label: "Prototype", color: "#90a4ae", borderColor: "rgba(144,164,174,0.30)", hoverGlow: "rgba(144,164,174,0.12)" },
  UNRELEASED: { label: "Unreleased", color: "#ef5350", borderColor: "rgba(239,83,80,0.30)", hoverGlow: "rgba(239,83,80,0.14)" },
};

const STATUS_ORDER: ReleaseStatus[] = ["ANNOUNCED", "RELEASED", "PROTOTYPE", "UNRELEASED", "RUMORED"];

const STATUS_HELPER_TEXT: Record<ReleaseStatus, string> = {
  RELEASED: "Already available in the market.",
  ANNOUNCED: "Future releases that were officially announced.",
  RUMORED: "Unconfirmed releases with circulating information.",
  PROTOTYPE: "Prototype-stage figures; design may still change.",
  UNRELEASED: "Canceled or indefinitely unreleased figures.",
};

function getBadges(f: Figurine): Badge[] {
  const badges: Badge[] = [];
  if (f.isOriginalColorEdition) badges.push({ label: "OCE",          color: "warning" });
  if (f.isRevival)              badges.push({ label: "Revival",      color: "info"    });
  if (f.isMetalBody)            badges.push({ label: "Metal Body",   color: "default" });
  if (f.isGold24kEdition)       badges.push({ label: "Gold 24K",     color: "warning" });
  return badges;
}

function formatCompactDate(dateStr: string, includeDay = true): string {
  const [year, month, day] = dateStr.split("-");
  const monthIndex = Number(month) - 1;
  if (!year || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return dateStr;
  }

  const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][monthIndex];
  return includeDay && day ? `${monthShort} ${day}, ${year}` : `${monthShort} ${year}`;
}

function getStatusDateLabel(figurine: Figurine): string | null {
  if (figurine.releaseStatus === "ANNOUNCED" || figurine.releaseStatus === "RELEASED") {
    const distributorWithDate = figurine.distributors
      ?.filter((d) => Boolean(d.releaseDate))
      .sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""))[0];

    if (!distributorWithDate?.releaseDate) {
      return null;
    }

    return formatCompactDate(distributorWithDate.releaseDate, distributorWithDate.releaseDateConfirmed);
  }

  if (figurine.releaseStatus === "PROTOTYPE" || figurine.releaseStatus === "UNRELEASED") {
    const distributorWithAnnouncement = figurine.distributors
      ?.filter((d) => Boolean(d.announcedAt))
      .sort((a, b) => (a.announcedAt ?? "").localeCompare(b.announcedAt ?? ""))[0];

    if (!distributorWithAnnouncement?.announcedAt) {
      return null;
    }

    const announcedParts = distributorWithAnnouncement.announcedAt.split("-");
    return formatCompactDate(
      distributorWithAnnouncement.announcedAt,
      announcedParts.length >= 3 && Boolean(announcedParts[2])
    );
  }

  return null;
}

function FigurineCard({ figurine, onClick }: { figurine: Figurine; onClick: () => void }) {
  const imageUrl = figurine.officialImageUrls?.[0] ?? null;
  const badges = getBadges(figurine);
  const statusCfg = figurine.releaseStatus ? RELEASE_STATUS_CONFIG[figurine.releaseStatus] : null;
  const releaseDateLabel = getStatusDateLabel(figurine);
  const isAnnounced = figurine.releaseStatus === "ANNOUNCED";
  const isReleased = figurine.releaseStatus === "RELEASED";
  const isUnreleased = figurine.releaseStatus === "UNRELEASED";

  // Get all distributor flags (unique by country code)
  const distributorFlags = (figurine.distributors || [])
    .map((d) => d.distributor?.countryCode)
    .filter(Boolean)
    .map((code) => countryCodeToFlag(code));

  const hasAnniversary = Boolean((figurine as any).anniversary);

  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        borderTop: statusCfg ? `2px solid ${statusCfg.borderColor}` : undefined,
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: statusCfg
            ? `0 12px 40px ${statusCfg.hoverGlow}`
            : "0 12px 40px rgba(212, 175, 55, 0.25)",
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
              ...(isReleased && {
                filter: "saturate(108%) contrast(102%) brightness(1.02)",
                transition: "filter 0.4s ease, transform 0.4s ease",
                "&:hover": { filter: "saturate(116%) contrast(104%) brightness(1.04)" },
              }),
              ...(isAnnounced && {
                filter: "saturate(82%) brightness(0.94) hue-rotate(-8deg)",
                transition: "filter 0.4s ease, transform 0.4s ease",
                "&:hover": { filter: "saturate(100%) brightness(1) hue-rotate(0deg)" },
              }),
              ...(isUnreleased && {
                filter: "grayscale(45%) saturate(70%) brightness(0.82)",
                transition: "filter 0.4s ease, transform 0.4s ease",
                "&:hover": { filter: "grayscale(0%) saturate(100%) brightness(1)" },
              }),
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

        {imageUrl && isUnreleased && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(122, 24, 24, 0.16) 0%, rgba(75, 0, 0, 0.10) 55%, rgba(10, 11, 20, 0.12) 100%)",
              mixBlendMode: "multiply",
              pointerEvents: "none",
            }}
          />
        )}

        {imageUrl && isAnnounced && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(55, 105, 180, 0.14) 0%, rgba(28, 61, 112, 0.08) 52%, rgba(10, 11, 20, 0.08) 100%)",
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        )}

        {imageUrl && isReleased && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(90% 70% at 50% 10%, rgba(255, 221, 145, 0.14) 0%, rgba(255, 221, 145, 0.04) 42%, transparent 70%)",
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
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
        {(badges.length > 0 || hasAnniversary) && (
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
                  ...(b.label === "Revival"
                    ? {
                        bgcolor: "primary.main",
                        color: "#1a1202",
                        "& .MuiChip-label": { color: "#1a1202" },
                      }
                    : {}),
                }}
              />
            ))}
            {hasAnniversary && (
              <Tooltip title={(figurine as any).anniversary?.description || "Anniversary Edition"} arrow>
                <span>
                  <AnniversaryIcon sx={{ fontSize: 22, color: "#bfa100", bgcolor: "#fffde7", borderRadius: "50%", boxShadow: 1, p: 0.2 }} />
                </span>
              </Tooltip>
            )}
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
          title={figurine.displayableName}
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

        {figurine.group?.description && (
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
        )}

        {/* Release status + date in one compact line, with distributor flags at the end */}
        {statusCfg && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: statusCfg.color,
                opacity: 0.7,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontSize: "0.62rem", color: "text.disabled", letterSpacing: "0.04em" }}
              noWrap
              title={releaseDateLabel ? `${statusCfg.label} - ${releaseDateLabel}` : statusCfg.label}
            >
              {releaseDateLabel ? `${statusCfg.label} - ${releaseDateLabel}` : statusCfg.label}
            </Typography>
            {distributorFlags.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: 0.5 }}>
                {distributorFlags.map((flag, idx) => (
                  <span key={idx} style={{ fontSize: "1.08rem", lineHeight: 1 }}>{flag}</span>
                ))}
              </Box>
            )}
          </Box>
        )}
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
// Removed SEARCH_BATCH and filter mode logic

export default function FigurineCollectionPage() {
  const navigate = useNavigate();
  const location  = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Persist current search params so the sidebar can restore them
  useEffect(() => {
    // Only update sessionStorage if the page param is present (prevents double fetch on initial mount)
    const qs = searchParams.toString();
    const hasPage = searchParams.get("page");
    if (qs && hasPage) {
      sessionStorage.setItem("figurineCollectionSearch", qs);
    } else {
      sessionStorage.removeItem("figurineCollectionSearch");
    }
  }, [searchParams]);
  const query  = searchParams.get("name")      ?? "";
  const [searchInput, setSearchInput] = useState(query);
  const lineup  = searchParams.get("lineup") ?? "";
  const series  = searchParams.get("series") ?? "";
  const group   = searchParams.get("group")  ?? "";
  const anniversary = searchParams.get("anniversary") ?? "";
  const releaseStatus = searchParams.get("releaseStatus") ?? "";
  const revival       = searchParams.get("revival")       ?? "";
  const metalBody     = searchParams.get("metalBody")     ?? "";
  const originalColor = searchParams.get("originalColor") ?? "";
  const plainCloth    = searchParams.get("plainCloth")    ?? "";
  const battleDamaged = searchParams.get("battleDamaged") ?? "";
  const goldenArmor   = searchParams.get("goldenArmor")   ?? "";
  const gold24k       = searchParams.get("gold24k")       ?? "";
  const manga         = searchParams.get("manga")         ?? "";
  const multiPack     = searchParams.get("multiPack")     ?? "";
  const articulable   = searchParams.get("articulable")   ?? "";
  const page    = Number(searchParams.get("page") ?? "1");

  // State for paginated data from server
  const [figurines,     setFigurines]     = useState<Figurine[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [totalPages,    setTotalPages]    = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Lineup, series & group options for the dropdowns
  const [lineupOptions, setLineupOptions] = useState<Catalog[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<Catalog[]>([]);
  const [groupOptions,  setGroupOptions]  = useState<Catalog[]>([]);
  const [anniversaryOptions, setAnniversaryOptions] = useState<Anniversary[]>([]);

  const [errorMessage,   setErrorMessage]   = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { deleted?: boolean } | null)?.deleted ? "Figurine deleted successfully." : null
  );
  const [filtersOpen,    setFiltersOpen]    = useState(false);

  const activeFilterCount = [lineup, series, group, anniversary, releaseStatus, revival, metalBody, originalColor, plainCloth, battleDamaged, goldenArmor, gold24k, manga, multiPack, articulable].filter(Boolean).length;

  // Fetch dropdown options once on mount
  useEffect(() => {
    lineupsApi.getAll().then(setLineupOptions).catch(console.error);
    seriesApi.getAll().then(setSeriesOptions).catch(console.error);
    groupsApi.getAll().then(setGroupOptions).catch(console.error);
    getAllAnniversaries().then(setAnniversaryOptions).catch(console.error);
  }, []);

  // Debounced search effect for search bar (only if >= 3 chars)
  useEffect(() => {
    const handler = setTimeout(() => {
      if ((searchInput.length === 0 || searchInput.length >= 3) && searchInput !== query) {
        setSearchParams(makeParams({ name: searchInput }));
      }
    }, 350);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, query]);

  // Always fetch paginated data from server with current filters/search
  useEffect(() => {
    setLoading(true);
    setFigurines([]);
    const params: Record<string, any> = {};

    if (query) params.name = query;
    if (lineup) params.lineUpId = lineup;
    if (series) params.seriesId = series;
    if (group) params.groupId = group;
    if (anniversary) params.anniversaryId = anniversary;
    if (releaseStatus) params.releaseStatus = releaseStatus;
    if (metalBody) params.metalBody = metalBody;
    if (originalColor) params.oce = originalColor;
    if (revival) params.revival = revival;
    if (plainCloth) params.plainCloth = plainCloth;
    if (battleDamaged) params.broken = battleDamaged;
    if (goldenArmor) params.golden = goldenArmor;
    if (gold24k) params.gold = gold24k;
    if (manga) params.manga = manga;
    if (multiPack) params.set = multiPack;
    if (articulable) params.articulable = articulable;

    getFigurines(page - 1, PAGE_SIZE, params)
      .then((data) => {
        setFigurines(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "figurines" }));
      })
      .finally(() => setLoading(false));
  }, [page, query, lineup, series, group, anniversary, releaseStatus, metalBody, originalColor, revival, plainCloth, battleDamaged, goldenArmor, gold24k, manga, multiPack, articulable]);



  // Apply all active filters client-side


  // Unified display values
  const displayLoading = loading;
  const displayItems   = figurines;
  const displayTotal   = totalElements;
  const displayPages   = totalPages;

  const groupedByStatus = useMemo(() => {
    const grouped: Record<ReleaseStatus, Figurine[]> = {
      RELEASED: [],
      ANNOUNCED: [],
      RUMORED: [],
      PROTOTYPE: [],
      UNRELEASED: [],
    };
    displayItems.forEach((fig) => {
      grouped[fig.releaseStatus].push(fig);
    });
    return grouped;
  }, [displayItems]);

  // Build params preserving all active filters; override value "" removes that key
  /**
   * Builds search params for navigation and filter/search changes.
   * If a filter/search is changed (overrides contains a key other than 'page'), resets page to 1.
   * If only page is changed, preserves the page.
   */

  const makeParams = (overrides: Record<string, string>) => {
    const p: Record<string, string> = {};
    if (query)        p.name            = query;
    if (lineup)       p.lineup       = lineup;
    if (series)       p.series       = series;
    if (group)        p.group        = group;
    if (anniversary)  p.anniversary  = anniversary;
    if (releaseStatus) p.releaseStatus = releaseStatus;
    if (revival)      p.revival      = revival;
    if (metalBody)    p.metalBody    = metalBody;
    if (originalColor) p.originalColor = originalColor;
    if (plainCloth)   p.plainCloth   = plainCloth;
    if (battleDamaged) p.battleDamaged = battleDamaged;
    if (goldenArmor)  p.goldenArmor  = goldenArmor;
    if (gold24k)      p.gold24k      = gold24k;
    if (manga)        p.manga        = manga;
    if (multiPack)    p.multiPack    = multiPack;
    if (articulable)  p.articulable  = articulable;

    // If any override key is not 'page', reset page to 1
    const overrideKeys = Object.keys(overrides).filter((k) => k !== 'page');
    if (overrideKeys.length > 0) {
      p.page = "1";
    } else {
      // Otherwise, preserve current page
      p.page = String(page);
    }

    for (const [k, v] of Object.entries(overrides)) {
      if (v) p[k] = v; else delete p[k];
    }
    return p;
  };

  const handleReleaseStatusChange = (value: string) => setSearchParams(makeParams({ releaseStatus: value }));

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setSearchParams(makeParams({ page: String(value) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };
  const handleClearSearch = () => {
    setSearchInput("");
    setSearchParams(makeParams({ name: "" }));
  };
  const handleLineupChange  = (value: string) => setSearchParams(makeParams({ lineup:  value }));
  const handleSeriesChange  = (value: string) => setSearchParams(makeParams({ series:  value }));
  const handleGroupChange   = (value: string) => setSearchParams(makeParams({ group:   value }));
  const handleAnniversaryChange = (value: string) => setSearchParams(makeParams({ anniversary: value }));
  const handleBoolChange    = (key: string, value: string) => setSearchParams(makeParams({ [key]: value }));
  const clearAllFilters     = () => setSearchParams(query ? { name: query, page: "1" } : { page: "1" });

  return (
        <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 9,
          bgcolor: "background.default",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          mx: { xs: -1.5, sm: -2, md: -3 },
          px: { xs: 1.5, sm: 2, md: 3 },
          pt: 0.25,
          pb: 1,
          mb: 2,
          borderBottom: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, gap: 2, flexWrap: "wrap" }}>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" }, flexShrink: 0 }}>
            Myth Cloth Collection
          </Typography>
          <Button variant="contained" onClick={() => navigate("/figurines/new")} sx={{ flexShrink: 0 }}>
            + New Figurine
          </Button>
        </Box>

        {/* Search bar + filter toggle */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 1.5, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Search by name…"
            value={searchInput}
            onChange={handleSearchInputChange}
            sx={{ flex: 1, maxWidth: 480 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.disabled", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch} sx={{ color: "text.disabled" }}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
          <Badge badgeContent={activeFilterCount || null} color="primary" sx={{ flexShrink: 0 }}>
            <Button
              variant={filtersOpen ? "contained" : "outlined"}
              size="small"
              startIcon={<TuneIcon fontSize="small" />}
              onClick={() => setFiltersOpen((o) => !o)}
            >
              Filters
            </Button>
          </Badge>
          {activeFilterCount > 0 && (
            <Button
              size="small"
              onClick={clearAllFilters}
              sx={{ color: "text.secondary", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Clear all
            </Button>
          )}
        </Box>

        {/* Collapsible filter panel */}
        <Collapse in={filtersOpen}>
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
              mb: 1.5,
              p: 1.5,
              borderRadius: 1,
              bgcolor: "rgba(255,255,255,0.03)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
          <FormControl size="small" sx={{ flex: "1 1 150px" }}>
            <InputLabel>Line Up</InputLabel>
            <Select label="Line Up" value={lineup} onChange={(e) => handleLineupChange(e.target.value)}>
              <MenuItem value=""><em>All</em></MenuItem>
              {lineupOptions.map((opt) => (
                <MenuItem key={opt.id} value={String(opt.id)}>{opt.description}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: "1 1 150px" }}>
            <InputLabel>Series</InputLabel>
            <Select label="Series" value={series} onChange={(e) => handleSeriesChange(e.target.value)}>
              <MenuItem value=""><em>All</em></MenuItem>
              {seriesOptions.map((opt) => (
                <MenuItem key={opt.id} value={String(opt.id)}>{opt.description}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: "1 1 150px" }}>
            <InputLabel>Group</InputLabel>
            <Select label="Group" value={group} onChange={(e) => handleGroupChange(e.target.value)}>
              <MenuItem value=""><em>All</em></MenuItem>
              {groupOptions.map((opt) => (
                <MenuItem key={opt.id} value={String(opt.id)}>{opt.description}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: "1 1 170px" }}>
            <InputLabel>Anniversary</InputLabel>
            <Select label="Anniversary" value={anniversary} onChange={(e) => handleAnniversaryChange(e.target.value)}>
              <MenuItem value=""><em>All</em></MenuItem>
              {anniversaryOptions.map((opt) => (
                <MenuItem key={opt.id} value={String(opt.id)}>{opt.description}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: "1 1 170px" }}>
            <InputLabel>Release Status</InputLabel>
            <Select label="Release Status" value={releaseStatus} onChange={(e) => handleReleaseStatusChange(e.target.value)}>
              <MenuItem value=""><em>All</em></MenuItem>
              <MenuItem value="ANNOUNCED">Announced</MenuItem>
              <MenuItem value="RELEASED">Released</MenuItem>
              <MenuItem value="PROTOTYPE">Prototype</MenuItem>
              <MenuItem value="RUMORED">Rumored</MenuItem>
            </Select>
          </FormControl>
          {([
            { key: "metalBody",     label: "Metal Body"     },
            { key: "originalColor", label: "OCE" },
            { key: "revival",       label: "Revival"        },
            { key: "plainCloth",    label: "Plain Cloth"    },
            { key: "battleDamaged", label: "Battle Damaged" },
            { key: "goldenArmor",   label: "Golden Armor"   },
            { key: "gold24k",       label: "Gold 24K"       },
            { key: "manga",         label: "Manga Version"  },
            { key: "multiPack",     label: "Multi-Pack"     },
            { key: "articulable",   label: "Articulable"    },
          ] as { key: string; label: string }[]).map(({ key, label }) => (
            <FormControl key={key} size="small" sx={{ flex: "1 1 130px" }}>
              <InputLabel>{label}</InputLabel>
              <Select
                label={label}
                value={searchParams.get(key) ?? ""}
                onChange={(e) => handleBoolChange(key, e.target.value)}
              >
                <MenuItem value=""><em>All</em></MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          ))}
          </Box>
        </Collapse>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            {lineup && (
              <Chip size="small" label={`Line Up: ${lineupOptions.find((o) => String(o.id) === lineup)?.description ?? lineup}`} onDelete={() => handleLineupChange("")} />
            )}
            {series && (
              <Chip size="small" label={`Series: ${seriesOptions.find((o) => String(o.id) === series)?.description ?? series}`} onDelete={() => handleSeriesChange("")} />
            )}
            {group && (
              <Chip size="small" label={`Group: ${groupOptions.find((o) => String(o.id) === group)?.description ?? group}`} onDelete={() => handleGroupChange("")} />
            )}
            {anniversary && (
              <Chip
                size="small"
                label={`Anniversary: ${anniversaryOptions.find((o) => String(o.id) === anniversary)?.description ?? anniversary}`}
                onDelete={() => handleAnniversaryChange("")}
              />
            )}
            {releaseStatus && (
              <Chip size="small" label={`Status: ${releaseStatus.charAt(0) + releaseStatus.slice(1).toLowerCase()}`} onDelete={() => handleReleaseStatusChange("")} />
            )}
            {([
              { key: "revival",       label: "Revival",        value: revival       },
              { key: "metalBody",     label: "Metal Body",     value: metalBody     },
              { key: "originalColor", label: "Original Color", value: originalColor },
              { key: "plainCloth",    label: "Plain Cloth",    value: plainCloth    },
              { key: "battleDamaged", label: "Battle Damaged", value: battleDamaged },
              { key: "goldenArmor",   label: "Golden Armor",   value: goldenArmor   },
              { key: "gold24k",       label: "Gold 24K",       value: gold24k       },
              { key: "manga",         label: "Manga",          value: manga         },
              { key: "multiPack",     label: "Multi-Pack",     value: multiPack     },
              { key: "articulable",   label: "Articulable",    value: articulable   },
            ] as { key: string; label: string; value: string }[])
              .filter(({ value }) => Boolean(value))
              .map(({ key, label, value }) => (
                <Chip
                  key={key}
                  size="small"
                  label={`${label}: ${value === "true" ? "Yes" : "No"}`}
                  onDelete={() => handleBoolChange(key, "")}
                />
              ))}
          </Box>
        )}

        {/* Status + compact pagination row – always visible in the sticky bar */}
        {!displayLoading && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mt: activeFilterCount > 0 ? 1 : 0 }}>
            <Typography variant="body2" color="text.secondary">
              {displayTotal > 0
                ? `${displayTotal.toLocaleString()} figurine${displayTotal !== 1 ? "s" : ""}${query ? ` matching "${query}"` : ""} · page ${page} of ${displayPages}`
                : null}
            </Typography>
            {displayPages > 1 && (
              <Pagination
                count={displayPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                size="small"
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
            )}
          </Box>
        )}
      </Box>

      {/* Grid / Status board */}
      {displayLoading ? (
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Grid key={i} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
              <CardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {STATUS_ORDER.map((status) => {
            const sectionItems = groupedByStatus[status];
            if (!sectionItems.length) return null;
            const cfg = RELEASE_STATUS_CONFIG[status];

            return (
              <Box
                key={status}
                sx={{
                  borderRadius: 2,
                  p: { xs: 1, sm: 1.5 },
                  bgcolor: "rgba(255,255,255,0.02)",
                  border: `1px solid ${cfg.borderColor}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                  <Chip
                    label={cfg.label}
                    size="small"
                    sx={{
                      bgcolor: cfg.color,
                      color: "#fff",
                      fontWeight: 700,
                      "& .MuiChip-label": { color: "#fff" },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                    {sectionItems.length} figurine{sectionItems.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mb: 1.5 }}>
                  {STATUS_HELPER_TEXT[status]}
                </Typography>

                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  {sectionItems.map((fig) => (
                    <Grid key={fig.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                      <FigurineCard
                        figurine={fig}
                        onClick={() => {
                          sessionStorage.setItem(
                            "figurineNavList",
                            JSON.stringify(displayItems.map((f) => f.id))
                          );
                          // Preserve current search params (including page) in the detail URL
                          navigate(`/figurines/${fig.id}?${searchParams.toString()}`);
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })}
        </Box>
      )}

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
            {query || activeFilterCount > 0
              ? "No figurines match the current filters."
              : "No figurines in the collection yet."}
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
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

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
