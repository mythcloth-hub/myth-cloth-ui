import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import {
  getCollectionFigurines,
  getCollectionFigurine,
  removeFigurineFromCollection,
} from "../api/collectionApi";
import type { Collection, CollectionFigurine } from "../types/collection";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

type AlbumFigurine = CollectionFigurine & {
  purchasePrice?: number;
  purchaseCurrency?: string;
  trackingCode?: string;
};

const BASE_ALBUM_TARGET = 24;
const MIN_ALBUM_ZOOM = 0.8;
const MAX_ALBUM_ZOOM = 2;
const ALBUM_ZOOM_STEP = 0.1;
const TIMELINE_HEIGHT = 360;

const ALBUM_PATTERNS = [
  { colSpan: 1, rowSpan: 2, tilt: -1.5 },
  { colSpan: 2, rowSpan: 2, tilt: 0.8 },
  { colSpan: 1, rowSpan: 1, tilt: -0.5 },
  { colSpan: 1, rowSpan: 2, tilt: 1.2 },
  { colSpan: 2, rowSpan: 1, tilt: -1.2 },
  { colSpan: 1, rowSpan: 1, tilt: 1.5 },
] as const;

type AlbumSlot = {
  key: string;
  owned: boolean;
  figurine?: AlbumFigurine;
};

export default function CollectionDetailPage() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialCollection = (location.state as { collection?: Collection } | null)?.collection ?? null;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [figurines, setFigurines] = useState<AlbumFigurine[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [flippedFigurineId, setFlippedFigurineId] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [albumZoom, setAlbumZoom] = useState(1);
  const [showOwnedOnly, setShowOwnedOnly] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [figurineBackNames, setFigurineBackNames] = useState<Record<number, string>>({});
  const [figurineBackNameLoadingId, setFigurineBackNameLoadingId] = useState<number | null>(null);
  const albumGridSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadCollection();
  }, [id]);

  useEffect(() => {
    const onScroll = () => {
      const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScrollable <= 0) {
        setScrollProgress(0);
      } else {
        const ratio = Math.min(1, Math.max(0, window.scrollY / maxScrollable));
        setScrollProgress(ratio);
      }

      const gridSection = albumGridSectionRef.current;
      if (!gridSection) return;

      const rect = gridSection.getBoundingClientRect();
      const totalTravel = rect.height + window.innerHeight;
      const passed = window.innerHeight - rect.top;
      const ratioInSection = Math.min(1, Math.max(0, passed / Math.max(1, totalTravel)));
      setTimelineProgress(ratioInSection);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loadCollection = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const collectionId = Number(id);
      const data = initialCollection ?? {
        id: Number.isNaN(collectionId) ? -1 : collectionId,
        name: `Collection ${id}`,
        description: undefined,
        figurineIds: [],
        totalFigurines: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCollection(data);
      setFlippedFigurineId(null);
      setFigurineBackNames({});
      setFigurineBackNameLoadingId(null);

      const collectionFigurines = await getCollectionFigurines(data.id);
      setFigurines(
        collectionFigurines.map((figurine) => ({
          ...figurine,
          purchasePrice: undefined,
          purchaseCurrency: undefined,
          trackingCode: undefined,
        }))
      );
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "collection" }));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFigurine = async (figurineId: number) => {
    if (!collection) return;

    try {
      await removeFigurineFromCollection(collection.id, figurineId);
      setFigurines(figurines.filter((f) => f.id !== figurineId));
      setCollection({
        ...collection,
        figurineIds: collection.figurineIds.filter((id) => id !== figurineId),
      });
      setFlippedFigurineId((current) => (current === figurineId ? null : current));
      setSuccessMessage("Figurine removed from collection.");
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(err, { action: "update", resource: "figurine from collection" })
      );
    }
  };

  const baseVisibleFigurines = figurines;
  const visibleFigurines = showOwnedOnly
    ? baseVisibleFigurines.filter((figurine) => figurine.isCollected)
    : baseVisibleFigurines;
  const collectedCount = baseVisibleFigurines.filter(
    (figurine) => figurine.releaseStatus === "RELEASED" && figurine.isCollected
  ).length;
  const effectiveOwnedTotal = baseVisibleFigurines
    .filter((figurine) => figurine.isCollected)
    .reduce((total, figurine) => total + Math.max(1, figurine.ownedQuantity), 0);
  const toCompleteCount = baseVisibleFigurines.filter(
    (figurine) => figurine.releaseStatus === "RELEASED" && !figurine.isCollected
  ).length;
  const progressPercent = Math.round(
    (collectedCount / Math.max(1, collectedCount + toCompleteCount)) * 100
  );
  const releasedTrackedTotal = collectedCount + toCompleteCount;
  const zoomPercent = Math.round(albumZoom * 100);

  const ownedColor = theme.palette.success.main;
  const missingColor = theme.palette.warning.main;
  const accentColor = theme.palette.info.main;
  const borderSoft = alpha(theme.palette.common.white, 0.16);
  const panelBg = alpha(theme.palette.background.paper, 0.58);

  const timelineYears = useMemo(
    () => visibleFigurines.map((figurine) => figurine.year).filter((year): year is number => typeof year === "number"),
    [visibleFigurines]
  );
  const newestYear = timelineYears.length > 0 ? timelineYears[0] : null;
  const oldestYear = timelineYears.length > 0 ? timelineYears[timelineYears.length - 1] : null;
  const activeYear =
    timelineYears.length > 0
      ? timelineYears[Math.min(timelineYears.length - 1, Math.round(timelineProgress * (timelineYears.length - 1)))]
      : null;

  const handleZoomOut = () => {
    setAlbumZoom((current) => Math.max(MIN_ALBUM_ZOOM, Number((current - ALBUM_ZOOM_STEP).toFixed(2))));
  };

  const handleZoomIn = () => {
    setAlbumZoom((current) => Math.min(MAX_ALBUM_ZOOM, Number((current + ALBUM_ZOOM_STEP).toFixed(2))));
  };

  const handleResetZoom = () => {
    setAlbumZoom(1);
  };

  const totalNeeded = useMemo(() => {
    if (!collection) return BASE_ALBUM_TARGET;
    const base = Math.max(BASE_ALBUM_TARGET, collection.totalFigurines);
    return Math.ceil(base / 12) * 12;
  }, [collection]);

  const albumSlots: AlbumSlot[] = useMemo(() => {
    const ownedSlots = visibleFigurines.map((figurine) => ({
      key: `owned-${figurine.id}`,
      owned: figurine.isCollected,
      figurine,
    }));
    const missingCount = showOwnedOnly ? 0 : Math.max(0, totalNeeded - ownedSlots.length);
    const missingSlots = Array.from({ length: missingCount }, (_, idx) => ({
      key: `missing-${idx}`,
      owned: false,
    }));
    return [...ownedSlots, ...missingSlots];
  }, [showOwnedOnly, visibleFigurines, totalNeeded]);

  const handleToggleFlip = (slot: AlbumSlot) => {
    if (!slot.owned || !slot.figurine) return;

    setFlippedFigurineId((current) => (current === slot.figurine!.id ? null : slot.figurine!.id));
  };

  useEffect(() => {
    if (!collection || flippedFigurineId == null) return;

    const figurine = figurines.find((item) => item.id === flippedFigurineId);
    if (!figurine) return;
    if (figurineBackNames[flippedFigurineId]) return;

    let isActive = true;
    setFigurineBackNameLoadingId(flippedFigurineId);

    getCollectionFigurine(collection.id, flippedFigurineId)
      .then((response) => {
        if (!isActive) return;

        const nextDisplayableName = response.displayableName?.trim() || figurine.displayableName;
        setFigurineBackNames((current) => ({
          ...current,
          [flippedFigurineId]: nextDisplayableName,
        }));
      })
      .catch(() => {
        if (!isActive) return;

        setFigurineBackNames((current) => ({
          ...current,
          [flippedFigurineId]: figurine.displayableName,
        }));
      })
      .finally(() => {
        if (!isActive) return;

        setFigurineBackNameLoadingId((current) => (current === flippedFigurineId ? null : current));
      });

    return () => {
      isActive = false;
    };
  }, [collection, flippedFigurineId, figurines, figurineBackNames]);

  const getTrackingLabel = (figurine: AlbumFigurine): string => {
    if (figurine.trackingCode) {
      return `Tracking: ${figurine.trackingCode}`;
    }
    if (figurine.releaseStatus === "ANNOUNCED") {
      return "Preorder active - tracking pending";
    }
    if (figurine.releaseStatus === "RELEASED") {
      return `Tracking: N/A-${figurine.id}`;
    }
    return "No tracking data";
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#d4af37" }} />
      </Box>
    );
  }

  if (!collection) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error">Collection not found.</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: { xs: 2, md: 3 },
        background: `linear-gradient(165deg,
          ${alpha(theme.palette.background.default, 0.94)} 0%,
          ${alpha(theme.palette.primary.main, Math.min(0.32, 0.14 + scrollProgress * 0.18))} 42%,
          ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
        borderRadius: 2,
        minHeight: "calc(100vh - 96px)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.default",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          mx: { xs: -2, md: -3 },
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.45)}`,
        }}
      >
        <Tooltip title="Back to Collections">
          <IconButton onClick={() => navigate("/collections")} sx={{ color: "primary.main" }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", md: "2rem" },
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {collection.name}
          </Typography>
          {collection.description && (
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              {collection.description}
            </Typography>
          )}
        </Box>
      </Box>

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3200}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          mb: 2.5,
          p: 1.5,
          position: "sticky",
          top: { xs: 86, md: 98 },
          zIndex: 9,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.72),
          background:
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "1fr", lg: "1fr auto" },
            alignItems: "center",
          }}
        >
          <Box>
            <Box
              sx={{
                mt: 1,
                px: 1,
                py: 0.8,
                borderRadius: 1.4,
                border: `1px solid ${borderSoft}`,
                bgcolor: panelBg,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.9), fontWeight: 700 }}>
                  Collection completion
                </Typography>
                <Typography variant="caption" sx={{ color: accentColor, fontWeight: 800 }}>
                  {collectedCount} / {releasedTrackedTotal} released ({progressPercent}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                  height: 10,
                  borderRadius: 99,
                  bgcolor: alpha(theme.palette.common.white, 0.18),
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 99,
                    background: `linear-gradient(90deg, ${ownedColor} 0%, ${accentColor} 100%)`,
                  },
                }}
              />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: ownedColor, fontWeight: 700 }}>
                  Owned: {collectedCount}
                </Typography>
                <Typography variant="caption" sx={{ color: missingColor, fontWeight: 700 }}>
                  Missing: {toCompleteCount}
                </Typography>
              </Stack>
              <Box
                sx={{
                  mt: 0.9,
                  p: 1.1,
                  borderRadius: 1.2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.24)}`,
                  bgcolor: alpha(theme.palette.background.default, 0.3),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.2}>
                  <Box
                    sx={{
                      minWidth: 76,
                      px: 1,
                      py: 0.65,
                      borderRadius: 1.35,
                      textAlign: "center",
                      background: `linear-gradient(140deg, ${alpha(theme.palette.info.main, 0.3)} 0%, ${alpha(theme.palette.info.dark, 0.24)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.4)}`,
                    }}
                  >
                    <Typography sx={{ fontSize: "1.45rem", lineHeight: 1, fontWeight: 900, color: theme.palette.info.light }}>
                      {effectiveOwnedTotal}
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={0.6} alignItems="center">
                      <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.78), fontWeight: 700 }}>
                        Effective copies
                      </Typography>
                      <Tooltip title="This number of figurines includes duplicates, as well as figurines that have not been released yet.">
                        <IconButton size="small" sx={{ color: alpha(theme.palette.text.primary, 0.66), p: 0.15 }}>
                          <InfoOutlinedIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.2,
                        color: alpha(theme.palette.info.light, 0.84),
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                      }}
                    >
                      Total owned (with duplicates)
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={0.8}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent={{ sm: "flex-end" }}
          >
            <ToggleButtonGroup
              size="small"
              value={showOwnedOnly ? "owned" : "all"}
              exclusive
              onChange={(_, value: "all" | "owned" | null) => {
                if (!value) return;
                setShowOwnedOnly(value === "owned");
              }}
              sx={{
                bgcolor: alpha(theme.palette.background.default, 0.34),
                borderRadius: 1.2,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                p: 0.3,
                "& .MuiToggleButtonGroup-grouped": {
                  border: "none",
                  borderRadius: 0.9,
                  px: 1.2,
                  py: 0.35,
                  textTransform: "none",
                  fontWeight: 700,
                  color: alpha(theme.palette.text.primary, 0.84),
                },
                "& .MuiToggleButtonGroup-grouped.Mui-selected": {
                  bgcolor: alpha(theme.palette.info.main, 0.22),
                  color: theme.palette.info.light,
                  boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.info.light, 0.46)}`,
                },
              }}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="owned">Owned</ToggleButton>
            </ToggleButtonGroup>

            <Stack
              direction="row"
              spacing={0.6}
              alignItems="center"
              justifyContent={{ xs: "space-between", sm: "center" }}
              sx={{
                p: 0.5,
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                bgcolor: alpha(theme.palette.background.default, 0.32),
              }}
            >
              <Tooltip title="Zoom out">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleZoomOut}
                    disabled={albumZoom <= MIN_ALBUM_ZOOM}
                    sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.62)}` }}
                  >
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Chip
                label={`${zoomPercent}%`}
                size="small"
                sx={{
                  minWidth: 62,
                  bgcolor: alpha(theme.palette.common.white, 0.14),
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={handleResetZoom}
                disabled={albumZoom === 1}
                sx={{ minWidth: 52, px: 1, whiteSpace: "nowrap" }}
              >
                Reset
              </Button>
              <Tooltip title="Zoom in">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleZoomIn}
                    disabled={albumZoom >= MAX_ALBUM_ZOOM}
                    sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.62)}` }}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {figurines.length === 0 && (
        <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/figurines")}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
              color: theme.palette.getContrastText(theme.palette.info.main),
              fontWeight: 700,
            }}
          >
            Browse Figurines
          </Button>
        </Box>
      )}

      <Box
        ref={albumGridSectionRef}
        sx={{
          p: { xs: 2.4, md: 3 },
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
          background:
            `radial-gradient(120% 180% at 30% 0%, ${alpha(theme.palette.info.main, 0.12)} 0%, ${alpha(theme.palette.background.paper, 0.74)} 45%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: { md: 2.2 } }}>
        <Box
          sx={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(4, minmax(0, 1fr))",
              md: "repeat(6, minmax(0, 1fr))",
            },
            gridAutoRows: {
              xs: Math.round(112 * albumZoom),
              sm: Math.round(124 * albumZoom),
              md: Math.round(132 * albumZoom),
            },
            gap: {
              xs: Number((2.8 * albumZoom).toFixed(2)),
              sm: Number((3.2 * albumZoom).toFixed(2)),
              md: Number((3.6 * albumZoom).toFixed(2)),
            },
            gridAutoFlow: "dense",
            px: { xs: 0.7, sm: 0.9, md: 1.1 },
            pb: { xs: 0.9, sm: 1.1, md: 1.3 },
          }}
        >
          {albumSlots.map((slot, index) => {
            const pattern = ALBUM_PATTERNS[index % ALBUM_PATTERNS.length];
            const rowSpan = slot.figurine ? Math.max(pattern.rowSpan, 2) : pattern.rowSpan;
            const isFlipped = Boolean(slot.figurine && flippedFigurineId === slot.figurine.id);
            const backDisplayName = slot.figurine ? figurineBackNames[slot.figurine.id] : undefined;
            const isBackDisplayNameLoading = slot.figurine?.id === figurineBackNameLoadingId;
            const imageUrl = slot.figurine?.officialImageUrls?.[0] ?? null;
            const noteText = slot.figurine?.notes?.trim() ?? "";
            const duplicateCount = slot.owned && slot.figurine ? Math.max(1, slot.figurine.ownedQuantity) : 0;
            const stackLayers = Math.min(Math.max(duplicateCount - 1, 0), 4);
            const isAnnounced = slot.figurine?.releaseStatus === "ANNOUNCED";
            const isReleased = slot.figurine?.releaseStatus === "RELEASED";
            const serialNumber = slot.figurine
              ? `${String((Math.abs(slot.figurine.id) * 73) % 5000).padStart(4, "0")} / 5000`
              : "0000 / 5000";

            return (
              <Box
                key={slot.key}
                sx={{
                  gridColumn: { xs: "span 1", sm: `span ${Math.min(pattern.colSpan, 2)}`, md: `span ${pattern.colSpan}` },
                  gridRow: `span ${rowSpan}`,
                  perspective: "1200px",
                }}
              >
                <Box
                  onClick={slot.owned ? () => handleToggleFlip(slot) : undefined}
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.62s ease",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    cursor: slot.owned ? "pointer" : "default",
                  }}
                >
                  {stackLayers > 0 &&
                    Array.from({ length: stackLayers }, (_, layerIndex) => {
                      const offset = (layerIndex + 1) * 3;
                      const rotate = (layerIndex % 2 === 0 ? -1 : 1) * (layerIndex + 1) * 0.55;
                      return (
                        <Box
                          key={`stack-${slot.key}-${layerIndex}`}
                          sx={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.32)}`,
                            background: `linear-gradient(165deg, ${alpha(theme.palette.primary.dark, 0.72)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
                            transform: `translate(${offset}px, ${offset}px) rotate(${rotate}deg)`,
                            boxShadow: "0 7px 14px rgba(0,0,0,0.28)",
                            zIndex: 0,
                            pointerEvents: "none",
                          }}
                        />
                      );
                    })}

                  <Card
                    sx={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 1,
                      backfaceVisibility: "hidden",
                      overflow: "hidden",
                      borderRadius: 2,
                      border: slot.owned
                        ? `1px solid ${alpha(theme.palette.primary.main, 0.45)}`
                        : isAnnounced
                          ? `1px dashed ${alpha(theme.palette.secondary.main, 0.72)}`
                          : `1px dashed ${alpha(theme.palette.divider, 0.58)}`,
                      background: slot.owned
                        ? `linear-gradient(165deg, ${alpha(theme.palette.primary.dark, 0.84)} 0%, ${alpha(theme.palette.secondary.dark, 0.82)} 100%)`
                        : isAnnounced
                          ? `linear-gradient(165deg, ${alpha(theme.palette.secondary.dark, 0.42)} 0%, ${alpha(theme.palette.background.default, 0.78)} 100%)`
                          : `linear-gradient(165deg, ${alpha(theme.palette.text.disabled, 0.44)} 0%, ${alpha(theme.palette.action.disabledBackground, 0.62)} 100%)`,
                      filter: slot.owned ? "none" : "grayscale(1) contrast(0.82) brightness(0.78)",
                      transform: `rotate(${pattern.tilt}deg)`,
                      transition: "transform 0.2s ease, box-shadow 0.25s ease",
                      boxShadow: slot.owned
                        ? "0 8px 26px rgba(0,0,0,0.34)"
                        : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                      "&::after": !slot.owned
                        ? {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(165deg, rgba(18,18,18,0.36) 0%, rgba(9,11,18,0.28) 100%)",
                            pointerEvents: "none",
                          }
                        : undefined,
                      "&:hover": slot.owned
                        ? {
                            transform: `translateY(-4px) rotate(${pattern.tilt}deg)`,
                            boxShadow: `0 12px 30px ${alpha(theme.palette.info.main, 0.26)}`,
                          }
                        : undefined,
                    }}
                  >
                    {imageUrl ? (
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={slot.figurine?.name}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          opacity: slot.owned ? 1 : 0.74,
                          filter: slot.owned ? "none" : "grayscale(1) brightness(0.82) contrast(0.9)",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          p: 1,
                          textAlign: "center",
                          color: "rgba(255,255,255,0.75)",
                        }}
                      >
                        <Typography sx={{ fontSize: "1.2rem", lineHeight: 1 }}>☆</Typography>
                        <Typography variant="caption">Missing Figurine</Typography>
                      </Box>
                    )}

                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, transparent 0%, rgba(3,4,8,0.10) 40%, rgba(6,7,12,0.86) 100%)",
                      }}
                    />

                    {stackLayers > 0 && (
                      <Chip
                        label={`x${duplicateCount}`}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          bgcolor: alpha(theme.palette.background.default, 0.9),
                          color: theme.palette.primary.light,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.44)}`,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.34)",
                        }}
                      />
                    )}

                    {slot.figurine && (
                      <Chip
                        label={slot.owned ? "Collected" : isAnnounced ? "Announced" : "Missing"}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          bgcolor: slot.owned
                            ? alpha(theme.palette.info.main, 0.84)
                            : isAnnounced
                              ? alpha(theme.palette.secondary.main, 0.82)
                              : alpha(theme.palette.grey[500], 0.76),
                          color: "#fff",
                          border: slot.owned
                            ? `1px solid ${alpha(theme.palette.info.light, 0.46)}`
                            : isAnnounced
                              ? `1px solid ${alpha(theme.palette.secondary.light, 0.5)}`
                              : `1px solid ${alpha(theme.palette.common.white, 0.34)}`,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.34)",
                        }}
                      />
                    )}

                    {isAnnounced && (
                      <Chip
                        label="Not released yet"
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 34,
                          left: 8,
                          height: 18,
                          fontSize: "0.6rem",
                          fontWeight: 800,
                          bgcolor: alpha(theme.palette.background.paper, 0.3),
                          color: theme.palette.secondary.light,
                          border: `1px solid ${alpha(theme.palette.secondary.light, 0.38)}`,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.24)",
                        }}
                      />
                    )}

                    <Box sx={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: slot.owned
                            ? theme.palette.primary.light
                            : isAnnounced
                              ? theme.palette.secondary.light
                              : alpha(theme.palette.text.primary, 0.72),
                          fontWeight: 700,
                          lineHeight: 1.2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {slot.owned ? slot.figurine?.displayableName : slot.figurine?.displayableName ?? "Not collected yet"}
                      </Typography>
                      {isAnnounced && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            mt: 0.35,
                            color: alpha(theme.palette.secondary.light, 0.92),
                            fontWeight: 700,
                            lineHeight: 1.15,
                          }}
                        >
                          Not part of the collection yet
                        </Typography>
                      )}
                      {slot.figurine && noteText.length > 0 && (
                        <Tooltip
                          title={noteText}
                          arrow
                          placement="top-start"
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: "-webkit-box",
                              mt: 0.5,
                              color: slot.owned
                                ? alpha(theme.palette.text.primary, 0.9)
                                : alpha(theme.palette.text.primary, 0.74),
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              lineHeight: 1.25,
                            }}
                          >
                            {noteText}
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                  </Card>

                  {slot.owned && slot.figurine && (
                    <Card
                      sx={{
                        position: "absolute",
                        inset: 0,
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        borderRadius: 2,
                        border: "1px solid rgba(112, 124, 142, 0.5)",
                        background:
                            isAnnounced
                              ? `linear-gradient(155deg, ${alpha(theme.palette.secondary.dark, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`
                              : `linear-gradient(155deg, rgba(88,98,114,0.98) 0%, rgba(70,79,95,0.98) 52%, rgba(53,60,73,0.98) 100%)`,
                        p: { xs: 1.6, md: 2 },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 1,
                        overflow: "hidden",
                        boxShadow: "inset 0 0 0 1px rgba(186,201,222,0.12), 0 9px 22px rgba(0,0,0,0.34)",
                        "&::after": {
                          content: '"MYTH CLOTH"',
                          position: "absolute",
                          top: "49%",
                          left: "50%",
                          transform: "translate(-50%, -50%) rotate(-24deg)",
                          fontSize: "0.78rem",
                          letterSpacing: "0.2rem",
                          fontWeight: 800,
                          color: "rgba(198, 212, 232, 0.12)",
                          whiteSpace: "nowrap",
                          pointerEvents: "none",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          width: 24,
                          height: 24,
                          background:
                            "linear-gradient(135deg, rgba(187,198,217,0.95) 0%, rgba(149,163,187,0.9) 55%, rgba(116,129,152,0.86) 100%)",
                          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                          borderLeft: "1px solid rgba(138,154,179,0.45)",
                          borderBottom: "1px solid rgba(138,154,179,0.35)",
                          boxShadow: "-2px 2px 6px rgba(18,23,34,0.28)",
                          pointerEvents: "none",
                          zIndex: 2,
                        }}
                      />

                      <Box sx={{ position: "relative", zIndex: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isAnnounced ? theme.palette.secondary.light : "rgba(228,236,248,0.92)",
                              fontWeight: 900,
                              letterSpacing: "0.06rem",
                              textTransform: "uppercase",
                            }}
                          >
                              {isBackDisplayNameLoading ? "Loading sticker name..." : backDisplayName ?? slot.figurine.displayableName}
                          </Typography>
                        </Stack>

                        {isAnnounced && (
                          <Alert
                            severity="info"
                            variant="outlined"
                            sx={{
                              mb: 0.8,
                              py: 0.4,
                              px: 0.8,
                              bgcolor: alpha(theme.palette.background.paper, 0.42),
                              color: theme.palette.text.primary,
                              borderColor: alpha(theme.palette.secondary.main, 0.36),
                              "& .MuiAlert-icon": {
                                py: 0,
                                color: theme.palette.secondary.main,
                              },
                            }}
                          >
                            This figurine is not part of the collection yet because it has not been released.
                          </Alert>
                        )}

                        <Box
                          sx={{
                            borderTop: "1px dashed rgba(179,196,220,0.34)",
                            mb: 0.7,
                          }}
                        />
                        <Typography variant="caption" sx={{ display: "block", color: "rgba(220,231,246,0.9)", fontWeight: 700 }}>
                          Serial: {isAnnounced ? "Pending release" : serialNumber}
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", color: "rgba(220,231,246,0.9)", fontWeight: 700 }}>
                          Year: {isAnnounced ? "TBA" : slot.figurine.year ?? "Unknown"}
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", color: "rgba(220,231,246,0.9)", fontWeight: 700 }}>
                          {isAnnounced ? "Not part of the collection yet" : getTrackingLabel(slot.figurine)}
                        </Typography>

                        <Chip
                          label={slot.figurine.releaseStatus}
                          size="small"
                          sx={{
                            mt: 0.8,
                            height: 22,
                            fontSize: "0.62rem",
                            fontWeight: 900,
                            color: "#f5f8ff",
                            bgcolor: isReleased
                              ? alpha(theme.palette.success.main, 0.84)
                              : alpha(theme.palette.secondary.main, 0.82),
                            border: `1px solid ${alpha(theme.palette.common.white, 0.26)}`,
                          }}
                        />
                      </Box>

                      <Stack direction="row" spacing={0.8} sx={{ position: "relative", zIndex: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/figurines/${slot.figurine!.id}`);
                          }}
                          sx={{
                            borderColor: "rgba(172,188,212,0.42)",
                            bgcolor: "rgba(232,240,252,0.16)",
                            color: "rgba(235,243,255,0.95)",
                          }}
                        >
                          View
                        </Button>
                        <Tooltip title="Remove from collection">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFigurine(slot.figurine!.id);
                            }}
                            sx={{ color: "rgba(144,52,43,0.92)" }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Card>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box
          sx={{
            display: { xs: "none", lg: "flex" },
            width: 82,
            position: "sticky",
            top: { lg: 176 },
            alignSelf: "flex-start",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: TIMELINE_HEIGHT,
              position: "relative",
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "linear-gradient(180deg, rgba(11,16,33,0.72) 0%, rgba(8,12,24,0.72) 100%)",
              px: 1,
              py: 1.2,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 14,
                bottom: 14,
                left: "50%",
                width: 2,
                transform: "translateX(-50%)",
                bgcolor: "rgba(255,255,255,0.2)",
                borderRadius: 4,
              }}
            />

            {newestYear && (
              <Typography
                variant="caption"
                sx={{
                  position: "absolute",
                  top: 6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "#b8cbff",
                  fontWeight: 700,
                }}
              >
                {newestYear}
              </Typography>
            )}

            {oldestYear && (
              <Typography
                variant="caption"
                sx={{
                  position: "absolute",
                  bottom: 6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "#b8cbff",
                  fontWeight: 700,
                }}
              >
                {oldestYear}
              </Typography>
            )}

            {activeYear && (
              <Chip
                label={activeYear}
                size="small"
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: `calc(${12 + timelineProgress * (TIMELINE_HEIGHT - 40)}px)`,
                  transform: "translate(-50%, -50%)",
                  bgcolor: "rgba(79,195,247,0.92)",
                  color: "#07101f",
                  fontWeight: 800,
                  border: "1px solid rgba(255,255,255,0.45)",
                }}
              />
            )}
          </Box>
        </Box>
        </Box>
      </Box>
    </Box>
  );
}
