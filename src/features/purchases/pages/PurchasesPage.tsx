import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import { getCollections, getCollectionFigurines } from "../../collections/api/collectionApi";
import type { Collection, CollectionFigurine } from "../../collections/types/collection";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import PurchaseFormDialog from "../components/PurchaseFormDialog";
import {
  deletePurchaseSummaryLineItems,
  createPurchaseSummaryLineItems,
  getPurchaseSummaryLineItems,
  getPurchaseSummaryLineItemsById,
  syncPurchaseTotal,
  toPurchaseRecordFromSummaryResponse,
  updatePurchaseSummaryLineItems,
} from "../api/purchaseApi";
import type { PurchaseRecord, PurchaseRecordInput, ShippingStatus } from "../types/purchase";
import AppPageHeader from "../../../components/AppPageHeader";

const SHIPPING_STATUS_STEPS: { value: ShippingStatus; label: string; Icon: SvgIconComponent }[] = [
  { value: "ORDERED", label: "Ordered", Icon: ShoppingCartOutlinedIcon },
  { value: "SHIPPED", label: "Shipped", Icon: LocalShippingOutlinedIcon },
  { value: "READY_TO_PICKUP", label: "Ready to Pickup", Icon: StorefrontOutlinedIcon },
  { value: "DELIVERED", label: "Delivered", Icon: TaskAltOutlinedIcon },
];

const SHIPPING_STATUS_INDEX: Record<ShippingStatus, number> = {
  ORDERED: 0,
  SHIPPED: 1,
  READY_TO_PICKUP: 2,
  DELIVERED: 3,
};

const formatCurrencyAmount = (amount: number, currency: string): string => {
  if (!Number.isFinite(amount)) {
    return `- ${currency}`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const formatCount = (value: number): string => new Intl.NumberFormat().format(value);

export default function PurchasesPage() {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionFigurines, setCollectionFigurines] = useState<CollectionFigurine[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    searchParams.get("collectionId") ?? ""
  );

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [deletePurchaseTarget, setDeletePurchaseTarget] = useState<PurchaseRecord | null>(null);
  const [syncPurchaseTarget, setSyncPurchaseTarget] = useState<PurchaseRecord | null>(null);
  const [isDeletingPurchase, setIsDeletingPurchase] = useState(false);
  const [isSyncingPurchase, setIsSyncingPurchase] = useState(false);

  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingFigurines, setLoadingFigurines] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toFigurineNameById = (figurines: CollectionFigurine[]): Record<number, string> =>
    Object.fromEntries(figurines.map((figurine) => [figurine.id, figurine.displayableName]));

  const loadBackendPurchasesForCollection = async (
    figurines: CollectionFigurine[]
  ): Promise<PurchaseRecord[]> => {
    const responses = await getPurchaseSummaryLineItems();
    const figurineIdsInCollection = new Set(figurines.map((figurine) => figurine.id));
    const figurineNameById = toFigurineNameById(figurines);

    return responses
      .filter((purchase) =>
        purchase.lineItems.some((lineItem) => figurineIdsInCollection.has(lineItem.figurineId))
      )
      .map((purchase) => toPurchaseRecordFromSummaryResponse(purchase, figurineNameById));
  };

  useEffect(() => {
    const loadCollections = async () => {
      setLoadingCollections(true);
      setErrorMessage(null);
      try {
        const data = await getCollections();
        setCollections(data);
        setErrorMessage(null);

        if (!selectedCollectionId && data.length > 0) {
          const firstCollectionId = String(data[0].id);
          setSelectedCollectionId(firstCollectionId);
          setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.set("collectionId", firstCollectionId);
            return next;
          });
        }
      } catch (err) {
        setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "collections" }));
      } finally {
        setLoadingCollections(false);
      }
    };

    void loadCollections();
  }, []);

  useEffect(() => {
    const collectionIdNumber = Number(selectedCollectionId);
    if (!Number.isFinite(collectionIdNumber) || collectionIdNumber <= 0) {
      setCollectionFigurines([]);
      setPurchases([]);
      return;
    }

    const loadCollectionData = async () => {
      setLoadingFigurines(true);
      setErrorMessage(null);
      try {
        const figurines = await getCollectionFigurines(collectionIdNumber);
        setCollectionFigurines(figurines);
        const backendPurchases = await loadBackendPurchasesForCollection(figurines);
        setPurchases(backendPurchases);
      } catch (err) {
        setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "collection purchases" }));
      } finally {
        setLoadingFigurines(false);
      }
    };

    void loadCollectionData();
  }, [selectedCollectionId]);

  useEffect(() => {
    const shouldOpenNew = searchParams.get("new") === "1";
    if (shouldOpenNew && selectedCollectionId && !dialogOpen) {
      setEditingPurchaseId(null);
      setDialogOpen(true);

      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("new");
        return next;
      });
    }
  }, [searchParams, selectedCollectionId, dialogOpen]);

  const selectedCollection = useMemo(
    () => collections.find((collection) => String(collection.id) === selectedCollectionId) ?? null,
    [collections, selectedCollectionId]
  );

  const editingPurchase = useMemo(
    () => purchases.find((purchase) => purchase.id === editingPurchaseId) ?? null,
    [editingPurchaseId, purchases]
  );

  const figurineNameById = useMemo(
    () => toFigurineNameById(collectionFigurines),
    [collectionFigurines]
  );

  const figurineThumbnailById = useMemo(
    () =>
      Object.fromEntries(
        collectionFigurines.map((figurine) => [figurine.id, figurine.officialImageUrls?.[0]?.trim() || ""])
      ),
    [collectionFigurines]
  );

  const totalsByCurrency = useMemo(() => {
    const grouped = purchases.reduce<Record<string, number>>((accumulator, purchase) => {
      const currentTotal = accumulator[purchase.currency] ?? 0;
      return {
        ...accumulator,
        [purchase.currency]: currentTotal + purchase.totalAmount,
      };
    }, {});

    return Object.entries(grouped)
      .map(([currency, totalAmount]) => ({ currency, totalAmount }))
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }, [purchases]);

  const grandTotalFigurines = useMemo(
    () => purchases.reduce((total, purchase) => total + purchase.totalFigurines, 0),
    [purchases]
  );

  const handleCollectionChange = (value: string) => {
    setSelectedCollectionId(value);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("collectionId", value);
      next.delete("new");
      return next;
    });
  };

  const reloadCurrentCollectionPurchases = async (): Promise<void> => {
    const collectionIdNumber = Number(selectedCollectionId);
    if (!Number.isFinite(collectionIdNumber) || collectionIdNumber <= 0) {
      setCollectionFigurines([]);
      setPurchases([]);
      return;
    }

    const figurines = await getCollectionFigurines(collectionIdNumber);
    setCollectionFigurines(figurines);
    const backendPurchases = await loadBackendPurchasesForCollection(figurines);
    setPurchases(backendPurchases);
  };

  const handleSavePurchase = async (input: PurchaseRecordInput) => {
    if (!selectedCollectionId) {
      return;
    }

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
      await reloadCurrentCollectionPurchases();
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "purchases" }));
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(editingPurchaseId ? "Purchase updated successfully." : "Purchase recorded successfully.");
    setEditingPurchaseId(null);
    setDialogOpen(false);
  };

  const handleOpenCreateDialog = () => {
    setEditingPurchaseId(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = async (purchase: PurchaseRecord) => {
    const backendPurchaseId = purchase.purchaseId ?? Number(purchase.id);

    if (!Number.isFinite(backendPurchaseId) || backendPurchaseId <= 0) {
      setEditingPurchaseId(purchase.id);
      setDialogOpen(true);
      return;
    }

    try {
      const response = await getPurchaseSummaryLineItemsById(backendPurchaseId);
      const refreshedPurchase = toPurchaseRecordFromSummaryResponse(response, figurineNameById);
      setPurchases((current) =>
        current.map((item) => (item.id === purchase.id ? refreshedPurchase : item))
      );
      setEditingPurchaseId(refreshedPurchase.id);
      setDialogOpen(true);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "purchase" }));
    }
  };

  const handleDeletePurchase = async (purchase: PurchaseRecord) => {
    const backendPurchaseId = purchase.purchaseId ?? Number(purchase.id);

    if (!Number.isFinite(backendPurchaseId) || backendPurchaseId <= 0) {
      setErrorMessage("Unable to identify purchase id for delete.");
      setDeletePurchaseTarget(null);
      return;
    }

    setIsDeletingPurchase(true);
    try {
      await deletePurchaseSummaryLineItems(backendPurchaseId);
      await reloadCurrentCollectionPurchases();
      setSuccessMessage("Purchase deleted successfully.");
      setErrorMessage(null);
      if (editingPurchaseId === purchase.id) {
        setEditingPurchaseId(null);
        setDialogOpen(false);
      }
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, { action: "delete", resource: "purchase" }));
    } finally {
      setIsDeletingPurchase(false);
      setDeletePurchaseTarget(null);
    }
  };

  const handleSyncPurchase = async (purchase: PurchaseRecord) => {
    const backendPurchaseId = purchase.purchaseId ?? Number(purchase.id);
    const collectionIdNumber = Number(selectedCollectionId);

    if (!Number.isFinite(backendPurchaseId) || backendPurchaseId <= 0) {
      setErrorMessage("Unable to identify purchase id for sync.");
      setSyncPurchaseTarget(null);
      return;
    }

    if (!Number.isFinite(collectionIdNumber) || collectionIdNumber <= 0) {
      setErrorMessage("Unable to identify collection id for sync.");
      setSyncPurchaseTarget(null);
      return;
    }

    setIsSyncingPurchase(true);
    try {
      await syncPurchaseTotal(backendPurchaseId, collectionIdNumber);
      await reloadCurrentCollectionPurchases();
      setSuccessMessage("Purchase totals synced successfully.");
      setErrorMessage(null);
      setSyncPurchaseTarget(null);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, { action: "update", resource: "purchases" }));
    } finally {
      setIsSyncingPurchase(false);
    }
  };

  const handleOpenDeleteDialog = (purchase: PurchaseRecord) => {
    setDeletePurchaseTarget(purchase);
  };

  const handleOpenSyncDialog = (purchase: PurchaseRecord) => {
    setSyncPurchaseTarget(purchase);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPurchaseId(null);
  };

  const renderShippingStatusTimeline = (status: ShippingStatus) => {
    const activeIndex = SHIPPING_STATUS_INDEX[status];
    const isDelivered = status === "DELIVERED";
    const activeAccent = isDelivered ? theme.palette.success.main : theme.palette.primary.dark;

    return (
      <Stack spacing={0.5}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          {SHIPPING_STATUS_STEPS.map((step, index) => {
            const isReached = index <= activeIndex;
            const isCurrent = index === activeIndex;
            const isPast = index < activeIndex;

            return (
              <Box
                key={step.value}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flex: index === SHIPPING_STATUS_STEPS.length - 1 ? "0 0 auto" : "1 1 auto",
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    width: isCurrent ? 11 : 9,
                    height: isCurrent ? 11 : 9,
                    borderRadius: "50%",
                    border: `1px solid ${isReached ? activeAccent : alpha(theme.palette.text.disabled, 0.45)}`,
                    bgcolor: isCurrent
                      ? activeAccent
                      : isPast
                        ? theme.palette.background.paper
                        : alpha(theme.palette.text.disabled, 0.2),
                    boxShadow: isCurrent ? `0 0 0 3px ${alpha(activeAccent, 0.22)}` : "none",
                    transition: "all 120ms ease-out",
                  }}
                />
                {index < SHIPPING_STATUS_STEPS.length - 1 && (
                  <Box
                    sx={{
                      flex: 1,
                      height: 2,
                      mx: 0.5,
                      borderRadius: 999,
                      bgcolor: index < activeIndex
                        ? activeAccent
                        : alpha(theme.palette.text.disabled, 0.3),
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${SHIPPING_STATUS_STEPS.length}, minmax(0, 1fr))`,
            columnGap: 0.5,
          }}
        >
          {SHIPPING_STATUS_STEPS.map((step, index) => {
            const isReached = index <= activeIndex;
            const isCurrent = index === activeIndex;

            return (
              <Stack
                key={`${step.value}-label`}
                direction="row"
                spacing={0.35}
                alignItems="center"
                justifyContent={index === SHIPPING_STATUS_STEPS.length - 1 ? "flex-end" : "flex-start"}
                sx={{
                  color: isReached
                    ? (isDelivered ? theme.palette.success.dark : (isCurrent ? activeAccent : "text.primary"))
                    : "text.secondary",
                  minWidth: 0,
                }}
              >
                <step.Icon
                  sx={{
                    fontSize: isCurrent ? 16 : 13,
                    opacity: isReached ? 1 : 0.72,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isCurrent ? 700 : 500,
                    lineHeight: 1.15,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {step.label}
                </Typography>
              </Stack>
            );
          })}
        </Box>
      </Stack>
    );
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
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
        }}
      >
        <Box sx={{ mb: 2.5 }}>
          <AppPageHeader
            eyebrow="Myth Collection"
            title="Purchases"
            subtitle="Track purchase records, totals, and shipping progress by collection."
          />
        </Box>

        <Box
          sx={{
            p: 1.6,
            borderRadius: 2,
            mb: selectedCollection ? 1 : 0,
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }}>
            <FormControl size="small" sx={{ minWidth: 260 }} disabled={loadingCollections}>
              <InputLabel>Collection View</InputLabel>
              <Select
                value={selectedCollectionId}
                label="Collection View"
                onChange={(event) => handleCollectionChange(event.target.value)}
              >
                {collections.map((collection) => (
                  <MenuItem key={collection.id} value={String(collection.id)}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span aria-hidden="true">📦</span>
                      <span>{collection.name}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{ flexShrink: 0 }}
              disabled={!selectedCollectionId || loadingFigurines}
            >
              Record Purchase
            </Button>
          </Stack>
        </Box>

        {selectedCollection && (
          <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
            {selectedCollection.name} · {purchases.length} purchase record{purchases.length === 1 ? "" : "s"}
          </Typography>
        )}
      </Box>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

      {purchases.length > 0 && (
        <Card
          sx={{
            p: 1.4,
            borderRadius: 2,
            mb: 1.2,
            bgcolor: alpha(theme.palette.background.paper, 0.92),
            border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
            <Box>
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                Grand total by currency
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.35, sm: 1.2 }} sx={{ mt: 0.3 }}>
                {totalsByCurrency.map((item) => (
                  <Typography key={item.currency} variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {formatCurrencyAmount(item.totalAmount, item.currency)}
                  </Typography>
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                Total figurines purchased
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {formatCount(grandTotalFigurines)}
              </Typography>
            </Box>
          </Stack>
        </Card>
      )}

      <Stack spacing={1}>
        {purchases.length === 0 ? (
          <Card sx={{ p: 1.6, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No purchases recorded for this collection yet.
            </Typography>
          </Card>
        ) : (
          purchases.map((purchase) => (
            <Card
              key={purchase.id}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.92),
                boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
              }}
            >
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {purchase.store?.trim() ? purchase.store : "Store not specified"}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    Order date: {purchase.orderDate?.trim() ? purchase.orderDate : "No order date"}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    Order number: {purchase.orderNumber?.trim() ? purchase.orderNumber : "Not specified"}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    Purchase ID: {purchase.purchaseId ?? "pending"}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    Tracking: {purchase.trackingNumber?.trim() ? purchase.trackingNumber : "Not available"}
                    {purchase.carrier?.trim() ? ` · Carrier: ${purchase.carrier}` : ""}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    Shipped date: {purchase.shippedDate?.trim() ? purchase.shippedDate : "Not shipped yet"}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    Delivered date: {purchase.deliveredDate?.trim() ? purchase.deliveredDate : "Not delivered yet"}
                  </Typography>
                </Box>

                <Box sx={{ minWidth: { md: 200 } }}>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    Total amount
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {formatCurrencyAmount(purchase.totalAmount, purchase.currency)}
                  </Typography>
                  <br/>
                  <Box sx={{ mt: 1.5 }}>
                    {renderShippingStatusTimeline(purchase.shippingStatus)}
                  </Box>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 2.5 }}>
                    Total figurines: {formatCount(purchase.totalFigurines)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.1} alignItems="center" sx={{ minWidth: 84, justifyContent: "flex-end" }}>
                  <Tooltip title="Sync totals">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenSyncDialog(purchase)}
                      sx={{ color: "secondary.main", "&:hover": { color: "secondary.light" } }}
                      disabled={!selectedCollectionId || loadingFigurines}
                    >
                      <SyncAltOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => void handleOpenEditDialog(purchase)}
                      sx={{ color: "primary.main", "&:hover": { color: "primary.light" } }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDeleteDialog(purchase)}
                      sx={{ color: "error.main", "&:hover": { color: "error.light" } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
              <Divider sx={{ my: 1, opacity: 0.55 }} />
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 0.4, fontWeight: 700 }}>
                Line items
              </Typography>
              <Stack spacing={0.6}>
                {purchase.lines.map((line, index) => (
                  <Box
                    key={`${purchase.id}-line-${index}`}
                    sx={{
                      px: 0.9,
                      py: 0.65,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.background.default, 0.42),
                    }}
                  >
                    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
                      <Tooltip
                        arrow
                        placement="right"
                        enterDelay={180}
                        title={(
                          <Stack spacing={0.7} sx={{ p: 0.2, minWidth: 190 }}>
                            {figurineThumbnailById[line.figurineId] ? (
                              <Box
                                component="img"
                                src={figurineThumbnailById[line.figurineId]}
                                alt={line.figurineName}
                                sx={{
                                  width: 190,
                                  height: 190,
                                  objectFit: "cover",
                                  borderRadius: 1,
                                  bgcolor: "common.black",
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 190,
                                  height: 190,
                                  borderRadius: 1,
                                  bgcolor: "action.hover",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "text.secondary",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                No image available
                              </Box>
                            )}
                            <Typography variant="caption" sx={{ color: "common.white" }}>
                              {line.figurineName} · #{line.figurineId}
                            </Typography>
                          </Stack>
                        )}
                      >
                        {figurineThumbnailById[line.figurineId] ? (
                          <Box
                            component="img"
                            src={figurineThumbnailById[line.figurineId]}
                            alt={line.figurineName}
                            sx={{
                              width: 24,
                              height: 24,
                              objectFit: "cover",
                              borderRadius: 0.75,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: 0.75,
                              bgcolor: "action.hover",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "text.secondary",
                              fontSize: 10,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {line.figurineName.slice(0, 1).toUpperCase()}
                          </Box>
                        )}
                      </Tooltip>
                      <Typography variant="caption" sx={{ display: "block", color: "text.primary", fontWeight: 700 }} noWrap>
                        {line.figurineName}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Qty: {formatCount(line.quantity)} · Price: {formatCurrencyAmount(line.pricePaid, purchase.currency)} · Type: {line.purchaseType}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Card>
          ))
        )}
      </Stack>

      <PurchaseFormDialog
        open={dialogOpen}
        title={editingPurchase ? "Edit Purchase" : "Record Purchase"}
        submitLabel={editingPurchase ? "Update Purchase" : "Save Purchase"}
        initialPurchase={editingPurchase}
        onClose={handleCloseDialog}
        onSubmit={handleSavePurchase}
        figurines={collectionFigurines}
      />

      <Dialog
        open={Boolean(syncPurchaseTarget)}
        onClose={() => {
          if (!isSyncingPurchase) {
            setSyncPurchaseTarget(null);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Sync purchase total?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will sync this purchase total back into the current collection. It can change the figurine count in the collection.
          </DialogContentText>
          {syncPurchaseTarget && selectedCollection && (
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
              Collection: {selectedCollection.name} · Purchase: {syncPurchaseTarget.orderNumber?.trim() ? syncPurchaseTarget.orderNumber : syncPurchaseTarget.purchaseId ?? syncPurchaseTarget.id}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSyncPurchaseTarget(null)}
            disabled={isSyncingPurchase}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (syncPurchaseTarget) {
                void handleSyncPurchase(syncPurchaseTarget);
              }
            }}
            disabled={isSyncingPurchase}
          >
            {isSyncingPurchase ? "Syncing..." : "Sync"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deletePurchaseTarget)}
        onClose={() => {
          if (!isDeletingPurchase) {
            setDeletePurchaseTarget(null);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete purchase?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deletePurchaseTarget
              ? `Delete purchase ${deletePurchaseTarget.orderNumber?.trim() ? deletePurchaseTarget.orderNumber : deletePurchaseTarget.purchaseId ?? deletePurchaseTarget.id}? This cannot be undone.`
              : "Delete this purchase? This cannot be undone."}
          </DialogContentText>
          {deletePurchaseTarget && selectedCollection && (
            <Stack spacing={0.3} sx={{ mt: 1.2 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Collection: {selectedCollection.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Total amount: {formatCurrencyAmount(deletePurchaseTarget.totalAmount, deletePurchaseTarget.currency)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Figurines: {formatCount(deletePurchaseTarget.totalFigurines)}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeletePurchaseTarget(null)}
            disabled={isDeletingPurchase}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deletePurchaseTarget) {
                void handleDeletePurchase(deletePurchaseTarget);
              }
            }}
            disabled={isDeletingPurchase}
          >
            {isDeletingPurchase ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
