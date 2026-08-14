import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { useDisplayCurrency } from "../../../currency/CurrencyContext";
import { isSupportedCurrency, type SupportedCurrency } from "../../../currency/currency";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Snackbar,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CelebrationIcon from "@mui/icons-material/Celebration";

import {
  getFigurineAverageRealtimePrice,
  getFigurineById,
  getFigurineHistoricalPrices,
  getStores,
  type FigurineHistoricalPricePoint,
  type StoreSummary,
} from "../api/figurineApi";
import type { Figurine, ReleaseStatus } from "../types/figurine";
import { countryCodeToFlag } from "../../../utils/countryFlag";
import { formatCurrencyAmount } from "../../../utils/formatCurrencyAmount";
import AnniversaryIcon from "./AnniversaryIcon";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import { formatIsoDateLabel } from "../../../utils/formatIsoDateLabel";
import AddToCollectionModal from "../../collections/components/AddToCollectionModal";
import { getCollections } from "../../collections/api/collectionApi";
import AppPageHeader from "../../../components/AppPageHeader";

const RELEASE_STATUS_CONFIG: Record<ReleaseStatus, { label: string; color: string; borderColor: string }> = {
  RELEASED:  { label: "Released",  color: "#4caf50", borderColor: "rgba(76,175,80,0.30)"   },
  ANNOUNCED: { label: "Announced", color: "#42a5f5", borderColor: "rgba(66,165,245,0.30)"  },
  RUMORED:   { label: "Rumored",   color: "#ff9800", borderColor: "rgba(255,152,0,0.35)"   },
  PROTOTYPE: { label: "Prototype", color: "#90a4ae", borderColor: "rgba(144,164,174,0.30)" },
  UNRELEASED: { label: "Unreleased", color: "#ef5350", borderColor: "rgba(239,83,80,0.30)" },
};

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <Chip
      label={label}
      size="small"
      icon={value
        ? <CheckCircleOutlineIcon style={{ fontSize: 13 }} />
        : <CancelOutlinedIcon style={{ fontSize: 13 }} />}
      sx={{
        fontWeight: value ? 700 : 400,
        fontSize: "0.72rem",
        height: 24,
        bgcolor: value ? "rgba(212,175,55,0.15)" : "transparent",
        color: value ? "primary.main" : "text.disabled",
        border: "1px solid",
        borderColor: value ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)",
        "& .MuiChip-icon": { color: value ? "primary.main" : "text.disabled" },
      }}
    />
  );
}

type SelectedCollectionContext = {
  id: number;
  name: string;
  figurineIds: number[];
};

function getRestockOrdinalLabel(restockCount: number): string {
  const ordinalWords: Record<number, string> = {
    1: "First",
    2: "Second",
    3: "Third",
    4: "Fourth",
    5: "Fifth",
    6: "Sixth",
    7: "Seventh",
    8: "Eighth",
    9: "Ninth",
    10: "Tenth",
  };

  if (restockCount <= 0) {
    return "Restock";
  }

  if (ordinalWords[restockCount]) {
    return `${ordinalWords[restockCount]} Restock`;
  }

  const mod100 = restockCount % 100;
  const mod10 = restockCount % 10;
  let suffix = "th";

  if (mod100 < 11 || mod100 > 13) {
    if (mod10 === 1) suffix = "st";
    else if (mod10 === 2) suffix = "nd";
    else if (mod10 === 3) suffix = "rd";
  }

  return `${restockCount}${suffix} Restock`;
}

export default function FigurineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, isAuthenticated } = useAuth();
  const { selectedCurrency } = useDisplayCurrency();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [figurine, setFigurine] = useState<Figurine | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [averageRealtimePrice, setAverageRealtimePrice] = useState<number | null>(null);
  const [averageRealtimePriceCurrency, setAverageRealtimePriceCurrency] = useState<SupportedCurrency | null>(null);
  const [, setAverageRealtimePriceLoading] = useState(false);
  const [, setAverageRealtimePriceError] = useState<string | null>(null);
  const [historicalStores, setHistoricalStores] = useState<StoreSummary[]>([]);
  const [selectedHistoricalStoreId, setSelectedHistoricalStoreId] = useState<number | null>(null);
  const [historicalPrices, setHistoricalPrices] = useState<FigurineHistoricalPricePoint[]>([]);
  const [historicalCurrency, setHistoricalCurrency] = useState<string>("JPY");
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  const historicalRequestIdRef = useRef(0);
  const [hoveredHistoricalPoint, setHoveredHistoricalPoint] = useState<{
    storeName: string;
    checkedAt: string;
    price: number;
    color: string;
    x: number;
    y: number;
    storeLogoUrl?: string | null;
    storeProductUrl?: string | null;
  } | null>(null);
  const [pinnedHistoricalPoint, setPinnedHistoricalPoint] = useState<{
    storeName: string;
    checkedAt: string;
    price: number;
    color: string;
    x: number;
    y: number;
    storeLogoUrl?: string | null;
    storeProductUrl?: string | null;
  } | null>(null);
  const [selectedCollectionContext, setSelectedCollectionContext] = useState<SelectedCollectionContext | null>(() => {
    const stateCollection = (location.state as { selectedCollection?: SelectedCollectionContext } | null)?.selectedCollection;
    if (stateCollection) {
      return stateCollection;
    }

    const rawStoredContext = sessionStorage.getItem("figurineSelectedCollectionContext");
    if (!rawStoredContext) {
      return null;
    }

    try {
      const parsedContext = JSON.parse(rawStoredContext) as SelectedCollectionContext;
      if (
        parsedContext &&
        typeof parsedContext.id === "number" &&
        typeof parsedContext.name === "string" &&
        Array.isArray(parsedContext.figurineIds)
      ) {
        return parsedContext;
      }
    } catch {
      sessionStorage.removeItem("figurineSelectedCollectionContext");
    }

    return null;
  });

  const navList: number[] = JSON.parse(sessionStorage.getItem("figurineNavList") ?? "[]");
  const currentIndex = navList.indexOf(Number(id));
  const prevId = currentIndex > 0 ? navList[currentIndex - 1] : null;
  const nextId = currentIndex !== -1 && currentIndex < navList.length - 1 ? navList[currentIndex + 1] : null;
  const collectionSearch = sessionStorage.getItem("figurineCollectionSearch");
  const figurineId = Number(id);
  const isInSelectedCollection = selectedCollectionContext
    ? selectedCollectionContext.figurineIds.includes(figurineId)
    : null;

  useEffect(() => {
    const stateCollection = (location.state as { selectedCollection?: SelectedCollectionContext } | null)?.selectedCollection;
    if (!stateCollection) {
      return;
    }

    setSelectedCollectionContext(stateCollection);
    sessionStorage.setItem("figurineSelectedCollectionContext", JSON.stringify(stateCollection));
  }, [location.state]);

  const handleBackToCollection = () => {
    navigate(collectionSearch ? `/figurines?${collectionSearch}` : "/figurines");
  };

  useEffect(() => {
    setLoading(true);
    setAverageRealtimePriceLoading(true);
    setAverageRealtimePriceError(null);

    getFigurineById(Number(id))
      .then((data) => {
        setFigurine(data);
        setSelectedImage(0);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "figurine details" }));
      })
      .finally(() => setLoading(false));

    getFigurineAverageRealtimePrice(Number(id), { currency: selectedCurrency ?? undefined })
      .then((result) => {
        setAverageRealtimePrice(result.realTimePrice);
        setAverageRealtimePriceCurrency(result.currency);
      })
      .catch(() => {
        setAverageRealtimePrice(null);
        setAverageRealtimePriceCurrency(null);
        setAverageRealtimePriceError("Live average price is not available right now.");
      })
      .finally(() => setAverageRealtimePriceLoading(false));
  }, [id, selectedCurrency]);

  const hasRealtimeAveragePrice = averageRealtimePrice !== null && averageRealtimePrice > 0;

  const resolvedRealtimeCurrency = (() => {
    if (averageRealtimePriceCurrency) {
      return averageRealtimePriceCurrency;
    }

    return selectedCurrency ?? "JPY";
  })();

  const formatAmount = (amount: number, currency?: string | null): string => {
    return formatCurrencyAmount(amount, currency, {
      style: "symbolCode",
      locale: "en-US",
      fallbackCurrency: "JPY",
    });
  };

  const formatAmountCompact = (amount: number, currency?: string | null): string => {
    return formatCurrencyAmount(amount, currency, {
      style: "symbolCode",
      locale: "en-US",
      notation: "compact",
      maximumFractionDigits: 1,
      fallbackCurrency: "JPY",
    });
  };

  useEffect(() => {
    if (!hasRealtimeAveragePrice) {
      return;
    }

    let isActive = true;

    getStores()
      .then((stores) => {
        if (!isActive) {
          return;
        }

        setHistoricalStores(stores.filter((store) => store.active !== false));
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setHistoricalStores([]);
      });

    return () => {
      isActive = false;
    };
  }, [hasRealtimeAveragePrice]);

  useEffect(() => {
    if (
      selectedHistoricalStoreId !== null
      && !historicalStores.some((store) => store.id === selectedHistoricalStoreId)
    ) {
      setSelectedHistoricalStoreId(null);
    }
  }, [historicalStores, selectedHistoricalStoreId]);

  useEffect(() => {
    if (!hasRealtimeAveragePrice) {
      return;
    }

    historicalRequestIdRef.current += 1;
    const requestId = historicalRequestIdRef.current;

    setHistoricalLoading(true);
    setHistoricalError(null);
    setHoveredHistoricalPoint(null);
    setPinnedHistoricalPoint(null);
    setHistoricalCurrency((selectedCurrency ?? "JPY").trim().toUpperCase());

    getFigurineHistoricalPrices(Number(id), {
      currency: selectedCurrency ?? undefined,
      storeId: selectedHistoricalStoreId ?? undefined,
    })
      .then((response) => {
        if (requestId !== historicalRequestIdRef.current) {
          return;
        }

        const rawCurrency = response.currency?.trim().toUpperCase();
        const parsedResponseCurrency = isSupportedCurrency(rawCurrency)
          ? rawCurrency
          : (selectedCurrency ?? "JPY");

        const parsedPrices = (Array.isArray(response.prices) ? response.prices : [])
          .map((point) => {
            const parsedPrice = typeof point.price === "number" ? point.price : Number(point.price);
            return {
              storeName: point.storeName,
              storeLogoUrl: point.storeLogoUrl,
              storeProductUrl: point.storeProductUrl,
              checkedAt: point.checkedAt,
              price: Number.isFinite(parsedPrice) ? parsedPrice : NaN,
            };
          })
          .filter((point) => Number.isFinite(point.price) && Boolean(point.checkedAt) && Boolean(point.storeName));

        setHistoricalCurrency(parsedResponseCurrency);
        setHistoricalPrices(parsedPrices);
      })
      .catch((err) => {
        if (requestId !== historicalRequestIdRef.current) {
          return;
        }

        setHistoricalPrices([]);
        setHistoricalError(getApiErrorMessage(err, { action: "load", resource: "historical prices" }));
      })
      .finally(() => {
        if (requestId === historicalRequestIdRef.current) {
          setHistoricalLoading(false);
        }
      });
  }, [hasRealtimeAveragePrice, id, selectedCurrency, selectedHistoricalStoreId]);

  useEffect(() => {
    if (!hasRealtimeAveragePrice) {
      setHoveredHistoricalPoint(null);
      setPinnedHistoricalPoint(null);
    }
  }, [hasRealtimeAveragePrice]);

  const activeHistoricalPoint = pinnedHistoricalPoint ?? hoveredHistoricalPoint;

  const normalizedHistoricalPrices = useMemo(() => {
    return historicalPrices
      .filter((point) => Number.isFinite(point.price) && Boolean(point.checkedAt) && Boolean(point.storeName))
      .map((point) => ({
        ...point,
        checkedAtTs: new Date(point.checkedAt).getTime(),
      }))
      .filter((point) => Number.isFinite(point.checkedAtTs))
      .sort((a, b) => a.checkedAtTs - b.checkedAtTs);
  }, [historicalPrices]);

  const historySeries = useMemo(() => {
    const grouped = new Map<string, {
      storeName: string;
      storeLogoUrl?: string | null;
      storeProductUrl?: string | null;
      points: typeof normalizedHistoricalPrices;
    }>();

    normalizedHistoricalPrices.forEach((point) => {
      const existing = grouped.get(point.storeName);
      if (existing) {
        existing.points.push(point);
        return;
      }

      grouped.set(point.storeName, {
        storeName: point.storeName,
        storeLogoUrl: point.storeLogoUrl,
        storeProductUrl: point.storeProductUrl,
        points: [point],
      });
    });

    return Array.from(grouped.values());
  }, [normalizedHistoricalPrices]);

  const chartBounds = useMemo(() => {
    if (normalizedHistoricalPrices.length === 0) {
      return null;
    }

    const xValues = normalizedHistoricalPrices.map((point) => point.checkedAtTs);
    const yValues = normalizedHistoricalPrices.map((point) => point.price);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const ySpread = maxY - minY;
    const yPadding = ySpread === 0 ? Math.max(minY * 0.05, 1) : ySpread * 0.12;

    return {
      minX,
      maxX,
      minY: Math.max(0, minY - yPadding),
      maxY: maxY + yPadding,
    };
  }, [normalizedHistoricalPrices]);

  const handleHistoricalStoreChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    if (value === "ALL") {
      setSelectedHistoricalStoreId(null);
      return;
    }

    const parsed = Number(value);
    setSelectedHistoricalStoreId(Number.isFinite(parsed) ? parsed : null);
  };

  const isAllStoresSelected = selectedHistoricalStoreId === null;

  const chartColorPalette = [
    theme.palette.primary.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.secondary.main,
    "#ef5350",
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!figurine) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error">Figurine not found.</Alert>
      </Box>
    );
  }

  const images = figurine.officialImageUrls ?? [];
  const mainImage = images[selectedImage] ?? null;
  const catalogDetails = [
    { label: "Line Up", value: figurine.lineUp.description },
    { label: "Series", value: figurine.series.description },
    { label: "Group", value: figurine.group?.description },
    { label: "Distribution", value: figurine.distribution?.description },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
  const notesText = figurine.notes ? figurine.notes.replace(/\\n/g, "\n") : "";
  const canAddFigurinesToCollections = hasPermission("collections:figurines:add");
  const shouldShowAddToCollectionButton =
    isAuthenticated
    && canAddFigurinesToCollections
    && (figurine.releaseStatus === "ANNOUNCED" || figurine.releaseStatus === "RELEASED");
  const restocks = (figurine.restocks ?? [])
    .filter((restock) => Number.isFinite(restock.id))
    .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
  const hasRestocks = restocks.length > 0;
  const restockOrdinalLabel = getRestockOrdinalLabel(restocks.length);
  const isTamashiiNationsDistribution =
    figurine.distribution?.description?.trim().toLowerCase() === "tamashii nations";

  return (
    <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Back button + title + prev/next */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          mb: 3,
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.default",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          mx: { xs: -1.5, sm: -2, md: -3 },
          px: { xs: 1.5, sm: 2, md: 3 },
          py: 1,
          borderBottom: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        <Tooltip title="Back to Myth Cloth Collection">
          <IconButton onClick={handleBackToCollection} sx={{ mt: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AppPageHeader
            eyebrow="Figurines"
            title={figurine.displayableName}
            subtitle="Review release details, market pricing, store links, and collection status for this Myth Cloth entry."
            compact
            actions={
              <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                  {navList.length > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Tooltip title={prevId ? "Previous figurine" : ""}>
                        <span>
                          <IconButton
                            onClick={() =>
                              prevId &&
                              navigate(`/figurines/${prevId}`, {
                                replace: true,
                                state: selectedCollectionContext
                                  ? { selectedCollection: selectedCollectionContext }
                                  : undefined,
                              })
                            }
                            disabled={!prevId}
                            size="small"
                            sx={{ color: prevId ? "primary.main" : "text.disabled" }}
                          >
                            <ChevronLeftIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Typography variant="caption" sx={{ color: "text.secondary", minWidth: 40, textAlign: "center" }}>
                        {currentIndex + 1} / {navList.length}
                      </Typography>
                      <Tooltip title={nextId ? "Next figurine" : ""}>
                        <span>
                          <IconButton
                            onClick={() =>
                              nextId &&
                              navigate(`/figurines/${nextId}`, {
                                replace: true,
                                state: selectedCollectionContext
                                  ? { selectedCollection: selectedCollectionContext }
                                  : undefined,
                              })
                            }
                            disabled={!nextId}
                            size="small"
                            sx={{ color: nextId ? "primary.main" : "text.disabled" }}
                          >
                            <ChevronRightIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  )}
                  {hasPermission("figurines:update") && (
                    <Button
                      variant="outlined"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => navigate(`/figurines/${id}/edit`)}
                      sx={{ flexShrink: 0 }}
                    >
                      Edit
                    </Button>
                  )}
                  {shouldShowAddToCollectionButton && (
                    <Button
                      variant="contained"
                      startIcon={<FavoriteBorderIcon />}
                      onClick={() => setAddToCollectionOpen(true)}
                      sx={{
                        flexShrink: 0,
                        background: "linear-gradient(135deg, #4fc3f7 0%, #81d4fa 100%)",
                        color: "#000",
                        fontWeight: 600,
                        "&:hover": {
                          background: "linear-gradient(135deg, #81d4fa 0%, #4fc3f7 100%)",
                          boxShadow: "0 8px 24px rgba(79,195,247,0.3)",
                        },
                        transition: "all 0.3s ease",
                        animation: "pulse 2s infinite",
                        "@keyframes pulse": {
                          "0%, 100%": {
                            opacity: 1,
                          },
                          "50%": {
                            opacity: 0.8,
                          },
                        },
                      }}
                    >
                      Add to Collection
                    </Button>
                  )}
                </Box>
              </Box>
            }
          />
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* ── Left column: images ── */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Main image */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              paddingTop: "125%",
              bgcolor: "#0a0b14",
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid rgba(212,175,55,0.18)",
            }}
          >
            {figurine.isRevival && (
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  left: -34,
                  zIndex: 2,
                  width: 150,
                  py: 0.6,
                  textAlign: "center",
                  transform: "rotate(-35deg)",
                  bgcolor: "primary.main",
                  color: "#1a1202",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                }}
              >
                Revival
              </Box>
            )}

            {hasRealtimeAveragePrice && (
              <Box
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: 3,
                  minWidth: 176,
                  maxWidth: 228,
                  borderRadius: 1,
                  px: 1.3,
                  py: 1.1,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  background: (theme) => theme.palette.background.paper,
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  boxShadow: (theme) => theme.shadows[6],
                  transition: "transform 180ms ease, box-shadow 180ms ease",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: (theme) => theme.shadows[10],
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.8 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, fontSize: "0.62rem" }}
                  >
                    Live Market Price
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.45 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        color: "info.main",
                        bgcolor: "info.main",
                        boxShadow: "0 0 0 0 currentColor",
                        animation: "livePulseBadge 1.7s ease-in-out infinite",
                        "@keyframes livePulseBadge": {
                          "0%": { boxShadow: "0 0 0 0 currentColor" },
                          "70%": { boxShadow: "0 0 0 9px transparent" },
                          "100%": { boxShadow: "0 0 0 0 transparent" },
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "info.main", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.62rem" }}>
                      LIVE
                    </Typography>
                  </Box>
                </Box>

                <Tooltip title="Real-time average from stores" placement="bottom-end">
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.3,
                      color: "primary.main",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      lineHeight: 1.15,
                      cursor: "help",
                    }}
                  >
                    {formatAmount(averageRealtimePrice, resolvedRealtimeCurrency)}
                  </Typography>
                </Tooltip>
              </Box>
            )}

            {mainImage ? (
              <Box
                component="img"
                src={mainImage}
                alt={figurine.name}
                sx={{
                  position: "absolute",
                  top: 0, left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  transition: "opacity 0.25s",
                  background: "#181a22",
                }}
              />
            ) : (
              <Box
                sx={{
                  position: "absolute",
                  top: 0, left: 0,
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column", gap: 1, color: "text.secondary",
                }}
              >
                <ImageNotSupportedOutlinedIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                <Typography variant="body2" sx={{ opacity: 0.4 }}>No image available</Typography>
              </Box>
            )}
          </Box>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
              {images.map((url, i) => (
                <Box
                  key={i}
                  component="img"
                  src={url}
                  alt={`${figurine.name} ${i + 1}`}
                  onClick={() => setSelectedImage(i)}
                  sx={{
                    width: 60,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 1,
                    cursor: "pointer",
                    border: i === selectedImage
                      ? "2px solid rgba(212,175,55,0.9)"
                      : "2px solid rgba(212,175,55,0.15)",
                    opacity: i === selectedImage ? 1 : 0.55,
                    transition: "opacity 0.2s, border-color 0.2s",
                    "&:hover": { opacity: 1 },
                  }}
                />
              ))}
            </Box>
          )}
        </Grid>

        {/* ── Right column: info ── */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Core catalog info */}
          <Box
            sx={{
              bgcolor: "rgba(212,175,55,0.05)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderRadius: 2,
              p: 2,
              mb: 2,
            }}
          >
            <Grid container spacing={1}>
              {catalogDetails.map(({ label, value }) => (
                <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", fontSize: "0.65rem" }}>
                    {label}
                  </Typography>
                  {label === "Distribution" && isTamashiiNationsDistribution ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25, flexWrap: "wrap" }}>
                      <Typography variant="body2" sx={{ color: "text.primary" }}>
                        {value}
                      </Typography>
                      <Tooltip title="Commemorative event figurine." arrow>
                        <Chip
                          size="small"
                          icon={<CelebrationIcon sx={{ fontSize: "0.84rem !important" }} />}
                          label="Commemorative"
                          sx={{
                            height: 22,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            bgcolor: "#ffffff",
                            color: "#c98a00",
                            border: "1px solid rgba(255, 193, 7, 0.34)",
                            "& .MuiChip-icon": {
                              color: "#c98a00",
                              ml: 0.55,
                            },
                          }}
                        />
                      </Tooltip>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: "text.primary", mt: 0.25 }}>
                      {value}
                    </Typography>
                  )}
                </Grid>
              ))}
              {figurine.releaseStatus && (() => {
                const cfg = RELEASE_STATUS_CONFIG[figurine.releaseStatus];
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", fontSize: "0.65rem" }}>
                      Release Status
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: cfg.color, border: `1px solid ${cfg.borderColor}`, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: cfg.color, fontWeight: 600 }}>
                        {cfg.label}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })()}
              {hasRestocks && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", fontSize: "0.65rem" }}>
                    Restock
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                    <AutorenewIcon sx={{ fontSize: 16, color: "info.main" }} />
                    <Typography variant="body2" sx={{ color: "text.primary" }}>
                      {restockOrdinalLabel}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {figurine.anniversary && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", fontSize: "0.65rem" }}>
                    Anniversary
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                    <AnniversaryIcon sx={{ fontSize: 18, color: "#bfa100" }} />
                    <Typography variant="body2" sx={{ color: "text.primary" }}>
                      {figurine.anniversary.description}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {(figurine.tamashiiUrl || selectedCollectionContext) && (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      mt: 0.75,
                      pt: 1.25,
                      borderTop: "1px solid rgba(212,175,55,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: { xs: "stretch", sm: "flex-start" },
                      gap: 1.25,
                      flexDirection: { xs: "column", sm: "row" },
                    }}
                  >
                    {selectedCollectionContext && isInSelectedCollection !== null && (
                      <Chip
                        size="small"
                        icon={isInSelectedCollection ? <CheckCircleOutlineIcon /> : <CancelOutlinedIcon />}
                        label={
                          isInSelectedCollection
                            ? `Owned in ${selectedCollectionContext.name}`
                            : `Missing in ${selectedCollectionContext.name}`
                        }
                        variant="outlined"
                        sx={{
                          height: 30,
                          borderRadius: 999,
                          fontWeight: 700,
                          maxWidth: { xs: "100%", sm: 320 },
                          borderColor: isInSelectedCollection ? "rgba(76,175,80,0.45)" : "rgba(255,152,0,0.38)",
                          bgcolor: isInSelectedCollection ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.10)",
                          alignSelf: { xs: "stretch", sm: "auto" },
                          "& .MuiChip-icon": {
                            color: isInSelectedCollection ? "#66bb6a" : "#ffb74d",
                            fontSize: 16,
                            ml: 0.75,
                          },
                          "& .MuiChip-label": {
                            fontWeight: 700,
                            letterSpacing: "0.01em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            pr: 1.1,
                          },
                        }}
                      />
                    )}
                    {figurine.tamashiiUrl && (
                      <Button
                        component="a"
                        href={figurine.tamashiiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        endIcon={<OpenInNewIcon />}
                        sx={{ flexShrink: 0, alignSelf: { xs: "stretch", sm: "auto" }, ml: { sm: "auto" } }}
                      >
                        Open Official Page
                      </Button>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>

          {hasRestocks && (
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(212,175,55,0.12)",
                borderRadius: 2,
                p: 1.5,
                mb: 2,
              }}
            >
              <Typography variant="overline" sx={{ color: "text.secondary", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                Restock References
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.35, mb: 1.1, fontSize: "0.86rem" }}>
                This figurine is a restock. Open a related previous release:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {restocks.map((restock) => {
                  const isCurrentFigurine = restock.id === figurine.id;
                  const hasDay = restock.releaseDate.split("-").length >= 3 && Boolean(restock.releaseDate.split("-")[2]);
                  const releaseDateLabel = formatIsoDateLabel(restock.releaseDate, { includeDay: hasDay });

                  return (
                    <Chip
                      key={`${restock.id}-${restock.releaseDate}`}
                      label={`${releaseDateLabel}`}
                      clickable={!isCurrentFigurine}
                      disabled={isCurrentFigurine}
                      onClick={() => {
                        if (isCurrentFigurine) {
                          return;
                        }

                        navigate(`/figurines/${restock.id}`, {
                          state: selectedCollectionContext
                            ? { selectedCollection: selectedCollectionContext }
                            : undefined,
                        });
                      }}
                      variant="outlined"
                      icon={<RocketLaunchOutlinedIcon sx={{ fontSize: "0.9rem !important" }} />}
                      sx={{
                        height: 28,
                        borderRadius: 999,
                        fontWeight: 700,
                        borderColor: "rgba(79,195,247,0.45)",
                        color: "info.main",
                        bgcolor: "rgba(79,195,247,0.08)",
                        "& .MuiChip-icon": { color: "info.main", ml: 0.75 },
                        "& .MuiChip-label": {
                          fontSize: "0.75rem",
                          letterSpacing: "0.01em",
                          pr: 1,
                        },
                        "&:hover": {
                          bgcolor: "rgba(79,195,247,0.14)",
                        },
                        "&.Mui-disabled": {
                          borderColor: "rgba(255,255,255,0.16)",
                          color: "text.disabled",
                          bgcolor: "rgba(255,255,255,0.02)",
                        },
                        "&.Mui-disabled .MuiChip-icon": {
                          color: "text.disabled",
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Attributes */}
          <Typography variant="overline" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
            Attributes
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2, mt: 0.5 }}>
            <BoolRow label="Metal Body"          value={figurine.isMetalBody} />
            <BoolRow label="Articulable"         value={figurine.isArticulable} />
            <BoolRow label="Revival"             value={figurine.isRevival} />
            <BoolRow label="Original Color Ed." value={figurine.isOriginalColorEdition} />
            <BoolRow label="Battle Damaged"      value={figurine.isBattleDamaged} />
            <BoolRow label="Golden Armor"        value={figurine.isGoldenArmor} />
            <BoolRow label="Gold 24K Edition"    value={figurine.isGold24kEdition} />
            <BoolRow label="Manga Version"       value={figurine.isMangaVersion} />
            <BoolRow label="Plain Cloth"         value={figurine.isPlainCloth} />
            <BoolRow label="Multi-Pack"          value={figurine.isMultiPack} />
          </Box>

          {/* Notes */}
          {notesText && (
            <>
              <Divider sx={{ borderColor: "rgba(212,175,55,0.1)", mb: 1.5 }} />
              <Typography
                variant="overline"
                sx={(theme) => theme.custom.magazineNotes.label}
              >
                Additional Information
              </Typography>
              <Box
                sx={(theme) => ({
                  ...theme.custom.magazineNotes.container,
                  p: { xs: 1.25, sm: 1.5 },
                  pb: { xs: 1.75, sm: 3 },
                })}
              >
                <Typography
                  sx={(theme) => ({
                    ...theme.custom.magazineNotes.body,
                    fontSize: { xs: "1rem", sm: "1.05rem" },
                    whiteSpace: "pre-line",
                  })}
                >
                  {notesText}
                </Typography>
              </Box>
            </>
          )}

          {/* Distributors */}
          {figurine.distributors?.length > 0 && (
            <>
              <Divider sx={{ borderColor: "rgba(212,175,55,0.1)", mb: 1.5 }} />
              <Typography variant="overline" sx={{ color: "text.secondary", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                Official Worldwide Distributors
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 0.75 }}>
                {figurine.distributors.map((d, i) => {
                  const distributorCurrencyRaw = d.currency?.trim().toUpperCase();
                  const distributorCurrency = isSupportedCurrency(distributorCurrencyRaw)
                    ? distributorCurrencyRaw
                    : "JPY";
                  return (
                  <Box
                    key={i}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(212,175,55,0.12)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    {/* Header row */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 1.5,
                        py: 1,
                        bgcolor: "rgba(0,0,0,0.18)",
                        borderBottom: "1px solid rgba(212,175,55,0.08)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Tooltip title={d.distributor.countryCode} placement="top" arrow>
                          <Typography component="span" sx={{ fontSize: "1.1rem", lineHeight: 1, cursor: "default" }}>
                            {countryCodeToFlag(d.distributor.countryCode)}
                          </Typography>
                        </Tooltip>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          {d.distributor.description}
                        </Typography>
                      </Box>
                      {d.distributor.website && (
                        <Tooltip title={d.distributor.website}>
                          <IconButton
                            component="a"
                            href={d.distributor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            sx={{ color: "secondary.main", "&:hover": { color: "primary.main" } }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    {/* Details grid */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0, px: 1.5, py: 1 }}>
                      {/* Price */}
                      <Box sx={{ flex: "1 1 120px", py: 0.5, pr: 2 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                          Price
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          {d.price != null ? formatAmount(d.price, distributorCurrency) : (
                            <Typography component="span" variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>
                              N/A
                            </Typography>
                          )}
                        </Typography>
                        {d.priceWithTax != null && d.priceWithTax !== d.price && d.distributor.countryCode !== "MX" && (
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                            {formatCurrencyAmount(d.priceWithTax, d.currency, {
                              style: "symbolCode",
                              locale: "en-US",
                              fallbackCurrency: "JPY",
                            })} w/ tax
                          </Typography>
                        )}
                      </Box>

                      {/* Pre-order */}
                      {d.preorderOpensAt && (
                        <Box sx={{ flex: "1 1 120px", py: 0.5, pr: 2 }}>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                            Pre-order
                          </Typography>
                          <Typography variant="body2" fontWeight={500} color="text.primary">
                            {formatIsoDateLabel(d.preorderOpensAt, { includeDay: true })}
                          </Typography>
                        </Box>
                      )}

                      {/* Release date */}
                      <Box sx={{ flex: "1 1 120px", py: 0.5, pr: 2 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                          Release
                        </Typography>
                        {d.releaseDate ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={500} color="text.primary">
                              {formatIsoDateLabel(d.releaseDate, { includeDay: d.releaseDateConfirmed })}
                            </Typography>
                            {!d.releaseDateConfirmed && (
                              <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic", fontSize: "0.68rem" }}>
                                (unconfirmed)
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic", fontSize: "0.8rem" }}>
                            TBD
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  );
                })}
              </Box>
            </>
          )}

          {/* Historical prices */}
          {hasRealtimeAveragePrice && (
            <>
              <Divider sx={{ borderColor: "rgba(212,175,55,0.1)", mt: 2, mb: 1.5 }} />
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", fontSize: "0.65rem", letterSpacing: "0.1em" }}
              >
                Historical Prices
              </Typography>

              <Box sx={{ mt: 0.9 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 1,
                    alignItems: { xs: "stretch", sm: "center" },
                    justifyContent: "space-between",
                    mb: 1.25,
                  }}
                >
                  <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 260 }, maxWidth: { xs: "100%", sm: 320 } }}>
                    <InputLabel id="historical-store-select-label">Store</InputLabel>
                    <Select
                      labelId="historical-store-select-label"
                      value={selectedHistoricalStoreId === null ? "ALL" : String(selectedHistoricalStoreId)}
                      label="Store"
                      onChange={handleHistoricalStoreChange}
                    >
                      <MenuItem value="ALL">All Stores</MenuItem>
                      {historicalStores.map((store) => (
                        <MenuItem key={store.id} value={String(store.id)}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                            {store.logoUrl ? (
                              <Box
                                component="img"
                                src={store.logoUrl}
                                alt={store.name}
                                sx={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }}
                              />
                            ) : (
                              <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: "action.selected", flexShrink: 0 }} />
                            )}
                            <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                              {store.name}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {historicalLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={26} />
                  </Box>
                ) : historicalError ? (
                  <Alert severity="error">{historicalError}</Alert>
                ) : normalizedHistoricalPrices.length === 0 ? (
                  <Alert severity="info">No historical prices available for the selected store.</Alert>
                ) : (
                  <Box
                    sx={{
                      position: "relative",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      p: { xs: 1, sm: 1.25 },
                    }}
                    onClick={() => {
                      if (pinnedHistoricalPoint) {
                        setPinnedHistoricalPoint(null);
                      }
                    }}
                  >
                    <Box
                      component="svg"
                      key={`history-chart-${historicalCurrency}`}
                      viewBox="0 0 920 260"
                      sx={{
                        width: "100%",
                        height: { xs: 220, sm: 260 },
                        display: "block",
                      }}
                    >
                      {(() => {
                        if (!chartBounds) {
                          return null;
                        }

                        const chartWidth = 920;
                        const chartHeight = 260;
                        const paddingRight = 14;
                        const paddingTop = 16;
                        const paddingBottom = 36;
                        const safeMaxX = chartBounds.maxX === chartBounds.minX ? chartBounds.minX + 1 : chartBounds.maxX;
                        const safeMaxY = chartBounds.maxY === chartBounds.minY ? chartBounds.minY + 1 : chartBounds.maxY;
                        const rawYTickValues = Array.from({ length: 5 }, (_, idx) => {
                          const ratio = idx / 4;
                          return chartBounds.minY + (safeMaxY - chartBounds.minY) * (1 - ratio);
                        });
                        const rawYTickLabels = rawYTickValues.map((value) => {
                          return isSmallScreen
                            ? formatAmountCompact(value, historicalCurrency)
                            : formatAmount(value, historicalCurrency);
                        });
                        const estimatedCharWidthPx = 6.2;
                        const maxTickLabelChars = rawYTickLabels.reduce((max, label) => Math.max(max, label.length), 0);
                        const paddingLeft = Math.min(176, Math.max(76, Math.ceil(maxTickLabelChars * estimatedCharWidthPx + 14)));
                        const innerWidth = chartWidth - paddingLeft - paddingRight;
                        const innerHeight = chartHeight - paddingTop - paddingBottom;

                        const toX = (ts: number) => {
                          const ratio = (ts - chartBounds.minX) / (safeMaxX - chartBounds.minX);
                          return paddingLeft + ratio * innerWidth;
                        };

                        const toY = (price: number) => {
                          const ratio = (price - chartBounds.minY) / (safeMaxY - chartBounds.minY);
                          return paddingTop + (1 - ratio) * innerHeight;
                        };

                        const yTicks = rawYTickValues.map((_, idx) => {
                          const ratio = idx / 4;
                          return {
                            y: paddingTop + ratio * innerHeight,
                            label: rawYTickLabels[idx],
                          };
                        });

                        const xTicks = Array.from({ length: 5 }, (_, idx) => {
                          const ratio = idx / 4;
                          const ts = chartBounds.minX + (safeMaxX - chartBounds.minX) * ratio;
                          const formattedDate = new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "2-digit",
                          }).format(new Date(ts));
                          return {
                            x: paddingLeft + ratio * innerWidth,
                            label: formattedDate,
                          };
                        });

                        return (
                          <>
                            {yTicks.map((tick, idx) => (
                              <g key={`y-tick-${idx}`}>
                                <line
                                  x1={paddingLeft}
                                  y1={tick.y}
                                  x2={chartWidth - paddingRight}
                                  y2={tick.y}
                                  stroke={theme.palette.divider}
                                  strokeWidth="1"
                                  strokeDasharray={idx === yTicks.length - 1 ? "0" : "3 4"}
                                />
                                <text
                                  x={paddingLeft - 8}
                                  y={tick.y + 3}
                                  textAnchor="end"
                                  fontSize="10"
                                  fill={theme.palette.text.secondary}
                                >
                                  {tick.label}
                                </text>
                              </g>
                            ))}

                            {xTicks.map((tick, idx) => (
                              <text
                                key={`x-tick-${idx}`}
                                x={tick.x}
                                y={chartHeight - 12}
                                textAnchor="middle"
                                fontSize="10"
                                fill={theme.palette.text.secondary}
                              >
                                {tick.label}
                              </text>
                            ))}

                            {isAllStoresSelected && normalizedHistoricalPrices.length > 1 && (() => {
                              const combinedPoints = normalizedHistoricalPrices.map((point) => ({
                                x: toX(point.checkedAtTs),
                                y: toY(point.price),
                              }));

                              const combinedPath = combinedPoints
                                .map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`)
                                .join(" ");

                              return (
                                <path
                                  d={combinedPath}
                                  fill="none"
                                  stroke={theme.palette.text.primary}
                                  strokeWidth="2.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  opacity="0.55"
                                />
                              );
                            })()}

                            {historySeries.map((series, seriesIdx) => {
                              const color = chartColorPalette[seriesIdx % chartColorPalette.length];
                              const points = series.points.map((point) => ({
                                ...point,
                                x: toX(point.checkedAtTs),
                                y: toY(point.price),
                              }));

                              const path = points
                                .map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`)
                                .join(" ");

                              return (
                                <g key={series.storeName}>
                                  {!isAllStoresSelected && points.length > 1 && (
                                    <path
                                      d={path}
                                      fill="none"
                                      stroke={color}
                                      strokeWidth="2.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  )}
                                  {points.map((point, idx) => (
                                    <circle
                                      key={`${series.storeName}-${idx}`}
                                      cx={point.x}
                                      cy={point.y}
                                      r={activeHistoricalPoint?.storeName === series.storeName && activeHistoricalPoint?.checkedAt === point.checkedAt ? "5.4" : "3.8"}
                                      fill={color}
                                      stroke={theme.palette.background.paper}
                                      strokeWidth="1.3"
                                      style={{ cursor: "pointer" }}
                                      onMouseEnter={() => {
                                        if (pinnedHistoricalPoint) {
                                          return;
                                        }

                                        setHoveredHistoricalPoint({
                                          storeName: series.storeName,
                                          storeLogoUrl: series.storeLogoUrl,
                                          storeProductUrl: series.storeProductUrl,
                                          checkedAt: point.checkedAt,
                                          price: point.price,
                                          color,
                                          x: point.x,
                                          y: point.y,
                                        });
                                      }}
                                      onMouseLeave={() => {
                                        if (!pinnedHistoricalPoint) {
                                          setHoveredHistoricalPoint(null);
                                        }
                                      }}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        const nextPoint = {
                                          storeName: series.storeName,
                                          storeLogoUrl: series.storeLogoUrl,
                                          storeProductUrl: series.storeProductUrl,
                                          checkedAt: point.checkedAt,
                                          price: point.price,
                                          color,
                                          x: point.x,
                                          y: point.y,
                                        };

                                        if (
                                          pinnedHistoricalPoint?.storeName === nextPoint.storeName
                                          && pinnedHistoricalPoint?.checkedAt === nextPoint.checkedAt
                                        ) {
                                          setPinnedHistoricalPoint(null);
                                          return;
                                        }

                                        setPinnedHistoricalPoint(nextPoint);
                                        setHoveredHistoricalPoint(nextPoint);
                                      }}
                                      onTouchStart={(event) => {
                                        event.stopPropagation();
                                        const nextPoint = {
                                          storeName: series.storeName,
                                          storeLogoUrl: series.storeLogoUrl,
                                          storeProductUrl: series.storeProductUrl,
                                          checkedAt: point.checkedAt,
                                          price: point.price,
                                          color,
                                          x: point.x,
                                          y: point.y,
                                        };
                                        setPinnedHistoricalPoint(nextPoint);
                                        setHoveredHistoricalPoint(nextPoint);
                                      }}
                                    >
                                      <title>
                                        {`${series.storeName} • ${formatAmount(point.price, historicalCurrency)} • ${new Intl.DateTimeFormat("en-US", {
                                          month: "short",
                                          day: "2-digit",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }).format(new Date(point.checkedAt))}`}
                                      </title>
                                    </circle>
                                  ))}
                                </g>
                              );
                            })}

                            {activeHistoricalPoint && (
                              <g>
                                <line
                                  x1={activeHistoricalPoint.x}
                                  y1={paddingTop}
                                  x2={activeHistoricalPoint.x}
                                  y2={paddingTop + innerHeight}
                                  stroke={activeHistoricalPoint.color}
                                  strokeWidth="1"
                                  strokeDasharray="4 4"
                                  opacity="0.7"
                                />
                                <line
                                  x1={paddingLeft}
                                  y1={activeHistoricalPoint.y}
                                  x2={chartWidth - paddingRight}
                                  y2={activeHistoricalPoint.y}
                                  stroke={activeHistoricalPoint.color}
                                  strokeWidth="1"
                                  strokeDasharray="4 4"
                                  opacity="0.5"
                                />
                              </g>
                            )}
                          </>
                        );
                      })()}
                    </Box>

                    {activeHistoricalPoint && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: { xs: 8, sm: 10 },
                          right: { xs: 8, sm: 10 },
                          zIndex: 2,
                          minWidth: 170,
                          maxWidth: 230,
                          px: 1,
                          py: 0.8,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.default",
                          boxShadow: theme.shadows[3],
                        }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: activeHistoricalPoint.color, flexShrink: 0 }} />
                          {activeHistoricalPoint.storeLogoUrl ? (
                            <Box
                              component="img"
                              src={activeHistoricalPoint.storeLogoUrl}
                              alt={activeHistoricalPoint.storeName}
                              sx={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }}
                            />
                          ) : null}
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {activeHistoricalPoint.storeName}
                          </Typography>
                        </Box>
                        <Typography sx={{ mt: 0.35, color: "text.primary", fontWeight: 800, fontSize: "0.86rem", lineHeight: 1.15 }}>
                          {formatAmount(activeHistoricalPoint.price, historicalCurrency)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem", display: "block", mt: 0.15 }}>
                          {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(activeHistoricalPoint.checkedAt))}
                        </Typography>
                        {activeHistoricalPoint.storeProductUrl && (
                          <Button
                            component="a"
                            href={activeHistoricalPoint.storeProductUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            variant="text"
                            endIcon={<OpenInNewIcon sx={{ fontSize: "0.9rem !important" }} />}
                            sx={{
                              mt: 0.35,
                              px: 0,
                              minWidth: 0,
                              justifyContent: "flex-start",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              textTransform: "none",
                            }}
                          >
                            Open product
                          </Button>
                        )}
                      </Box>
                    )}

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                      {historySeries.map((series, idx) => {
                        const color = chartColorPalette[idx % chartColorPalette.length];
                        return (
                          <Box
                            key={`${series.storeName}-legend`}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.6,
                              px: 0.75,
                              py: 0.45,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                              bgcolor: "background.default",
                              maxWidth: "100%",
                            }}
                          >
                            <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                            {series.storeLogoUrl ? (
                              <Box
                                component="img"
                                src={series.storeLogoUrl}
                                alt={series.storeName}
                                sx={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }}
                              />
                            ) : null}
                            <Typography variant="caption" sx={{ color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {series.storeName}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
            </>
          )}

          {/* Events timeline */}
          {figurine.events && figurine.events.length > 0 && (
            <>
              <Divider sx={{ borderColor: "rgba(212,175,55,0.1)", mt: 2, mb: 1.5 }} />
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", fontSize: "0.65rem", letterSpacing: "0.1em" }}
              >
                Chronology
              </Typography>

              <Box sx={{ position: "relative", mt: 1.5, ml: 1 }}>
                {/* Vertical connector line */}
                <Box
                  sx={{
                    position: "absolute",
                    left: 7,
                    top: 8,
                    bottom: 8,
                    width: 2,
                    bgcolor: "rgba(212,175,55,0.18)",
                    borderRadius: 1,
                  }}
                />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {figurine.events.map((ev) => {
                    const isRelease = (ev.type ?? "").toUpperCase().includes("RELEASE");
                    const rawEventDate = typeof ev.date === "string" ? ev.date.trim() : "";
                    const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(rawEventDate);
                    const formattedEventDateLabel = isIsoDate
                      ? formatIsoDateLabel(rawEventDate, {
                        includeDay: ev.dateConfirmed,
                        monthCase: "upper",
                      })
                      : "TBD";
                    const formattedDateParts = formattedEventDateLabel.replace(",", "").split(/\s+/);
                    const eventMonthAbbr = formattedDateParts[0] ?? "TBD";
                    const eventDay = ev.dateConfirmed ? (formattedDateParts[1] ?? "") : "";
                    const eventYear = ev.dateConfirmed
                      ? (formattedDateParts[2] ?? "TBD")
                      : (formattedDateParts[1] ?? "TBD");
                    return (
                    <Box key={ev.id} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                      {/* Timeline dot */}
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor: isRelease ? "primary.main" : "background.paper",
                          border: "2px solid",
                          borderColor: "primary.main",
                          boxShadow: isRelease
                            ? "0 0 12px rgba(212,175,55,0.7), 0 0 4px rgba(212,175,55,0.9)"
                            : "0 0 6px rgba(212,175,55,0.4)",
                          flexShrink: 0,
                          mt: 0.25,
                          zIndex: 1,
                        }}
                      />

                      {/* Content card */}
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "stretch",
                          bgcolor: isRelease ? "rgba(212,175,55,0.09)" : "rgba(212,175,55,0.04)",
                          border: "1px solid",
                          borderColor: isRelease ? "rgba(212,175,55,0.4)" : "rgba(212,175,55,0.12)",
                          borderRadius: 2,
                          overflow: "hidden",
                          boxShadow: isRelease ? "0 2px 12px rgba(212,175,55,0.12)" : "none",
                        }}
                      >
                        {/* Date badge column */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 52,
                            px: 1,
                            py: 1.25,
                            bgcolor: isRelease ? "rgba(212,175,55,0.12)" : "rgba(0,0,0,0.15)",
                            borderRight: "1px solid",
                            borderColor: isRelease ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.07)",
                            flexShrink: 0,
                          }}
                        >
                          <Typography sx={{ fontSize: "0.58rem", fontWeight: 800, color: "primary.main", letterSpacing: "0.1em", lineHeight: 1 }}>
                            {eventMonthAbbr}
                          </Typography>
                          {ev.dateConfirmed && eventDay ? (
                            <Typography sx={{ fontSize: "1.45rem", fontWeight: 800, color: isRelease ? "primary.main" : "text.primary", lineHeight: 1.1, mt: 0.25 }}>
                              {eventDay}
                            </Typography>
                          ) : null}
                          <Typography sx={{ fontSize: "0.58rem", color: "text.secondary", letterSpacing: "0.04em", lineHeight: 1, mt: 0.25 }}>
                            {eventYear}
                          </Typography>
                        </Box>

                        {/* Main content */}
                        <Box sx={{ flex: 1, px: 1.5, py: 1.25 }}>
                          {/* Flag + release badge */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                          <Tooltip title={ev.region} placement="top" arrow>
                            <Typography
                              component="span"
                              sx={{ fontSize: "1rem", lineHeight: 1, cursor: "default" }}
                            >
                              {countryCodeToFlag(ev.region)}
                            </Typography>
                          </Tooltip>
                          {isRelease && (
                            <Chip
                              icon={<RocketLaunchOutlinedIcon sx={{ fontSize: "0.75rem !important" }} />}
                              label="Release"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                bgcolor: "rgba(212,175,55,0.18)",
                                color: "primary.main",
                                border: "1px solid rgba(212,175,55,0.35)",
                                "& .MuiChip-icon": { color: "primary.main" },
                              }}
                            />
                          )}
                        </Box>

                        {/* Description */}
                        <Typography
                          variant="body2"
                          sx={{ color: isRelease ? "text.primary" : "text.secondary", fontSize: "0.82rem", lineHeight: 1.5 }}
                        >
                          {ev.description}
                        </Typography>
                        </Box>{/* end main content */}
                      </Box>
                    </Box>
                    );
                  })}
                </Box>
              </Box>
            </>
          )}
        </Grid>
      </Grid>

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

      <Snackbar
        open={addSuccess}
        autoHideDuration={3000}
        onClose={() => setAddSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setAddSuccess(false)}>
          ✨ Added to collection successfully!
        </Alert>
      </Snackbar>

      {figurine && (
        <AddToCollectionModal
          open={addToCollectionOpen}
          onClose={() => setAddToCollectionOpen(false)}
          figurineId={figurine.id}
          figurineName={figurine.displayableName}
          onSuccess={async () => {
            setAddSuccess(true);
            setAddToCollectionOpen(false);

            if (!selectedCollectionContext) {
              return;
            }

            try {
              const collections = await getCollections();
              const refreshedSelectedCollection = collections.find(
                (collection) => collection.id === selectedCollectionContext.id
              );

              if (!refreshedSelectedCollection) {
                return;
              }

              const updatedContext: SelectedCollectionContext = {
                id: refreshedSelectedCollection.id,
                name: refreshedSelectedCollection.name,
                figurineIds: refreshedSelectedCollection.figurineIds ?? [],
              };

              setSelectedCollectionContext(updatedContext);
              sessionStorage.setItem("figurineSelectedCollectionContext", JSON.stringify(updatedContext));
            } catch {
              // Keep current UI state if a background refresh fails.
            }
          }}
        />
      )}
    </Box>
  );
}
