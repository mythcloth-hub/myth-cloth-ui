import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import { getCollections, getCollectionFigurines } from "../../collections/api/collectionApi";
import type { Collection, CollectionFigurine } from "../../collections/types/collection";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import PurchaseFormDialog from "../components/PurchaseFormDialog";
import {
  createPurchaseSummaryLineItems,
  getPurchaseSummaryLineItems,
  getPurchaseSummaryLineItemsById,
  toPurchaseRecordFromSummaryResponse,
  updatePurchaseSummaryLineItems,
} from "../api/purchaseApi";
import type { PurchaseRecord, PurchaseRecordInput } from "../types/purchase";

export default function PurchasesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionFigurines, setCollectionFigurines] = useState<CollectionFigurine[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    searchParams.get("collectionId") ?? ""
  );

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);

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

  const handleCollectionChange = (value: string) => {
    setSelectedCollectionId(value);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("collectionId", value);
      next.delete("new");
      return next;
    });
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
      const refreshedPurchases = await loadBackendPurchasesForCollection(collectionFigurines);
      setPurchases(refreshedPurchases);
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

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPurchaseId(null);
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        minHeight: "calc(100vh - 96px)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Tooltip title="Back to Collections">
          <IconButton onClick={() => navigate("/collections")}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <ReceiptLongOutlinedIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Purchases
        </Typography>
      </Stack>

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

      <Card
        sx={{
          p: 1.6,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.25)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.78),
          mb: 2,
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }}>
          <FormControl size="small" sx={{ minWidth: 260 }} disabled={loadingCollections}>
            <InputLabel>Collection</InputLabel>
            <Select
              value={selectedCollectionId}
              label="Collection"
              onChange={(event) => handleCollectionChange(event.target.value)}
            >
              {collections.map((collection) => (
                <MenuItem key={collection.id} value={String(collection.id)}>
                  {collection.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            disabled={!selectedCollectionId || loadingFigurines}
          >
            Record Purchase
          </Button>
        </Stack>
      </Card>

      {selectedCollection && (
        <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
          {selectedCollection.name} · {purchases.length} purchase record{purchases.length === 1 ? "" : "s"}
        </Typography>
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
                p: 1.3,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.18)}`,
              }}
            >
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {purchase.store} {purchase.orderNumber ? `- ${purchase.orderNumber}` : ""}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    Purchase ID: {purchase.purchaseId ?? "pending"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {purchase.orderDate} · {purchase.totalAmount} {purchase.currency}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    Status: {purchase.shippingStatus} · Total figurines: {purchase.totalFigurines}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.8}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => void handleOpenEditDialog(purchase)}
                  >
                    Edit
                  </Button>
                </Stack>
              </Stack>
              <Divider sx={{ my: 0.9 }} />
              <Stack spacing={0.35}>
                {purchase.lines.map((line, index) => (
                  <Typography key={`${purchase.id}-line-${index}`} variant="caption">
                    {line.figurineName} x{line.quantity} · {line.pricePaid} {purchase.currency} ({line.purchaseType})
                  </Typography>
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
    </Box>
  );
}
