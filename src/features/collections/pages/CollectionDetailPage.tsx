import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import EditIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AddIcon from "@mui/icons-material/Add";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import {
  addFigurineToCollection,
  getCollectionFigurines,
  getCollectionFigurine,
  removeFigurineFromCollection,
} from "../api/collectionApi";
import type { Collection, CollectionFigurine } from "../types/collection";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import PurchaseFormDialog from "../../purchases/components/PurchaseFormDialog";
import {
  createPurchaseSummaryLineItems,
  getPurchaseSummaryLineItems,
  getPurchaseSummaryLineItemsById,
  toPurchaseRecordFromSummaryResponse,
  updatePurchaseSummaryLineItems,
} from "../../purchases/api/purchaseApi";
import {
  emptyPurchaseDraft,
  emptyPurchaseLine,
  type PurchaseDraft,
  type PurchaseRecord,
  type PurchaseRecordInput,
} from "../../purchases/types/purchase";

type AlbumFigurine = CollectionFigurine & {
  purchasePrice?: number;
  purchaseCurrency?: string;
  trackingCode?: string;
};

const BASE_ALBUM_TARGET = 24;
const MIN_ALBUM_ZOOM = 0.8;
const MAX_ALBUM_ZOOM = 2;
const ALBUM_ZOOM_STEP = 0.1;
const TIMELINE_HEIGHT = 400;

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

type FigurineBackDetail = {
  displayableName: string;
  priceWithTax?: number;
  currency?: string;
  releaseDateLabel?: string;
  tamashiiUrl?: string;
  lineUpUrl?: string;
};

const RELEASE_STATUS_COLORS: Record<CollectionFigurine["releaseStatus"], string> = {
  RELEASED: "#43a047",
  ANNOUNCED: "#fbc02d",
  RUMORED: "#42a5f5",
  PROTOTYPE: "#7e57c2",
  UNRELEASED: "#9e9e9e",
};

const getNearestScrollContainer = (element: HTMLElement | null): HTMLElement | null => {
  if (!element) return null;

  let current: HTMLElement | null = element.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const isScrollable =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      current.scrollHeight > current.clientHeight;

    if (isScrollable) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
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
  const [figurineBackDetails, setFigurineBackDetails] = useState<Record<number, FigurineBackDetail>>({});
  const [figurineBackNameLoadingId, setFigurineBackNameLoadingId] = useState<number | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [showRecentPurchasesSummary, setShowRecentPurchasesSummary] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [purchaseInitialDraft, setPurchaseInitialDraft] = useState<PurchaseDraft | null>(null);
  const [pendingDeleteFigurineId, setPendingDeleteFigurineId] = useState<number | null>(null);
  const [isDeletingFigurine, setIsDeletingFigurine] = useState(false);
  const [addingFigurineId, setAddingFigurineId] = useState<number | null>(null);
  const [recentlyAddedFigurineId, setRecentlyAddedFigurineId] = useState<number | null>(null);
  const [animatedProgressPercent, setAnimatedProgressPercent] = useState(0);
  const albumGridSectionRef = useRef<HTMLDivElement | null>(null);

  const toFigurineNameById = (items: AlbumFigurine[]): Record<number, string> =>
    Object.fromEntries(items.map((item) => [item.id, item.displayableName]));

  const loadBackendPurchasesForCollection = async (
    items: AlbumFigurine[]
  ): Promise<PurchaseRecord[]> => {
    const responses = await getPurchaseSummaryLineItems();
    const figurineIdsInCollection = new Set(items.map((item) => item.id));
    const figurineNameById = toFigurineNameById(items);

    return responses
      .filter((purchase) =>
        purchase.lineItems.some((lineItem) => figurineIdsInCollection.has(lineItem.figurineId))
      )
      .map((purchase) => toPurchaseRecordFromSummaryResponse(purchase, figurineNameById));
  };

  useEffect(() => {
    loadCollection();
  }, [id]);

  useEffect(() => {
    if (loading) return;

    const updateScrollMetrics = () => {
      const gridSection = albumGridSectionRef.current;
      if (!gridSection) return;

      const scrollContainer = getNearestScrollContainer(gridSection);

      if (scrollContainer) {
        const maxScrollable = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        if (maxScrollable <= 0) {
          setScrollProgress(0);
        } else {
          const ratio = Math.min(1, Math.max(0, scrollContainer.scrollTop / maxScrollable));
          setScrollProgress(ratio);
        }
      } else {
        const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScrollable <= 0) {
          setScrollProgress(0);
        } else {
          const ratio = Math.min(1, Math.max(0, window.scrollY / maxScrollable));
          setScrollProgress(ratio);
        }
      }

      const rect = gridSection.getBoundingClientRect();
      const viewportHeight = scrollContainer?.clientHeight ?? window.innerHeight;
      const viewportTop = scrollContainer?.getBoundingClientRect().top ?? 0;
      const relativeTop = rect.top - viewportTop;
      const totalTravel = rect.height + viewportHeight;
      const passed = viewportHeight - relativeTop;
      const ratioInSection = Math.min(1, Math.max(0, passed / Math.max(1, totalTravel)));
      setTimelineProgress(ratioInSection);
    };

    const initialGridSection = albumGridSectionRef.current;
    const scrollContainer = getNearestScrollContainer(initialGridSection);

    window.addEventListener("scroll", updateScrollMetrics, { passive: true });
    scrollContainer?.addEventListener("scroll", updateScrollMetrics, { passive: true });
    window.addEventListener("resize", updateScrollMetrics);

    updateScrollMetrics();

    return () => {
      window.removeEventListener("scroll", updateScrollMetrics);
      scrollContainer?.removeEventListener("scroll", updateScrollMetrics);
      window.removeEventListener("resize", updateScrollMetrics);
    };
  }, [loading]);

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
      setFigurineBackDetails({});
      setFigurineBackNameLoadingId(null);

      const collectionFigurines = await getCollectionFigurines(data.id);
      const normalizedFigurines = collectionFigurines.map((figurine) => ({
        ...figurine,
        purchasePrice: undefined,
        purchaseCurrency: undefined,
        trackingCode: undefined,
      }));

      setFigurines(normalizedFigurines);

      const backendPurchases = await loadBackendPurchasesForCollection(normalizedFigurines);
      setPurchases(backendPurchases);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "collection" }));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteFigurineDialog = (figurineId: number) => {
    setPendingDeleteFigurineId(figurineId);
  };

  const formatReleaseDateLabel = (releaseDate?: string, releaseDateConfirmed?: boolean): string | undefined => {
    if (!releaseDate?.trim()) return undefined;

    const parsedDate = new Date(`${releaseDate}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return releaseDateConfirmed ? releaseDate : releaseDate.slice(0, 7);
    }

    return parsedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      ...(releaseDateConfirmed ? { day: "2-digit" } : {}),
    });
  };

  const formatPriceWithTax = (amount: number, currency?: string): string => {
    const normalizedCurrency = currency?.trim().toUpperCase();

    if (normalizedCurrency) {
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: normalizedCurrency,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `${amount.toFixed(2)} ${normalizedCurrency}`;
      }
    }

    return amount.toFixed(2);
  };

  const getReleaseStatusLabel = (status: CollectionFigurine["releaseStatus"]): string =>
    status.replaceAll("_", " ");

  const handleCloseDeleteFigurineDialog = () => {
    if (isDeletingFigurine) return;

    setPendingDeleteFigurineId(null);
  };

  const handleConfirmDeleteFigurine = async () => {
    if (!collection || pendingDeleteFigurineId === null) return;

    setIsDeletingFigurine(true);

    try {
      await removeFigurineFromCollection(collection.id, pendingDeleteFigurineId);
      await loadCollection();
      setSuccessMessage("Figurine removed from collection.");
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(err, { action: "delete", resource: "figurine from collection" })
      );
    } finally {
      setIsDeletingFigurine(false);
      setPendingDeleteFigurineId(null);
    }
  };

  const handleAddFigurine = async (figurineId: number) => {
    if (!collection) return;

    setAddingFigurineId(figurineId);
    try {
      await addFigurineToCollection(collection.id, figurineId);
      await loadCollection();
      setRecentlyAddedFigurineId(figurineId);
      setSuccessMessage("Figurine added to collection.");
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(err, { action: "update", resource: "figurine to collection" })
      );
    } finally {
      setAddingFigurineId((current) => (current === figurineId ? null : current));
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
  const timelineIndicatorTop = Math.max(
    24,
    Math.min(TIMELINE_HEIGHT - 24, 12 + timelineProgress * (TIMELINE_HEIGHT - 40))
  );

  const handleZoomOut = () => {
    setAlbumZoom((current) => Math.max(MIN_ALBUM_ZOOM, Number((current - ALBUM_ZOOM_STEP).toFixed(2))));
  };

  const handleZoomIn = () => {
    setAlbumZoom((current) => Math.min(MAX_ALBUM_ZOOM, Number((current + ALBUM_ZOOM_STEP).toFixed(2))));
  };

  const handleResetZoom = () => {
    setAlbumZoom(1);
  };

  useEffect(() => {
    setAnimatedProgressPercent(0);

    const frameId = window.requestAnimationFrame(() => {
      setAnimatedProgressPercent(progressPercent);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [progressPercent, collection?.id]);

  useEffect(() => {
    if (recentlyAddedFigurineId === null) return;

    const timeoutId = window.setTimeout(() => {
      setRecentlyAddedFigurineId((current) => (current === recentlyAddedFigurineId ? null : current));
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [recentlyAddedFigurineId]);

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
    if (figurineBackDetails[flippedFigurineId]) return;

    let isActive = true;
    setFigurineBackNameLoadingId(flippedFigurineId);

    getCollectionFigurine(collection.id, flippedFigurineId)
      .then((response) => {
        if (!isActive) return;

        const nextDisplayableName = response.displayableName?.trim() || figurine.displayableName;
        const primaryDistributor = response.distributors?.[0];
        const releaseDateLabel = formatReleaseDateLabel(
          primaryDistributor?.releaseDate,
          primaryDistributor?.releaseDateConfirmed
        );

        setFigurineBackDetails((current) => ({
          ...current,
          [flippedFigurineId]: {
            displayableName: nextDisplayableName,
            priceWithTax:
              typeof primaryDistributor?.priceWithTax === "number"
                ? primaryDistributor.priceWithTax
                : undefined,
            currency: primaryDistributor?.currency?.trim() || undefined,
            releaseDateLabel,
            tamashiiUrl: response.tamashiiUrl?.trim() || undefined,
            lineUpUrl: response.lineUpUrl?.trim() || undefined,
          },
        }));
      })
      .catch(() => {
        if (!isActive) return;

        setFigurineBackDetails((current) => ({
          ...current,
          [flippedFigurineId]: {
            displayableName: figurine.displayableName,
          },
        }));
      })
      .finally(() => {
        if (!isActive) return;

        setFigurineBackNameLoadingId((current) => (current === flippedFigurineId ? null : current));
      });

    return () => {
      isActive = false;
    };
  }, [collection, flippedFigurineId, figurines, figurineBackDetails]);

  const handleSavePurchase = async (input: PurchaseRecordInput) => {
    if (!collection) return;

    const currentEditingPurchase = editingPurchase;

    if (!editingPurchaseId) {
      await createPurchaseSummaryLineItems(input);
    } else {
      const existingBackendPurchaseId = currentEditingPurchase?.purchaseId ?? Number(editingPurchaseId);

      if (!Number.isFinite(existingBackendPurchaseId) || existingBackendPurchaseId <= 0) {
        throw new Error("Unable to identify purchase id for update.");
      }

      await updatePurchaseSummaryLineItems(existingBackendPurchaseId, input);
    }

    try {
      const refreshedPurchases = await loadBackendPurchasesForCollection(figurines);
      setPurchases(refreshedPurchases);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "purchases" }));
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(editingPurchaseId ? "Purchase updated successfully." : "Purchase recorded successfully.");
    setEditingPurchaseId(null);
    setPurchaseInitialDraft(null);
    setPurchaseDialogOpen(false);
  };

  const handleOpenCreatePurchaseDialog = () => {
    setEditingPurchaseId(null);
    setPurchaseInitialDraft(null);
    setPurchaseDialogOpen(true);
  };

  const handleOpenEditPurchaseDialog = async (purchase: PurchaseRecord) => {
    const backendPurchaseId = purchase.purchaseId ?? Number(purchase.id);

    if (!Number.isFinite(backendPurchaseId) || backendPurchaseId <= 0) {
      setEditingPurchaseId(purchase.id);
      setPurchaseInitialDraft(null);
      setPurchaseDialogOpen(true);
      return;
    }

    try {
      const response = await getPurchaseSummaryLineItemsById(backendPurchaseId);
      const figurineNameById = toFigurineNameById(figurines);
      const refreshedPurchase = toPurchaseRecordFromSummaryResponse(response, figurineNameById);

      setPurchases((current) =>
        current.map((item) => (item.id === purchase.id ? refreshedPurchase : item))
      );
      setEditingPurchaseId(refreshedPurchase.id);
      setPurchaseInitialDraft(null);
      setPurchaseDialogOpen(true);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "purchase" }));
    }
  };

  const handleOpenCreatePurchaseForFigurine = (figurine: AlbumFigurine) => {
    const draft = emptyPurchaseDraft();
    draft.lines = [
      {
        ...emptyPurchaseLine(),
        figurineId: String(figurine.id),
      },
    ];

    setEditingPurchaseId(null);
    setPurchaseInitialDraft(draft);
    setPurchaseDialogOpen(true);
  };

  const handleOpenEditPurchaseForFigurine = (figurine: AlbumFigurine) => {
    const relatedPurchase = purchases.find((purchase) =>
      purchase.lines.some((line) => line.figurineId === figurine.id)
    );

    if (!relatedPurchase) {
      setSuccessMessage("No purchase record found for this figurine yet.");
      return;
    }

    setPurchaseInitialDraft(null);
    void handleOpenEditPurchaseDialog(relatedPurchase);
  };

  const handleClosePurchaseDialog = () => {
    setPurchaseDialogOpen(false);
    setEditingPurchaseId(null);
    setPurchaseInitialDraft(null);
  };

  const editingPurchase = purchases.find((purchase) => purchase.id === editingPurchaseId) ?? null;

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
        padding: { xs: 1.5, sm: 2, md: 3 },
        background: `linear-gradient(165deg,
          ${alpha(theme.palette.background.default, 0.94)} 0%,
          ${alpha(theme.palette.primary.main, Math.min(0.32, 0.14 + scrollProgress * 0.18))} 42%,
          ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
       
        minHeight: "calc(100vh - 96px)",
      }}
    >
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
          animation: "detailHeaderReveal 420ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
          "@keyframes detailHeaderReveal": {
            "0%": { opacity: 0, transform: "translateY(-10px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 1.5,
          }}
        >
          <Tooltip title="Back to Collections">
            <IconButton onClick={() => navigate("/collections")} sx={{ mt: 0.5 }}>
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
              You are in collection {collection.name}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              {collection.description?.trim() ||
                "Browse this collection to track progress, review figurines, and manage purchases."}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: 1.5,
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "1fr", lg: "1fr auto" },
            alignItems: "center",
            animation: "detailStatsReveal 560ms cubic-bezier(0.2, 0.9, 0.2, 1) 90ms both",
            "@keyframes detailStatsReveal": {
              "0%": { opacity: 0, transform: "translateY(14px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Box>
            <Box
              sx={{
                px: 1,
                py: 0.8,
                borderRadius: 1.4,
                bgcolor: alpha(theme.palette.background.default, 0.24),
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
                value={animatedProgressPercent}
                sx={{
                  height: 10,
                  borderRadius: 99,
                  bgcolor: alpha(theme.palette.common.white, 0.18),
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 99,
                    background: `linear-gradient(90deg, ${ownedColor} 0%, ${accentColor} 100%)`,
                    transition: "transform 900ms cubic-bezier(0.2, 0.9, 0.2, 1)",
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
                      bgcolor: alpha(theme.palette.info.main, 0.22),
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
                bgcolor: alpha(theme.palette.background.default, 0.3),
                borderRadius: 1.2,
                border: `1px solid ${alpha(theme.palette.divider, 0.18)}`,
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
                  boxShadow: "none",
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
                borderRadius: 1.2,
                border: `1px solid ${alpha(theme.palette.divider, 0.18)}`,
                bgcolor: alpha(theme.palette.background.default, 0.3),
              }}
            >
              <Tooltip title="Zoom out">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleZoomOut}
                    disabled={albumZoom <= MIN_ALBUM_ZOOM}
                    sx={{ bgcolor: alpha(theme.palette.background.paper, 0.2) }}
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
                variant="text"
                onClick={handleResetZoom}
                disabled={albumZoom === 1}
                sx={{
                  minWidth: 52,
                  px: 1,
                  whiteSpace: "nowrap",
                  bgcolor: alpha(theme.palette.background.paper, 0.22),
                }}
              >
                Reset
              </Button>
              <Tooltip title="Zoom in">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleZoomIn}
                    disabled={albumZoom >= MAX_ALBUM_ZOOM}
                    sx={{ bgcolor: alpha(theme.palette.background.paper, 0.2) }}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
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

      <Dialog
        open={pendingDeleteFigurineId !== null}
        onClose={(_, reason) => {
          if (isDeletingFigurine && (reason === "backdropClick" || reason === "escapeKeyDown")) {
            return;
          }

          handleCloseDeleteFigurineDialog();
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove figurine</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Are you sure you want to remove this figurine from the collection? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteFigurineDialog} disabled={isDeletingFigurine}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirmDeleteFigurine()}
            color="error"
            variant="contained"
            disabled={isDeletingFigurine}
          >
            {isDeletingFigurine ? <CircularProgress size={20} color="inherit" /> : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>

      <PurchaseFormDialog
        open={purchaseDialogOpen}
        title={editingPurchase ? "Edit Purchase" : "Record Purchase"}
        submitLabel={editingPurchase ? "Update Purchase" : "Save Purchase"}
        initialPurchase={editingPurchase}
        initialDraft={purchaseInitialDraft}
        onClose={handleClosePurchaseDialog}
        onSubmit={handleSavePurchase}
        figurines={figurines}
      />

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

      <Box sx={{ mb: 2.2 }}>
        <Card
          sx={{
            p: 1.6,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.64),
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.2}>
            <Box>
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.4 }}>
                <ReceiptLongOutlinedIcon fontSize="small" sx={{ color: "primary.main" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Most Recent Purchases
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Figurine purchases are tracked separately from the current collection quantities.
              </Typography>
            </Box>
            <Box>
              <Stack direction="row" spacing={0.8}>
                <Button
                  variant="text"
                  onClick={() => setShowRecentPurchasesSummary((current) => !current)}
                >
                  {showRecentPurchasesSummary ? "Hide Summary" : "Show Summary"}
                </Button>
                <Button
                  variant="text"
                  onClick={() => navigate(`/purchases?collectionId=${collection.id}`)}
                >
                  Open Purchases
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreatePurchaseDialog}
                  sx={{ flexShrink: 0 }}
                >
                  Record Purchase
                </Button>
              </Stack>
            </Box>
          </Stack>

          <Collapse in={showRecentPurchasesSummary}>
            <Stack spacing={1} sx={{ mt: 1.3 }}>
              {purchases.length === 0 ? (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  No purchase records yet.
                </Typography>
              ) : (
                <>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Box
                      sx={{
                        px: 1.1,
                        py: 0.9,
                        borderRadius: 1.2,
                        bgcolor: alpha(theme.palette.background.default, 0.34),
                        minWidth: 140,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Total purchases
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {purchases.length}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1.1,
                        py: 0.9,
                        borderRadius: 1.2,
                        bgcolor: alpha(theme.palette.background.default, 0.34),
                        minWidth: 180,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Latest order date
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {purchases[0]?.orderDate ?? "N/A"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1.1,
                        py: 0.9,
                        borderRadius: 1.2,
                        bgcolor: alpha(theme.palette.background.default, 0.34),
                        flex: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Recent purchases
                      </Typography>
                      <Stack spacing={0.55} sx={{ mt: 0.45 }}>
                        {purchases.slice(0, 3).map((purchase) => (
                          <Box
                            key={purchase.id}
                            sx={{
                              px: 0.8,
                              py: 0.55,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.background.default, 0.46),
                            }}
                          >
                            <Typography variant="caption" sx={{ display: "block", color: "text.primary", fontWeight: 700 }}>
                              {purchase.store?.trim() ? purchase.store : "Store not specified"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              Date: {purchase.orderDate?.trim() ? purchase.orderDate : "No order date"} · {purchase.totalAmount} {purchase.currency}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Access Purchases to review and manage your complete purchase history.
                  </Typography>
                </>
              )}
            </Stack>
          </Collapse>
        </Card>
      </Box>

      <Box
        ref={albumGridSectionRef}
        sx={{
          p: { xs: 2.4, md: 3 },
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
          background:
            `radial-gradient(120% 180% at 30% 0%, ${alpha(theme.palette.info.main, 0.12)} 0%, ${alpha(theme.palette.background.paper, 0.74)} 45%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
          animation: "albumSectionReveal 520ms cubic-bezier(0.2, 0.9, 0.2, 1) 140ms both",
          "@keyframes albumSectionReveal": {
            "0%": { opacity: 0, transform: "translateY(16px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
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
            const backDetail = slot.figurine ? figurineBackDetails[slot.figurine.id] : undefined;
            const backDisplayName = backDetail?.displayableName;
            const isBackDisplayNameLoading = slot.figurine?.id === figurineBackNameLoadingId;
            const imageUrl = slot.figurine?.officialImageUrls?.[0] ?? null;
            const noteText = slot.figurine?.notes?.trim() ?? "";
            const duplicateCount = slot.owned && slot.figurine ? Math.max(1, slot.figurine.ownedQuantity) : 0;
            const stackLayers = Math.min(Math.max(duplicateCount - 1, 0), 4);
            const isAnnounced = slot.figurine?.releaseStatus === "ANNOUNCED";
            const hasPurchaseForFigurine = slot.figurine
              ? purchases.some((purchase) => purchase.lines.some((line) => line.figurineId === slot.figurine!.id))
              : false;
            const showBackActionLabels = rowSpan >= 2 && pattern.colSpan >= 2 && albumZoom >= 1;
            const isRecentlyAdded = Boolean(
              slot.figurine && slot.owned && slot.figurine.id === recentlyAddedFigurineId
            );

            return (
              <Box
                key={slot.key}
                sx={{
                  gridColumn: { xs: "span 1", sm: `span ${Math.min(pattern.colSpan, 2)}`, md: `span ${pattern.colSpan}` },
                  gridRow: `span ${rowSpan}`,
                  perspective: "1200px",
                  opacity: 0,
                  animation: `albumCardReveal 620ms cubic-bezier(0.2, 0.9, 0.2, 1) ${Math.min(index * 35, 420)}ms forwards`,
                  "@keyframes albumCardReveal": {
                    "0%": { opacity: 0, transform: "translateY(18px) scale(0.98)" },
                    "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
                  },
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
                        ? `1px solid ${alpha("#d4af37", 0.95)}`
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
                      animation: isRecentlyAdded ? "newlyCollectedPulse 820ms ease-out 2" : undefined,
                      "@keyframes newlyCollectedPulse": {
                        "0%": {
                          transform: `scale(1) rotate(${pattern.tilt}deg)`,
                          boxShadow: "0 8px 26px rgba(0,0,0,0.34)",
                        },
                        "50%": {
                          transform: `translateY(-2px) scale(1.02) rotate(${pattern.tilt}deg)`,
                          boxShadow: `0 0 0 2px ${alpha(theme.palette.success.light, 0.42)}, 0 12px 30px ${alpha(theme.palette.success.main, 0.3)}`,
                        },
                        "100%": {
                          transform: `scale(1) rotate(${pattern.tilt}deg)`,
                          boxShadow: "0 8px 26px rgba(0,0,0,0.34)",
                        },
                      },
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

                    {slot.figurine && !slot.owned && (
                      <Tooltip title="Add this figurine to this collection">
                        <span>
                          <IconButton
                            size="small"
                            disabled={addingFigurineId === slot.figurine.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleAddFigurine(slot.figurine!.id);
                            }}
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              width: 24,
                              height: 24,
                              color: theme.palette.success.light,
                              bgcolor: alpha(theme.palette.background.default, 0.56),
                              border: `1px solid ${alpha(theme.palette.success.main, 0.42)}`,
                              "&:hover": {
                                bgcolor: alpha(theme.palette.background.default, 0.72),
                              },
                            }}
                          >
                            {addingFigurineId === slot.figurine.id ? (
                              <CircularProgress size={14} sx={{ color: theme.palette.success.light }} />
                            ) : (
                              <FavoriteBorderOutlinedIcon sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
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
                        border: `1px solid ${alpha("#d4af37", 0.95)}`,
                        background: backDetail?.lineUpUrl
                          ? `linear-gradient(155deg, rgba(18, 26, 38, 0.88) 0%, rgba(12, 18, 28, 0.9) 100%), url(${backDetail.lineUpUrl}) center / contain no-repeat`
                          : isAnnounced
                            ? `linear-gradient(155deg, ${alpha(theme.palette.secondary.dark, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`
                            : `linear-gradient(155deg, rgba(88,98,114,0.98) 0%, rgba(70,79,95,0.98) 52%, rgba(53,60,73,0.98) 100%)`,
                        p: { xs: 0.9, md: 1.2 },
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.55,
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

                      <Box
                        sx={{
                          position: "relative",
                          zIndex: 1,
                          flex: 1,
                          minHeight: 0,
                          overflowY: "auto",
                          pr: 0.2,
                          "&::-webkit-scrollbar": {
                            width: 4,
                          },
                          "&::-webkit-scrollbar-thumb": {
                            backgroundColor: "rgba(209,221,242,0.32)",
                            borderRadius: 99,
                          },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isAnnounced ? theme.palette.secondary.light : "rgba(228,236,248,0.92)",
                              fontWeight: 900,
                              letterSpacing: "0.06rem",
                              textTransform: "uppercase",
                              pr: 1.6,
                              lineHeight: 1.15,
                              display: "-webkit-box",
                              overflow: "hidden",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                              {isBackDisplayNameLoading ? "Loading sticker name..." : backDisplayName ?? slot.figurine.displayableName}
                          </Typography>
                        </Stack>

                        {isAnnounced && (
                          <Typography
                            variant="caption"
                            sx={{
                              mb: 0.8,
                              display: "block",
                              p: 0.6,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.background.paper, 0.35),
                              color: alpha(theme.palette.secondary.light, 0.95),
                              border: `1px solid ${alpha(theme.palette.secondary.main, 0.36)}`,
                              lineHeight: 1.25,
                            }}
                          >
                            Not part of collection yet: awaiting official release.
                          </Typography>
                        )}

                        <Box
                          sx={{
                            borderTop: "1px dashed rgba(179,196,220,0.34)",
                            mb: 0.7,
                          }}
                        />
                        <Typography variant="caption" sx={{ display: "block", color: "rgba(220,231,246,0.9)", fontWeight: 700 }}>
                          ID: #{slot.figurine.id}
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", color: "rgba(220,231,246,0.9)", fontWeight: 700 }}>
                          Name: {slot.figurine.name}
                        </Typography>
                        {typeof backDetail?.priceWithTax === "number" && (
                          <Typography variant="caption" sx={{ display: "block", color: "rgba(220,231,246,0.9)", fontWeight: 700 }}>
                            Price w/ Tax: {formatPriceWithTax(backDetail.priceWithTax, backDetail.currency)}
                          </Typography>
                        )}
                        {backDetail?.releaseDateLabel && (
                          <Typography variant="caption" sx={{ display: "block", color: "rgba(220,231,246,0.9)", fontWeight: 700 }}>
                            Release Date: {backDetail.releaseDateLabel}
                          </Typography>
                        )}
                        {backDetail?.tamashiiUrl && (
                          <Tooltip title="Open Tamashii page">
                            <IconButton
                              component="a"
                              href={backDetail.tamashiiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              size="small"
                              sx={{
                                mt: 0.2,
                                p: 0.3,
                                color: theme.palette.info.light,
                                border: `1px solid ${alpha(theme.palette.info.light, 0.4)}`,
                                bgcolor: alpha(theme.palette.background.default, 0.2),
                                width: 22,
                                height: 22,
                              }}
                            >
                              <OpenInNewIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title={getReleaseStatusLabel(slot.figurine.releaseStatus)}>
                          <Box
                            sx={{
                              mt: 0.8,
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              bgcolor: RELEASE_STATUS_COLORS[slot.figurine.releaseStatus],
                              border: `1px solid ${alpha(theme.palette.common.white, 0.6)}`,
                              boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
                            }}
                          />
                        </Tooltip>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={0.25}
                        sx={{
                          position: "relative",
                          zIndex: 1,
                          mt: "auto",
                          pt: 0.45,
                          borderTop: "1px solid rgba(179,196,220,0.28)",
                          justifyContent: "space-between",
                        }}
                      >
                        <Stack alignItems="center" sx={{ minWidth: 40 }}>
                          <Tooltip title="View figurine details">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/figurines/${slot.figurine!.id}`);
                              }}
                              sx={{ color: "rgba(235,243,255,0.95)" }}
                            >
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {showBackActionLabels && (
                            <Typography variant="caption" sx={{ color: "rgba(220,231,246,0.9)", fontSize: "0.6rem", lineHeight: 1 }}>
                              View
                            </Typography>
                          )}
                        </Stack>
                        <Stack alignItems="center" sx={{ minWidth: 40 }}>
                          <Tooltip title={hasPurchaseForFigurine ? "Edit purchase with this figurine" : "No purchase record yet"}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={!hasPurchaseForFigurine}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditPurchaseForFigurine(slot.figurine!);
                                }}
                                sx={{ color: "rgba(235,243,255,0.95)" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {showBackActionLabels && (
                            <Typography variant="caption" sx={{ color: "rgba(220,231,246,0.9)", fontSize: "0.6rem", lineHeight: 1 }}>
                              Edit
                            </Typography>
                          )}
                        </Stack>
                        <Stack alignItems="center" sx={{ minWidth: 40 }}>
                          <Tooltip title="Create purchase for this figurine">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreatePurchaseForFigurine(slot.figurine!);
                              }}
                              sx={{ color: "rgba(235,243,255,0.95)" }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {showBackActionLabels && (
                            <Typography variant="caption" sx={{ color: "rgba(220,231,246,0.9)", fontSize: "0.6rem", lineHeight: 1 }}>
                              New
                            </Typography>
                          )}
                        </Stack>
                        <Stack alignItems="center" sx={{ minWidth: 40 }}>
                          <Tooltip title="Remove from collection">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteFigurineDialog(slot.figurine!.id);
                              }}
                              sx={{ color: "rgba(144,52,43,0.92)" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {showBackActionLabels && (
                            <Typography variant="caption" sx={{ color: "rgba(220,231,246,0.9)", fontSize: "0.6rem", lineHeight: 1 }}>
                              Remove
                            </Typography>
                          )}
                        </Stack>
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
            width: 92,
            position: "sticky",
            top: { lg: `calc(100vh - ${TIMELINE_HEIGHT + 20}px)` },
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
                  top: `${timelineIndicatorTop}px`,
                  transform: "translate(-50%, -50%)",
                  bgcolor: "rgba(79,195,247,0.92)",
                  color: "#07101f",
                  fontWeight: 800,
                  border: "1px solid rgba(255,255,255,0.45)",
                  zIndex: 2,
                  transition: "top 120ms linear",
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
