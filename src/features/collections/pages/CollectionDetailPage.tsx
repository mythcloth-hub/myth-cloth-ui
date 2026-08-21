import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  Pagination,
  Snackbar,
  Stack,
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
  getCollectionSummary,
  getCollectionFigurinesPaginated,
  getCollectionFigurine,
  removeFigurineFromCollection,
} from "../api/collectionApi";
import type { Collection, CollectionFigurine, CollectionSummaryResponse } from "../types/collection";
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
import AppPageHeader from "../../../components/AppPageHeader";
import { useAuth } from "../../../auth/AuthContext";

type AlbumFigurine = CollectionFigurine & {
  purchasePrice?: number;
  purchaseCurrency?: string;
  trackingCode?: string;
};

const MIN_ALBUM_ZOOM = 0.8;
const MAX_ALBUM_ZOOM = 2;
const ALBUM_ZOOM_STEP = 0.1;
const COLLECTION_FIGURINES_PAGE_SIZE = 40;

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
  const { hasPermission } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCollection = (location.state as { collection?: Collection } | null)?.collection ?? null;
  const parsedPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const pageIndex = Math.max(page - 1, 0);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [collectionSummary, setCollectionSummary] = useState<CollectionSummaryResponse | null>(null);
  const [figurines, setFigurines] = useState<AlbumFigurine[]>([]);
  const [pageInfo, setPageInfo] = useState({
    size: COLLECTION_FIGURINES_PAGE_SIZE,
    number: 0,
    totalElements: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [flippedFigurineId, setFlippedFigurineId] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [albumZoom, setAlbumZoom] = useState(1);
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
  const pendingRestoreScrollTopRef = useRef<number | null>(null);
  const pendingRestoreUsesContainerRef = useRef(false);

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
    if (!searchParams.has("page") || !Number.isFinite(Number(searchParams.get("page"))) || Number(searchParams.get("page")) < 1) {
      setSearchParams({ page: "1" }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    loadCollection();
  }, [id, pageIndex]);

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

  const loadCollection = async (options?: { preserveScroll?: boolean }) => {
    if (!id) return;

    if (options?.preserveScroll) {
      const gridSection = albumGridSectionRef.current;
      const scrollContainer = getNearestScrollContainer(gridSection);

      if (scrollContainer) {
        pendingRestoreScrollTopRef.current = scrollContainer.scrollTop;
        pendingRestoreUsesContainerRef.current = true;
      } else {
        pendingRestoreScrollTopRef.current = window.scrollY;
        pendingRestoreUsesContainerRef.current = false;
      }
    } else {
      pendingRestoreScrollTopRef.current = null;
    }

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
      setCollectionSummary(null);
      setFlippedFigurineId(null);
      setFigurineBackDetails({});
      setFigurineBackNameLoadingId(null);

      const [summaryResult, figurinesResult] = await Promise.allSettled([
        getCollectionSummary(data.id),
        getCollectionFigurinesPaginated(data.id, {
          page: pageIndex,
          size: COLLECTION_FIGURINES_PAGE_SIZE,
        }),
      ]);

      if (summaryResult.status === "fulfilled") {
        const summary = summaryResult.value;
        setCollectionSummary(summary);
        setCollection((current) =>
          current
            ? {
                ...current,
                totalFigurines: summary.summary.totalFigurines,
              }
            : current
        );
      }

      const normalizedFigurines =
        figurinesResult.status === "fulfilled"
          ? figurinesResult.value.content.map((figurine) => ({
              ...figurine,
              purchasePrice: undefined,
              purchaseCurrency: undefined,
              trackingCode: undefined,
            }))
          : [];

      if (figurinesResult.status === "fulfilled") {
        setPageInfo(figurinesResult.value.page);
      } else {
        setPageInfo({
          size: COLLECTION_FIGURINES_PAGE_SIZE,
          number: pageIndex,
          totalElements: 0,
          totalPages: 1,
        });
      }

      setFigurines(normalizedFigurines);

      if (summaryResult.status === "rejected" && figurinesResult.status === "rejected") {
        throw summaryResult.reason ?? figurinesResult.reason;
      }

      if (normalizedFigurines.length > 0) {
        try {
          const backendPurchases = await loadBackendPurchasesForCollection(normalizedFigurines);
          setPurchases(backendPurchases);
        } catch {
          setPurchases([]);
        }
      } else {
        setPurchases([]);
      }

      if (summaryResult.status === "rejected" && figurinesResult.status === "fulfilled") {
        setErrorMessage("Collection summary is temporarily unavailable. Showing fallback values from figurines.");
      }
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "collection" }));
    } finally {
      setLoading(false);

      const top = pendingRestoreScrollTopRef.current;
      if (top !== null) {
        window.requestAnimationFrame(() => {
          const gridSection = albumGridSectionRef.current;
          const scrollContainer = getNearestScrollContainer(gridSection);

          if (pendingRestoreUsesContainerRef.current && scrollContainer) {
            scrollContainer.scrollTo({ top, behavior: "auto" });
          } else {
            window.scrollTo({ top, behavior: "auto" });
          }

          pendingRestoreScrollTopRef.current = null;
        });
      }
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

  const handleCloseDeleteFigurineDialog = () => {
    if (isDeletingFigurine) return;

    setPendingDeleteFigurineId(null);
  };

  const handleConfirmDeleteFigurine = async () => {
    if (!collection || pendingDeleteFigurineId === null) return;

    setIsDeletingFigurine(true);

    try {
      await removeFigurineFromCollection(collection.id, pendingDeleteFigurineId);
      await loadCollection({ preserveScroll: true });
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
      await loadCollection({ preserveScroll: true });
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

  const handleIncreaseFigurineQuantity = async (figurineId: number) => {
    if (!collection) return;

    setAddingFigurineId(figurineId);
    try {
      await addFigurineToCollection(collection.id, figurineId);
      await loadCollection({ preserveScroll: true });
      setRecentlyAddedFigurineId(figurineId);
      setSuccessMessage("Figurine quantity increased.");
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(err, { action: "update", resource: "figurine quantity" })
      );
    } finally {
      setAddingFigurineId((current) => (current === figurineId ? null : current));
    }
  };

  const baseVisibleFigurines = figurines;
  const visibleFigurines = baseVisibleFigurines;
  const fallbackOwnedReleasedFigurines = baseVisibleFigurines.filter(
    (figurine) => figurine.releaseStatus === "RELEASED" && figurine.isCollected
  ).length;
  const fallbackMissingReleasedFigurines = baseVisibleFigurines.filter(
    (figurine) => figurine.releaseStatus === "RELEASED" && !figurine.isCollected
  ).length;
  const fallbackOwnedCopies = baseVisibleFigurines
    .filter((figurine) => figurine.isCollected)
    .reduce((total, figurine) => total + Math.max(1, figurine.ownedQuantity), 0);

  const catalogSummary = collectionSummary?.summary;
  const collectorSummary = collectionSummary?.collection;
  const totalReleased = Math.max(
    0,
    catalogSummary?.totalReleased ??
      fallbackOwnedReleasedFigurines + fallbackMissingReleasedFigurines
  );
  const totalUpcoming = Math.max(
    0,
    catalogSummary?.totalUpcoming ?? Math.max(0, baseVisibleFigurines.length - totalReleased)
  );
  const ownedReleasedFigurines = Math.max(
    0,
    collectorSummary?.ownedFigurines ?? fallbackOwnedReleasedFigurines
  );
  const missingReleasedFigurines = Math.max(
    0,
    collectorSummary?.missingReleasedFigurines ?? fallbackMissingReleasedFigurines
  );
  const ownedCopies = Math.max(0, collectorSummary?.ownedCopies ?? fallbackOwnedCopies);
  const preorderedCopies = Math.max(0, collectorSummary?.preorderedCopies ?? 0);
  const preorderedFigurines = Math.max(0, collectorSummary?.preorderedFigurines ?? 0);
  const releasedProgressRawPercent = (ownedReleasedFigurines / Math.max(1, totalReleased)) * 100;
  const releasedProgressPercent = Number(releasedProgressRawPercent.toFixed(1));
  const releasedProgressBarValue =
    releasedProgressRawPercent > 0
      ? Math.max(3, Math.min(100, releasedProgressRawPercent))
      : 0;
  const upcomingCoveragePercent = Math.round((preorderedFigurines / Math.max(1, totalUpcoming)) * 100);
  const catalogTotalFigurines = Math.max(
    baseVisibleFigurines.length,
    catalogSummary?.totalFigurines ?? collection?.totalFigurines ?? 0
  );
  const zoomPercent = Math.round(albumZoom * 100);

  const ownedColor = theme.palette.success.main;
  const missingColor = theme.palette.warning.main;
  const accentColor = theme.palette.info.main;

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
      setAnimatedProgressPercent(releasedProgressBarValue);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [releasedProgressBarValue, collection?.id]);

  useEffect(() => {
    if (recentlyAddedFigurineId === null) return;

    const timeoutId = window.setTimeout(() => {
      setRecentlyAddedFigurineId((current) => (current === recentlyAddedFigurineId ? null : current));
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [recentlyAddedFigurineId]);

  const totalPages = Math.max(pageInfo.totalPages || 1, 1);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    const next: Record<string, string> = {};
    if (value > 1) {
      next.page = String(value);
    }

    setSearchParams(next, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const albumSlots: AlbumSlot[] = useMemo(() => {
    return visibleFigurines.map((figurine) => ({
      key: `owned-${figurine.id}`,
      owned: figurine.isCollected,
      figurine,
    }));
  }, [visibleFigurines]);

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
        paddingBottom: { xs: "calc(env(safe-area-inset-bottom, 0px) + 12px)", sm: 2, md: 3 },
        background: `linear-gradient(165deg,
          ${alpha(theme.palette.background.default, 0.94)} 0%,
          ${alpha(theme.palette.primary.main, Math.min(0.32, 0.14 + scrollProgress * 0.18))} 42%,
          ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
        overflowX: "clip",
        minHeight: "calc(100vh - 96px)",
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: "env(safe-area-inset-top, 0px)",
          zIndex: 9,
          bgcolor: "background.default",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          mx: { xs: -1.5, sm: -2, md: -3 },
          px: { xs: 1.5, sm: 2, md: 3 },
          pt: { xs: 0.5, sm: 0.25 },
          pb: 1,
          mb: 2,
          borderBottom: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            mb: 1.5,
          }}
        >
          <Tooltip title="Back to Collections">
            <IconButton onClick={() => navigate("/collections")} sx={{ mt: 0.5 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AppPageHeader
              eyebrow="Collections"
              title={collection.name}
              subtitle={collection.description?.trim() || "Browse this collection to track progress, review figurines, and manage purchases."}
              compact
            />
          </Box>
        </Box>

        <Box
          sx={{
            p: 1.2,
            display: "grid",
            gap: 0.9,
            gridTemplateColumns: "1fr",
            alignItems: "stretch",
            animation: "detailStatsReveal 560ms cubic-bezier(0.2, 0.9, 0.2, 1) 90ms both",
            "@keyframes detailStatsReveal": {
              "0%": { opacity: 0, transform: "translateY(14px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Card
            sx={{
              p: { xs: 1.1, sm: 1.2 },
              borderRadius: 1.6,
              border: `1px solid ${alpha(theme.palette.info.main, 0.18)}`,
              bgcolor: alpha(theme.palette.background.default, 0.3),
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "flex-start" }}
              sx={{ mb: 0.45, gap: { xs: 0.35, sm: 0 } }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.74), fontWeight: 600 }}>
                  {ownedReleasedFigurines} of {totalReleased} released figurines collected
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" }, lineHeight: 1, fontWeight: 900, color: accentColor }}>
                  {releasedProgressPercent}%
                </Typography>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.66), fontWeight: 700 }}>
                  completion
                </Typography>
              </Box>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={animatedProgressPercent}
              sx={{
                height: 12,
                borderRadius: 99,
                bgcolor: alpha(theme.palette.common.white, 0.16),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${ownedColor} 0%, ${accentColor} 100%)`,
                  transition: "transform 900ms cubic-bezier(0.2, 0.9, 0.2, 1)",
                },
              }}
            />

            <Stack
              direction="row"
              spacing={0.65}
              useFlexGap
              flexWrap="nowrap"
              sx={{
                mt: 0.8,
                overflowX: "auto",
                overflowY: "hidden",
                pb: 0.2,
                scrollbarWidth: "thin",
                scrollbarColor: `${alpha(theme.palette.text.primary, 0.24)} transparent`,
                WebkitOverflowScrolling: "touch",
                "& .MuiChip-root": {
                  flexShrink: 0,
                },
                "&::-webkit-scrollbar": {
                  height: 6,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: alpha(theme.palette.text.primary, 0.24),
                  borderRadius: 99,
                },
              }}
            >
              <Tooltip title="Unique released figurines from the catalog that are currently in your collection.">
                <Chip
                  size="small"
                  icon={<InfoOutlinedIcon />}
                  label={`Owned released: ${ownedReleasedFigurines}`}
                  sx={{ bgcolor: alpha(ownedColor, 0.2), color: ownedColor, fontWeight: 800 }}
                />
              </Tooltip>
              <Tooltip title="Released catalog figurines that are still missing from your collection.">
                <Chip
                  size="small"
                  icon={<InfoOutlinedIcon />}
                  label={`Missing released: ${missingReleasedFigurines}`}
                  sx={{ bgcolor: alpha(missingColor, 0.2), color: missingColor, fontWeight: 800 }}
                />
              </Tooltip>
              <Tooltip title="Coverage of announced figurines: distinct upcoming figurines preordered versus all upcoming figurines in the catalog.">
                <Chip
                  size="small"
                  icon={<InfoOutlinedIcon />}
                  label={`Upcoming: ${preorderedFigurines}/${totalUpcoming} (${upcomingCoveragePercent}%)`}
                  sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.16), color: theme.palette.secondary.light, fontWeight: 800 }}
                />
              </Tooltip>
              <Tooltip title="Physical released copies currently owned, including duplicates.">
                <Chip
                  size="small"
                  icon={<InfoOutlinedIcon />}
                  label={`Owned copies: ${ownedCopies}`}
                  sx={{ bgcolor: alpha(theme.palette.info.main, 0.2), color: theme.palette.info.light, fontWeight: 800 }}
                />
              </Tooltip>
              <Tooltip title="Physical copies of upcoming figurines that are preordered, including duplicate copies.">
                <Chip
                  size="small"
                  icon={<InfoOutlinedIcon />}
                  label={`Preordered copies: ${preorderedCopies}`}
                  sx={{ bgcolor: alpha(theme.palette.warning.main, 0.2), color: theme.palette.warning.light, fontWeight: 800 }}
                />
              </Tooltip>
              <Tooltip title="Total figurines available in the full catalog, including released and upcoming entries.">
                <Chip
                  size="small"
                  icon={<InfoOutlinedIcon />}
                  label={`Catalog total: ${catalogTotalFigurines}`}
                  sx={{ bgcolor: alpha(theme.palette.common.white, 0.1), color: alpha(theme.palette.text.primary, 0.84), fontWeight: 800 }}
                />
              </Tooltip>
            </Stack>

          </Card>

          <Box
            sx={{
              gridColumn: "1 / -1",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr minmax(220px, 1fr) auto" },
              alignItems: "center",
              gap: 1,
              rowGap: { xs: 0.75, sm: 1 },
              pt: 0.2,
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
              {pageInfo.totalElements > 0
                ? `${pageInfo.totalElements.toLocaleString()} figurines · page ${page} of ${totalPages}`
                : "No figurines available for this page."}
            </Typography>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              justifyContent="space-between"
              sx={{
                display: { xs: "none", md: "flex" },
                p: 0.45,
                borderRadius: 1.2,
                border: `1px solid ${alpha(theme.palette.divider, 0.18)}`,
                bgcolor: alpha(theme.palette.background.default, 0.3),
                minWidth: 0,
                width: { xs: "100%", lg: "auto" },
                justifySelf: { xs: "stretch", lg: "center" },
                mx: { lg: "auto" },
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "thin",
                scrollbarColor: `${alpha(theme.palette.text.primary, 0.24)} transparent`,
                WebkitOverflowScrolling: "touch",
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
                  minWidth: 60,
                  bgcolor: alpha(theme.palette.common.white, 0.14),
                  color: theme.palette.text.primary,
                  fontWeight: 800,
                }}
              />

              <Button
                size="small"
                variant="text"
                onClick={handleResetZoom}
                disabled={albumZoom === 1}
                sx={{
                  minWidth: 50,
                  px: 0.8,
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

            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                size="small"
                showFirstButton
                showLastButton
                sx={{
                  justifySelf: { xs: "center", lg: "end" },
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

      {hasPermission("purchases:read") && (
        <Box sx={{ display: { xs: "none", md: "block" }, mb: 2.2 }}>
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
              <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                <Stack
                  direction="row"
                  spacing={0.8}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ "& .MuiButton-root": { whiteSpace: "nowrap" } }}
                >
                  <Button
                    variant="text"
                    onClick={() => setShowRecentPurchasesSummary((current) => !current)}
                  >
                    {showRecentPurchasesSummary ? "Hide Summary" : "Show Summary"}
                  </Button>
                  {hasPermission("purchases:read") && (
                    <Button
                      variant="text"
                      onClick={() => navigate(`/purchases?collectionId=${collection.id}`)}
                    >
                      Open Purchases
                    </Button>
                  )}
                  {hasPermission("purchases:create") && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenCreatePurchaseDialog}
                      sx={{ flexShrink: 0 }}
                    >
                      Record Purchase
                    </Button>
                  )}
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
      )}

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
            const isQuantityUpdating = Boolean(
              slot.figurine && slot.owned && slot.figurine.id === addingFigurineId
            );
            const isDarkTheme = theme.palette.mode === "dark";
            const backGradientStart = isAnnounced
              ? alpha(theme.palette.secondary.dark, isDarkTheme ? 0.78 : 0.24)
              : alpha(theme.palette.primary.dark, isDarkTheme ? 0.72 : 0.22);
            const backGradientEnd = alpha(theme.palette.background.paper, isDarkTheme ? 0.92 : 0.98);
            const backTileBackground = alpha(theme.palette.background.paper, isDarkTheme ? 0.2 : 0.68);
            const backTextPrimary = alpha(theme.palette.text.primary, isDarkTheme ? 0.95 : 0.9);
            const backTextSecondary = alpha(theme.palette.text.secondary, isDarkTheme ? 0.88 : 0.82);
            const backActionIconColor = alpha(theme.palette.text.primary, isDarkTheme ? 0.92 : 0.84);
            const backDangerActionColor = alpha(theme.palette.error.main, isDarkTheme ? 0.92 : 0.84);

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
                  onDoubleClick={
                    hasPermission("collections:figurines:add") && slot.owned && slot.figurine
                      ? (event) => {
                          event.stopPropagation();
                          void handleIncreaseFigurineQuantity(slot.figurine!.id);
                        }
                      : undefined
                  }
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.62s ease",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    cursor: isQuantityUpdating ? "progress" : slot.owned ? "pointer" : "default",
                    pointerEvents: isQuantityUpdating ? "none" : "auto",
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
                      border: isAnnounced
                        ? `2px dashed ${alpha(theme.palette.secondary.main, 0.86)}`
                        : slot.owned
                          ? `1px solid ${alpha(theme.palette.primary.main, 0.95)}`
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
                      ...(isAnnounced && {
                        boxShadow: `0 16px 40px ${alpha(theme.palette.secondary.main, 0.4)}, 0 0 0 1px ${alpha(theme.palette.secondary.light, 0.3)}, inset 0 0 0 1px ${alpha(theme.palette.secondary.light, 0.52)}`,
                      }),
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
                          filter: isAnnounced
                            ? "saturate(72%) brightness(0.88) contrast(0.92) hue-rotate(-10deg)"
                            : slot.owned
                              ? "none"
                              : "grayscale(1) brightness(0.82) contrast(0.9)",
                          transition: "filter 260ms ease, transform 260ms ease",
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

                    {isAnnounced && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          pointerEvents: "none",
                          background: `radial-gradient(120% 85% at 50% 0%, ${alpha(theme.palette.secondary.light, 0.22)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 42%, transparent 72%)`,
                          mixBlendMode: "screen",
                        }}
                      />
                    )}

                    {isQuantityUpdating && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          gap: 0.7,
                          zIndex: 5,
                          background: "rgba(8, 12, 20, 0.55)",
                          backdropFilter: "blur(1.5px)",
                        }}
                      >
                        <CircularProgress size={22} sx={{ color: theme.palette.info.light }} />
                        <Typography variant="caption" sx={{ color: "rgba(230,240,255,0.94)", fontWeight: 700 }}>
                          Updating quantity...
                        </Typography>
                      </Box>
                    )}

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

                    {slot.figurine && slot.owned && (
                      <Tooltip title="Double-click to increase quantity">
                        <Chip
                          label={isAnnounced ? "Preordered" : "Collected"}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            bgcolor: alpha(theme.palette.info.main, 0.84),
                            color: "#fff",
                            border: `1px solid ${alpha(theme.palette.info.light, 0.46)}`,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.34)",
                          }}
                        />
                      </Tooltip>
                    )}

                    {slot.figurine && !slot.owned && (
                      <Chip
                        label={isAnnounced ? "Announced" : "Missing"}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          bgcolor: isAnnounced
                            ? alpha(theme.palette.secondary.main, 0.82)
                            : alpha(theme.palette.grey[500], 0.76),
                          color: "#fff",
                          border: isAnnounced
                            ? `1px solid ${alpha(theme.palette.secondary.light, 0.5)}`
                            : `1px solid ${alpha(theme.palette.common.white, 0.34)}`,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.34)",
                        }}
                      />
                    )}

                    {hasPermission("collections:figurines:add") && slot.figurine && !slot.owned && (
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
                        borderRadius: 1.4,
                        border: `1px solid ${alpha("#d4af37", 0.95)}`,
                        background: `linear-gradient(155deg, ${backGradientStart} 0%, ${backGradientEnd} 100%)`,
                        p: { xs: 0.85, md: 1 },
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        overflow: "hidden",
                        boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.white, isDarkTheme ? 0.1 : 0.28)}, 0 9px 22px ${alpha(theme.palette.common.black, 0.28)}`,
                        "&::before": backDetail?.lineUpUrl
                          ? {
                              content: '""',
                              position: "absolute",
                              inset: 0,
                              background: `url(${backDetail.lineUpUrl}) center 56% / 58% auto no-repeat`,
                              opacity: 0.08,
                              pointerEvents: "none",
                            }
                          : undefined,
                        "&::after": {
                          content: '"MYTH CLOTH"',
                          position: "absolute",
                          top: "52%",
                          left: "50%",
                          transform: "translate(-50%, -50%) rotate(-20deg)",
                          fontSize: "0.7rem",
                          letterSpacing: "0.14rem",
                          fontWeight: 800,
                          color: alpha(theme.palette.text.primary, isDarkTheme ? 0.1 : 0.12),
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
                          background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, isDarkTheme ? 0.72 : 0.92)} 0%, ${alpha(theme.palette.primary.light, isDarkTheme ? 0.45 : 0.62)} 55%, ${alpha(theme.palette.primary.main, isDarkTheme ? 0.34 : 0.46)} 100%)`,
                          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                          borderLeft: `1px solid ${alpha(theme.palette.primary.main, isDarkTheme ? 0.35 : 0.28)}`,
                          borderBottom: `1px solid ${alpha(theme.palette.primary.main, isDarkTheme ? 0.28 : 0.22)}`,
                          boxShadow: `-2px 2px 6px ${alpha(theme.palette.common.black, 0.24)}`,
                          pointerEvents: "none",
                          zIndex: 2,
                        }}
                      />

                      <Box sx={{ position: "relative", zIndex: 1, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                        <Box
                          sx={{
                            p: 0.6,
                            borderRadius: 0.6,
                            bgcolor: alpha(theme.palette.background.default, 0.22),
                          }}
                        >
                          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.6}>
                            <Chip
                              size="small"
                              label={isAnnounced ? "Announced" : "Released"}
                              sx={{
                                height: 18,
                                fontSize: "0.62rem",
                                fontWeight: 800,
                                bgcolor: alpha(RELEASE_STATUS_COLORS[slot.figurine.releaseStatus], 0.25),
                                color: isAnnounced ? theme.palette.secondary.light : backTextPrimary,
                              }}
                            />
                            <Typography variant="caption" sx={{ color: backTextSecondary, fontWeight: 800 }}>
                              #{slot.figurine.id}
                            </Typography>
                          </Stack>

                          <Typography
                            variant="caption"
                            sx={{
                              mt: 0.5,
                              display: "-webkit-box",
                              overflow: "hidden",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              color: backTextPrimary,
                              fontWeight: 900,
                              lineHeight: 1.2,
                            }}
                          >
                            {isBackDisplayNameLoading ? "Loading sticker name..." : backDisplayName ?? slot.figurine.displayableName}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            mt: 0.55,
                            display: "grid",
                            gap: 0.45,
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          }}
                        >
                          <Box
                            sx={{
                              p: 0.45,
                              borderRadius: 0.55,
                              bgcolor: backTileBackground,
                            }}
                          >
                            <Typography variant="caption" sx={{ display: "block", color: alpha(theme.palette.text.primary, 0.64), fontWeight: 700, lineHeight: 1 }}>
                              Release
                            </Typography>
                            <Typography variant="caption" sx={{ display: "block", mt: 0.2, color: backTextPrimary, fontWeight: 800, lineHeight: 1.2 }}>
                              {backDetail?.releaseDateLabel ?? "N/A"}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              p: 0.45,
                              borderRadius: 0.55,
                              bgcolor: backTileBackground,
                            }}
                          >
                            <Typography variant="caption" sx={{ display: "block", color: alpha(theme.palette.text.primary, 0.64), fontWeight: 700, lineHeight: 1 }}>
                              Qty
                            </Typography>
                            <Typography variant="caption" sx={{ display: "block", mt: 0.2, color: backTextPrimary, fontWeight: 800, lineHeight: 1.2 }}>
                              x{Math.max(1, slot.figurine.ownedQuantity)}
                            </Typography>
                          </Box>
                        </Box>

                        {isAnnounced && (
                          <Typography
                            variant="caption"
                            sx={{
                              mt: 0.45,
                              display: "block",
                              px: 0.55,
                              py: 0.45,
                              borderRadius: 0.55,
                              bgcolor: alpha(theme.palette.background.paper, 0.28),
                              color: alpha(theme.palette.secondary.light, 0.92),
                              lineHeight: 1.2,
                            }}
                          >
                            Awaiting official release.
                          </Typography>
                        )}

                        {noteText.length > 0 && (
                          <Tooltip title={noteText} arrow placement="top-start">
                            <Typography
                              variant="caption"
                                sx={{
                                mt: 0.45,
                                color: alpha(theme.palette.text.primary, isDarkTheme ? 0.78 : 0.84),
                                lineHeight: 1.2,
                                display: "-webkit-box",
                                overflow: "hidden",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {noteText}
                            </Typography>
                          </Tooltip>
                        )}
                      </Box>

                      <Stack
                        direction="row"
                        spacing={0.35}
                        sx={{
                          position: "relative",
                          zIndex: 1,
                          mt: "auto",
                          pt: 0.5,
                          borderTop: "1px solid rgba(179,196,220,0.24)",
                          justifyContent: "space-between",
                          bgcolor: alpha(theme.palette.background.default, isDarkTheme ? 0.22 : 0.56),
                          borderRadius: 0.45,
                          px: 0.35,
                          pb: 0.2,
                          // Too many actions to fit a narrow mobile card: scroll instead of clipping them off
                          overflowX: "auto",
                          overflowY: "hidden",
                          scrollbarWidth: "thin",
                          scrollbarColor: `${alpha(theme.palette.text.primary, 0.24)} transparent`,
                          WebkitOverflowScrolling: "touch",
                          "& > *": { flexShrink: 0 },
                          "&::-webkit-scrollbar": { height: 4 },
                          "&::-webkit-scrollbar-thumb": {
                            backgroundColor: alpha(theme.palette.text.primary, 0.24),
                            borderRadius: 99,
                          },
                        }}
                      >
                        {backDetail?.tamashiiUrl && (
                          <Stack alignItems="center" sx={{ minWidth: 40 }}>
                            <Tooltip title="Open Tamashii page">
                              <IconButton
                                component="a"
                                href={backDetail.tamashiiUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                size="small"
                                sx={{ color: backActionIconColor }}
                              >
                                <OpenInNewIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            {showBackActionLabels && (
                              <Typography variant="caption" sx={{ color: backTextSecondary, fontSize: "0.6rem", lineHeight: 1 }}>
                                Link
                              </Typography>
                            )}
                          </Stack>
                        )}
                        <Stack alignItems="center" sx={{ minWidth: 40 }}>
                          <Tooltip title="View figurine details">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/figurines/${slot.figurine!.id}`);
                              }}
                              sx={{ color: backActionIconColor }}
                            >
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {showBackActionLabels && (
                            <Typography variant="caption" sx={{ color: backTextSecondary, fontSize: "0.6rem", lineHeight: 1 }}>
                              View
                            </Typography>
                          )}
                        </Stack>
                        {hasPermission("purchases:update") && (
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
                                  sx={{ color: backActionIconColor }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            {showBackActionLabels && (
                              <Typography variant="caption" sx={{ color: backTextSecondary, fontSize: "0.6rem", lineHeight: 1 }}>
                                Edit
                              </Typography>
                            )}
                          </Stack>
                        )}
                        {hasPermission("purchases:create") && (
                          <Stack alignItems="center" sx={{ minWidth: 40 }}>
                            <Tooltip title="Create purchase for this figurine">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCreatePurchaseForFigurine(slot.figurine!);
                                }}
                                sx={{ color: backActionIconColor }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {showBackActionLabels && (
                              <Typography variant="caption" sx={{ color: backTextSecondary, fontSize: "0.6rem", lineHeight: 1 }}>
                                New
                              </Typography>
                            )}
                          </Stack>
                        )}
                        {hasPermission("collections:figurines:delete") && (
                          <Stack alignItems="center" sx={{ minWidth: 40 }}>
                            <Tooltip title="Remove from collection">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteFigurineDialog(slot.figurine!.id);
                                }}
                                sx={{ color: backDangerActionColor }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {showBackActionLabels && (
                              <Typography variant="caption" sx={{ color: backTextSecondary, fontSize: "0.6rem", lineHeight: 1 }}>
                                Remove
                              </Typography>
                            )}
                          </Stack>
                        )}
                      </Stack>
                    </Card>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        </Box>
      </Box>
    </Box>
  );
}
