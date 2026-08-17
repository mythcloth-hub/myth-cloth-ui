import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
  Snackbar,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import CloseIcon from "@mui/icons-material/Close";

import { useAuth } from "../../../auth/AuthContext";
import { useDisplayCurrency } from "../../../currency/CurrencyContext";
import AppPageHeader from "../../../components/AppPageHeader";
import { useBulkSelection } from "../../../hooks/useBulkSelection";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import { formatCurrencyAmount } from "../../../utils/formatCurrencyAmount";
import {
  getMatchedListingsByStoreId,
  getMatchedListingsSummary,
  manuallyMatchFigurineListing,
  unmatchFigurineListings,
  type FigurineStoreMatched,
  type FigurineStoreMatchedPrice,
  type FigurineStoreMatchedSummary,
} from "../api/matchedListingsSummaryApi";

function extractHostName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getLineupLabel(lineup?: string | null): string {
  const normalized = lineup?.trim();
  return normalized && normalized.length > 0 ? normalized : "Unknown lineup";
}

function getSafeImage(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTokenSet(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token.length >= 3),
  );
}

function getNameSimilarityPercent(left: string, right: string): number {
  const leftTokens = toTokenSet(left);
  const rightTokens = toTokenSet(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  });

  const unionSize = new Set([...leftTokens, ...rightTokens]).size;
  return Math.round((overlap / Math.max(unionSize, 1)) * 100);
}

function getStatusLabel(value?: string | null): string {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return "Unknown";
  return normalized.replace(/_/g, " ");
}

function getStatusColor(value?: string | null): "default" | "success" | "warning" | "error" | "info" {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return "default";

  if (normalized === "IN_STOCK") return "success";
  if (normalized === "OUT_OF_STOCK") return "error";
  if (normalized === "PREORDER") return "info";
  if (normalized === "SOLD_OUT") return "warning";
  if (normalized === "UNKNOWN") return "default";

  return "default";
}

function formatStorePrice(amount?: number | null, currency?: string | null): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return "N/A";
  }

  return formatCurrencyAmount(amount, currency, {
    style: "currency",
    locale: "en-US",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    fallbackCurrency: "USD",
  });
}

function getUpdatedAtParts(value?: string | null): { date: string; time: string } | null {
  const normalized = value?.trim();
  if (!normalized) return null;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return { date: normalized, time: "" };
  }

  return {
    date: parsed.toLocaleDateString(),
    time: parsed.toLocaleTimeString(),
  };
}

function toTimestamp(value?: string | null): number | null {
  const normalized = value?.trim();
  if (!normalized) return null;

  const parsed = new Date(normalized);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getEffectivePrice(price: FigurineStoreMatchedPrice): number | null {
  const amount = price.discountedPrice ?? price.realTimePrice;
  return typeof amount === "number" && Number.isFinite(amount) ? amount : null;
}

function getPriceChange(current: FigurineStoreMatchedPrice, previous?: FigurineStoreMatchedPrice): number | null {
  if (!previous) return null;

  const currentAmount = getEffectivePrice(current);
  const previousAmount = getEffectivePrice(previous);

  if (currentAmount === null || previousAmount === null) {
    return null;
  }

  return currentAmount - previousAmount;
}

function getPriceChangeColor(change: number | null): "default" | "success" | "error" {
  if (change === null || change === 0) return "default";
  return change < 0 ? "success" : "error";
}

function getPriceChangeLabel(change: number | null, currency?: string | null): string | null {
  if (change === null) return null;
  if (change === 0) return "No change";

  const direction = change < 0 ? "Down" : "Up";
  return `${direction} ${formatStorePrice(Math.abs(change), currency)}`;
}

function buildSparklinePath(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";
  if (values.length === 1) {
    const y = height / 2;
    return `M 0 ${y} L ${width} ${y}`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function FigurineMatchedStoreDetailPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { hasPermission } = useAuth();
  const { selectedCurrency } = useDisplayCurrency();

  const [items, setItems] = useState<FigurineStoreMatched[]>([]);
  const [storeSummary, setStoreSummary] = useState<FigurineStoreMatchedSummary | null>(null);
  const [hideStoreLogo, setHideStoreLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualMatchTarget, setManualMatchTarget] = useState<FigurineStoreMatched | null>(null);
  const [savingManualMatch, setSavingManualMatch] = useState(false);
  const [bulkUnmatchOpen, setBulkUnmatchOpen] = useState(false);
  const [savingBulkUnmatch, setSavingBulkUnmatch] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const bulkSelection = useBulkSelection(items);
  const canAssignMatches = hasPermission("figurines:stores:assign");

  const parsedStoreId = useMemo(() => {
    const parsed = Number(storeId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [storeId]);

  const loadDetails = async () => {
    if (parsedStoreId === null) {
      setLoading(false);
      setErrorMessage("Invalid store id.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getMatchedListingsByStoreId(parsedStoreId, {
        currency: selectedCurrency ?? undefined,
      });
      setItems(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, { action: "load", resource: "matched store figurines" }));
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatchClick = (item: FigurineStoreMatched) => {
    setManualMatchTarget(item);
  };

  const handleConfirmManualMatch = async () => {
    if (!manualMatchTarget) {
      return;
    }

    setSavingManualMatch(true);
    try {
      await manuallyMatchFigurineListing(manualMatchTarget.id);
      await loadDetails();
      setSuccessMessage(`Marked "${manualMatchTarget.figurineDisplayableName}" for manual matching.`);
      setManualMatchTarget(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, { action: "update", resource: "manual figurine match" }));
    } finally {
      setSavingManualMatch(false);
    }
  };

  const handleConfirmBulkUnmatch = async () => {
    const selectedIds = Array.from(bulkSelection.selectedIds);
    if (selectedIds.length === 0) {
      setBulkUnmatchOpen(false);
      return;
    }

    setSavingBulkUnmatch(true);
    try {
      await unmatchFigurineListings(selectedIds);
      await loadDetails();
      bulkSelection.clearAll();
      setSuccessMessage(
        `Sent ${selectedIds.length} match${selectedIds.length === 1 ? "" : "es"} to manual matching.`,
      );
      setBulkUnmatchOpen(false);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, { action: "update", resource: "manual figurine match" }));
    } finally {
      setSavingBulkUnmatch(false);
    }
  };

  useEffect(() => {
    const loadStoreSummary = async () => {
      try {
        const summaries = await getMatchedListingsSummary({ currency: selectedCurrency ?? undefined });
        setStoreSummary(summaries.find((summary) => summary.storeId === parsedStoreId) ?? null);
      } catch {
        setStoreSummary(null);
      }
    };

    void loadDetails();
    void loadStoreSummary();
  }, [parsedStoreId, selectedCurrency]);

  const storeHost = useMemo(() => {
    const candidate = items[0]?.storeProductUrl;
    if (!candidate) {
      return storeSummary?.storeName ?? (parsedStoreId !== null ? `Store ${parsedStoreId}` : "Store");
    }

    return storeSummary?.storeName ?? extractHostName(candidate);
  }, [items, parsedStoreId, storeSummary?.storeName]);

  const storeLogo = storeSummary?.storeLogo?.trim() || null;

  useEffect(() => {
    setHideStoreLogo(false);
  }, [storeLogo]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#d4af37" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: canAssignMatches && bulkSelection.selectedCount > 0 ? 12 : 3 }}>
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
        <Tooltip title="Back to Stores">
          <IconButton onClick={() => navigate("/figurine-matching/stores")} sx={{ mt: 0.5 }}>
            <ArrowBackOutlinedIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AppPageHeader
            eyebrow="Figurine Matching"
            title={`${storeHost} Match Details`}
            subtitle="Compare each store listing against the matched catalog figurine side by side."
            compact
            actions={
              <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                <Box
                  sx={{
                    width: { xs: 44, md: 50 },
                    height: { xs: 44, md: 50 },
                    bgcolor: "#ffffff",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {storeLogo && !hideStoreLogo ? (
                    <Box
                      component="img"
                      src={storeLogo}
                      alt={storeHost}
                      onError={() => setHideStoreLogo(true)}
                      sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.4 }}
                    />
                  ) : (
                    <CompareArrowsOutlinedIcon sx={{ color: "rgba(56,73,90,0.8)" }} />
                  )}
                </Box>
              </Box>
            }
          />
        </Box>
      </Box>

      {!errorMessage && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              label={`${items.length} matched figurine${items.length === 1 ? "" : "s"}`}
              sx={{ fontWeight: 700, border: "1px solid rgba(212,175,55,0.26)", bgcolor: "rgba(212,175,55,0.08)" }}
            />
            {canAssignMatches && (
              <Chip
                color={bulkSelection.selectedCount > 0 ? "warning" : "default"}
                variant={bulkSelection.selectedCount > 0 ? "filled" : "outlined"}
                label={`${bulkSelection.selectedCount} selected`}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>
        </Box>
      )}

      {!errorMessage && items.length === 0 && (
        <Box
          sx={{
            minHeight: "45vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography variant="h6">No matched figurines for this store</Typography>
          <Typography variant="body2" color="text.secondary">
            This store has no matched listing details yet.
          </Typography>
        </Box>
      )}

      <Stack spacing={1.5}>
        {items.map((item, index) => {
          const storeImage = getSafeImage(item.storeProductImageUrl);
          const figurineImage = getSafeImage(item.figurineOfficialImageUrl);
          const lineupLabel = getLineupLabel(item.figurineLineUp);
          const nameSimilarity = getNameSimilarityPercent(item.storeOriginalName, item.figurineDisplayableName);
          const similaritySeverity = nameSimilarity >= 60 ? "success" : nameSimilarity >= 35 ? "warning" : "default";
          const fallbackCurrency = item.storeCurrency?.trim() || storeSummary?.currency || null;
          const storeStatus = item.storeStatus?.trim() || null;
          const isStorePreorder = item.storePreorder === true;
          const storePrices = ((item.storePrices ?? []) as FigurineStoreMatchedPrice[])
            .slice()
            .sort((left, right) => {
              const leftTimestamp = toTimestamp(left.lastUpdated);
              const rightTimestamp = toTimestamp(right.lastUpdated);

              if (leftTimestamp === null && rightTimestamp === null) return 0;
              if (leftTimestamp === null) return 1;
              if (rightTimestamp === null) return -1;

              return rightTimestamp - leftTimestamp;
            });
          const effectiveCurrencies = Array.from(
            new Set(storePrices.map((price) => price.currency?.trim() || fallbackCurrency || "UNKNOWN")),
          );
          const canRenderTrend = effectiveCurrencies.length <= 1;
          const trendValues = canRenderTrend ? storePrices.map((price) => getEffectivePrice(price)).filter((value): value is number => value !== null) : [];
          const sparklinePath = trendValues.length > 0 ? buildSparklinePath(trendValues.slice().reverse(), 220, 44) : "";

          return (
            <Card
              key={item.id}
              sx={{
                borderTop: "2px solid rgba(79,195,247,0.25)",
                opacity: 0,
                animation: `matchedDetailReveal 460ms cubic-bezier(0.2, 0.9, 0.2, 1) ${Math.min(90 + index * 24, 420)}ms forwards`,
                "@keyframes matchedDetailReveal": {
                  "0%": { opacity: 0, transform: "translateY(10px)" },
                  "100%": { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Typography variant="overline" sx={{ color: "#9fd7f4", letterSpacing: "0.09em" }}>
                      Store Listing
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5,
                        border: "1px solid rgba(79,195,247,0.2)",
                        borderRadius: 2,
                        overflow: "hidden",
                        bgcolor: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <Box sx={{ position: "relative", pt: { xs: "58%", md: "52%" }, bgcolor: "#0a0b14" }}>
                        {storeImage ? (
                          <Box
                            component="img"
                            src={storeImage}
                            alt={item.storeOriginalName}
                            sx={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              p: 0.45,
                              bgcolor: "#0b0c16",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "text.secondary",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <ImageNotSupportedOutlinedIcon sx={{ opacity: 0.4 }} />
                            <Typography variant="caption">No image</Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.storeOriginalName}
                        </Typography>
                        {item.storeProductUrl && (
                          <Button
                            component={Link}
                            href={item.storeProductUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            startIcon={<OpenInNewOutlinedIcon />}
                            sx={{ mt: 0.5, px: 0.5 }}
                          >
                            Open Store Listing
                          </Button>
                        )}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        mt: 1,
                        p: 1.25,
                        borderRadius: 1.5,
                        border: "1px solid rgba(79,195,247,0.16)",
                        bgcolor: "rgba(79,195,247,0.06)",
                      }}
                    >
                      <Typography variant="overline" sx={{ color: "#9fd7f4", letterSpacing: "0.08em" }}>
                        Store Market Snapshot
                      </Typography>

                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.65, mb: 0.9 }}>
                        <Chip size="small" color={getStatusColor(storeStatus)} label={`${getStatusLabel(storeStatus)}`} />
                        {isStorePreorder && (
                          <Chip
                            size="small"
                            icon={<EventAvailableOutlinedIcon sx={{ fontSize: "0.88rem !important" }} />}
                            label="Pre-order"
                            sx={{
                              height: 24,
                              fontWeight: 800,
                              letterSpacing: "0.03em",
                              color: "#0b1020",
                              bgcolor: "#7dd3fc",
                              border: "1px solid rgba(125,211,252,0.75)",
                              boxShadow: "0 0 0 2px rgba(125,211,252,0.16)",
                              "& .MuiChip-icon": {
                                color: "#0b1020",
                                ml: 0.6,
                              },
                            }}
                          />
                        )}
                        <Chip size="small" variant="outlined" label={`${storePrices.length} price update${storePrices.length === 1 ? "" : "s"}`} />
                      </Stack>

                      {storePrices.length > 1 && (
                        <Box
                          sx={{
                            mb: 1,
                            p: 1,
                            borderRadius: 1.25,
                            border: "1px solid rgba(255,255,255,0.08)",
                            bgcolor: "rgba(255,255,255,0.025)",
                          }}
                        >
                          <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 0.6 }}>
                            Price trend over time
                          </Typography>

                          {canRenderTrend && sparklinePath ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                              <Box
                                component="svg"
                                viewBox="0 0 220 44"
                                preserveAspectRatio="none"
                                sx={{ width: "100%", maxWidth: 220, height: 44, overflow: "visible", flexShrink: 0 }}
                              >
                                <path d="M 0 38 L 220 38" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
                                <path d={sparklinePath} stroke="#4fc3f7" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                {trendValues.slice().reverse().map((value, pointIndex, points) => {
                                  const min = Math.min(...points);
                                  const max = Math.max(...points);
                                  const range = max - min || 1;
                                  const x = points.length === 1 ? 110 : (pointIndex / (points.length - 1)) * 220;
                                  const y = 44 - ((value - min) / range) * 44;

                                  return (
                                    <circle
                                      key={`${item.id}-trend-${pointIndex}`}
                                      cx={x}
                                      cy={y}
                                      r={pointIndex === points.length - 1 ? 4 : 3}
                                      fill={pointIndex === points.length - 1 ? "#d4af37" : "#4fc3f7"}
                                    />
                                  );
                                })}
                              </Box>

                              <Stack spacing={0.3} sx={{ minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Oldest
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Newest
                                </Typography>
                              </Stack>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Trend chart hidden because this history contains multiple currencies.
                            </Typography>
                          )}
                        </Box>
                      )}

                      {storePrices.length > 0 ? (
                        <Stack spacing={0.9}>
                          {storePrices.map((price, priceIndex) => {
                            const hasDiscount = (price.discount ?? 0) > 0;
                            const effectiveCurrency = price.currency?.trim() || fallbackCurrency || null;
                            const olderSnapshot = storePrices[priceIndex + 1];
                            const priceChange = getPriceChange(price, olderSnapshot);
                            const priceChangeLabel = getPriceChangeLabel(priceChange, effectiveCurrency);
                            const isLatest = priceIndex === 0;
                            const isOldest = priceIndex === storePrices.length - 1;
                            const updatedAtParts = getUpdatedAtParts(price.lastUpdated);

                            return (
                              <Stack
                                key={`${item.id}-price-${priceIndex}`}
                                direction="row"
                                spacing={1}
                                alignItems="stretch"
                              >
                                <Box
                                  sx={{
                                    width: 16,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <Tooltip
                                    placement="left"
                                    title={
                                      updatedAtParts ? (
                                        <Stack spacing={0.15} sx={{ py: 0.1 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                                            {updatedAtParts.date}
                                          </Typography>
                                          {updatedAtParts.time ? (
                                            <Typography variant="caption" sx={{ lineHeight: 1.1, opacity: 0.88 }}>
                                              {updatedAtParts.time}
                                            </Typography>
                                          ) : null}
                                        </Stack>
                                      ) : (
                                        "Timestamp unavailable"
                                      )
                                    }
                                  >
                                    <Box
                                      sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        mt: 0.8,
                                        cursor: "help",
                                        bgcolor: isLatest ? "#d4af37" : "#4fc3f7",
                                        boxShadow: isLatest
                                          ? "0 0 0 rgba(79,195,247,0.75)"
                                          : "0 0 0 3px rgba(79,195,247,0.12)",
                                        animation: isLatest ? "livePulseBadge 1.7s ease-in-out infinite" : undefined,
                                        "@keyframes livePulseBadge": {
                                          "0%": { boxShadow: "0 0 0 0 rgba(79,195,247,0.7)" },
                                          "70%": { boxShadow: "0 0 0 9px rgba(79,195,247,0)" },
                                          "100%": { boxShadow: "0 0 0 0 rgba(79,195,247,0)" },
                                        },
                                      }}
                                    />
                                  </Tooltip>
                                  {priceIndex < storePrices.length - 1 && (
                                    <Box sx={{ width: 2, flex: 1, my: 0.35, borderRadius: 999, bgcolor: "rgba(255,255,255,0.12)" }} />
                                  )}
                                </Box>

                                <Box
                                  sx={{
                                    flex: 1,
                                    p: 0.95,
                                    borderRadius: 1,
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    bgcolor: "rgba(0,0,0,0.18)",
                                  }}
                                >
                                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-start" useFlexGap flexWrap="wrap">
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                      {isLatest ? "Current price" : isOldest ? "Oldest snapshot" : "Recorded snapshot"}
                                    </Typography>
                                  </Stack>

                                  <Stack direction="row" spacing={1} alignItems="baseline" justifyContent="space-between" useFlexGap flexWrap="wrap" sx={{ mt: 0.35 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "1rem" }}>
                                      {formatStorePrice(price.discountedPrice ?? price.realTimePrice, effectiveCurrency)}
                                    </Typography>
                                    {priceChangeLabel && (
                                      <Chip
                                        size="small"
                                        color={getPriceChangeColor(priceChange)}
                                        variant={priceChange === 0 ? "outlined" : "filled"}
                                        label={priceChangeLabel}
                                        sx={{ height: 22, fontSize: "0.7rem" }}
                                      />
                                    )}
                                  </Stack>

                                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.45 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Base: {formatStorePrice(price.realTimePrice, effectiveCurrency)}
                                    </Typography>
                                    {hasDiscount && (
                                      <Chip
                                        size="small"
                                        color="warning"
                                        variant="filled"
                                        label={`-${Math.round(price.discount ?? 0)}%`}
                                        sx={{ height: 20, fontSize: "0.68rem" }}
                                      />
                                    )}
                                  </Stack>
                                </Box>
                              </Stack>
                            );
                          })}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No price history available for this store listing yet.
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Stack alignItems="center" spacing={0.4}>
                        {canAssignMatches && (
                          <Checkbox
                            checked={bulkSelection.isSelected(item.id)}
                            onChange={() => bulkSelection.toggleSelect(item.id)}
                            disabled={savingBulkUnmatch || savingManualMatch}
                            sx={{ color: "rgba(212,175,55,0.6)", "&.Mui-checked": { color: "#d4af37" } }}
                          />
                        )}
                        <CompareArrowsOutlinedIcon sx={{ color: "#d4af37" }} />
                        <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "0.08em" }}>
                          MATCHED
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 5 }}>
                    <Typography variant="overline" sx={{ color: "#d4af37", letterSpacing: "0.09em" }}>
                      Catalog Figurine
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5,
                        border: "1px solid rgba(212,175,55,0.22)",
                        borderRadius: 2,
                        overflow: "hidden",
                        bgcolor: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <Box sx={{ position: "relative", pt: { xs: "58%", md: "52%" }, bgcolor: "#0a0b14" }}>
                        {figurineImage ? (
                          <Box
                            component="img"
                            src={figurineImage}
                            alt={item.figurineDisplayableName}
                            sx={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              p: 0.45,
                              bgcolor: "#0b0c16",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "text.secondary",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <ImageNotSupportedOutlinedIcon sx={{ opacity: 0.4 }} />
                            <Typography variant="caption">No image</Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.figurineDisplayableName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                          {lineupLabel}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/figurines/${item.figurineId}`)}
                          >
                            Open Figurine
                          </Button>
                          {item.figurineTamashiiUrl && (
                            <Button
                              size="small"
                              component={Link}
                              href={item.figurineTamashiiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              startIcon={<OpenInNewOutlinedIcon />}
                            >
                              Official
                            </Button>
                          )}
                          {canAssignMatches && (
                            <Button
                              size="small"
                              variant="contained"
                              color="warning"
                              startIcon={<CompareArrowsOutlinedIcon />}
                              onClick={() => handleManualMatchClick(item)}
                              disabled={savingBulkUnmatch || savingManualMatch}
                            >
                              Manual Match
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.25, borderColor: "rgba(255,255,255,0.06)" }} />

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.1 }}>
                  <Chip
                    size="small"
                    color={similaritySeverity}
                    variant={similaritySeverity === "default" ? "outlined" : "filled"}
                    label={`Name Similarity ${nameSimilarity}%`}
                  />
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {canAssignMatches && bulkSelection.selectedCount > 0 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(135deg, rgba(6,8,24,0.98) 0%, rgba(20,15,40,0.98) 100%)",
            backdropFilter: "blur(20px)",
            borderTop: "2px solid rgba(212,175,55,0.2)",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            zIndex: 1200,
            boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#d4af37" }}>
              {bulkSelection.selectedCount} match{bulkSelection.selectedCount === 1 ? "" : "es"} selected
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={bulkSelection.selectAll}
              disabled={items.length === 0 || savingBulkUnmatch || savingManualMatch}
              sx={{ fontSize: "0.75rem" }}
            >
              This page ({items.length})
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={bulkSelection.clearAll}
              disabled={savingBulkUnmatch || savingManualMatch}
              color="inherit"
              sx={{ fontSize: "0.75rem" }}
            >
              Clear
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              variant="contained"
              color="warning"
              startIcon={<CompareArrowsOutlinedIcon />}
              onClick={() => setBulkUnmatchOpen(true)}
              disabled={savingBulkUnmatch || savingManualMatch}
            >
              Manual Match Selected
            </Button>
            <IconButton
              onClick={bulkSelection.clearAll}
              disabled={savingBulkUnmatch || savingManualMatch}
              sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      <Dialog
        open={bulkUnmatchOpen}
        onClose={() => {
          if (!savingBulkUnmatch) {
            setBulkUnmatchOpen(false);
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirm bulk manual match</DialogTitle>
        <DialogContent>
          <Stack spacing={1.2} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              This action will remove {bulkSelection.selectedCount} automatic match{bulkSelection.selectedCount === 1 ? "" : "es"} so they can be handled on the manual matching page.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              After confirmation, selected matches will disappear from this list.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkUnmatchOpen(false)} disabled={savingBulkUnmatch}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmBulkUnmatch}
            disabled={bulkSelection.selectedCount === 0 || savingBulkUnmatch}
          >
            {savingBulkUnmatch ? "Sending..." : "Yes, send selected"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(manualMatchTarget)}
        onClose={() => {
          if (!savingManualMatch) {
            setManualMatchTarget(null);
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirm manual match</DialogTitle>
        <DialogContent>
          {manualMatchTarget && (
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                This action will remove the current automatic match so it can be handled manually on the manual matching page.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Store Listing
                  </Typography>
                  <Box sx={{ mt: 0.5, p: 1, borderRadius: 1.5, border: "1px solid rgba(255,255,255,0.12)" }}>
                    {getSafeImage(manualMatchTarget.storeProductImageUrl) ? (
                      <Box
                        component="img"
                        src={getSafeImage(manualMatchTarget.storeProductImageUrl) ?? ""}
                        alt={manualMatchTarget.storeOriginalName}
                        sx={{ width: "100%", maxHeight: 190, objectFit: "contain", borderRadius: 1, mb: 1, bgcolor: "#0b0c16" }}
                      />
                    ) : null}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {manualMatchTarget.storeOriginalName}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Catalog Figurine
                  </Typography>
                  <Box sx={{ mt: 0.5, p: 1, borderRadius: 1.5, border: "1px solid rgba(255,255,255,0.12)" }}>
                    {getSafeImage(manualMatchTarget.figurineOfficialImageUrl) ? (
                      <Box
                        component="img"
                        src={getSafeImage(manualMatchTarget.figurineOfficialImageUrl) ?? ""}
                        alt={manualMatchTarget.figurineDisplayableName}
                        sx={{ width: "100%", maxHeight: 190, objectFit: "contain", borderRadius: 1, mb: 1, bgcolor: "#0b0c16" }}
                      />
                    ) : null}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {manualMatchTarget.figurineDisplayableName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getLineupLabel(manualMatchTarget.figurineLineUp)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              <Divider />

              <Typography variant="caption" color="text.secondary">
                After confirmation, this match will disappear from the list.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualMatchTarget(null)} disabled={savingManualMatch}>
            Cancel
          </Button>
          <Button variant="contained" color="warning" onClick={handleConfirmManualMatch} disabled={savingManualMatch}>
            Yes, send to manual matching
          </Button>
        </DialogActions>
      </Dialog>

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
