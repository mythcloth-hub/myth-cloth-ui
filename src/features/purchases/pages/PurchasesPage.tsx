import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AppPageHeader from "../../../components/AppPageHeader";
import { useAuth } from "../../../auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import { formatCurrencyAmount } from "../../../utils/formatCurrencyAmount";
import { getCollections, getCollectionFigurines } from "../../collections/api/collectionApi";
import type { Collection, CollectionFigurine } from "../../collections/types/collection";
import { deletePurchase, getPurchases } from "../api/purchaseApi";
import type { PurchaseRecord, ShippingStatus } from "../types/purchase";

const SHIPPING_STATUS_COLOR: Record<ShippingStatus, "default" | "info" | "success"> = {
  NOT_SHIPPED: "default",
  SHIPPED: "info",
  DELIVERED: "success",
};

const SHIPPING_STEPS: ShippingStatus[] = ["NOT_SHIPPED", "SHIPPED", "DELIVERED"];

type FigurineDisplay = Pick<CollectionFigurine, "displayableName" | "officialImageUrls">;

export default function PurchasesPage() {
  const { t } = useTranslation("purchases");
  const { hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [figurinesByCollectionId, setFigurinesByCollectionId] = useState<Record<number, FigurineDisplay>>({});
  const [collectionIdByPurchaseId, setCollectionIdByPurchaseId] = useState<Record<number, number>>({});
  const [collectionsById, setCollectionsById] = useState<Record<number, Collection>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingDeletePurchase, setPendingDeletePurchase] = useState<PurchaseRecord | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState(false);

  const handleConfirmDelete = async () => {
    if (!pendingDeletePurchase) return;

    setDeletingPurchase(true);
    try {
      await deletePurchase(pendingDeletePurchase.purchaseId);
      const refreshedPurchases = await getPurchases();
      setPurchases(refreshedPurchases);
      setSuccessMessage(t("query.deleteSuccess"));
      setErrorMessage(null);
      setPendingDeletePurchase(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, { action: "delete", resource: "purchase" }));
    } finally {
      setDeletingPurchase(false);
    }
  };

  useEffect(() => {
    let active = true;

    Promise.all([getPurchases(), getCollections()])
      .then(async ([purchaseData, collections]) => {
        const figurinePages = await Promise.all(
          collections.map((collection) => getCollectionFigurines(collection.id, { includeRestocks: true })),
        );
        const figurineMap: Record<number, FigurineDisplay> = {};
        const collectionIdByFigurineId: Record<number, number> = {};

        figurinePages.forEach((page, index) => page.forEach((figurine) => {
          figurineMap[figurine.collectionFigurineId] = {
            displayableName: figurine.displayableName,
            officialImageUrls: figurine.officialImageUrls,
          };
          collectionIdByFigurineId[figurine.collectionFigurineId] = collections[index].id;
        }));

        const purchaseCollectionMap = Object.fromEntries(
          purchaseData.flatMap((purchase) => {
            const collectionId = purchase.figurines
              .map((line) => collectionIdByFigurineId[line.collectionFigurineId])
              .find((value): value is number => typeof value === "number");
            return collectionId ? [[purchase.purchaseId, collectionId]] : [];
          }),
        );

        if (active) {
          setPurchases(purchaseData);
          setFigurinesByCollectionId(figurineMap);
          setCollectionIdByPurchaseId(purchaseCollectionMap);
          setCollectionsById(Object.fromEntries(collections.map((collection) => [collection.id, collection])));
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(getApiErrorMessage(error, { action: "load", resource: "purchases" }));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const state = location.state as { purchaseUpdated?: boolean } | null;
    if (state?.purchaseUpdated) {
      setSuccessMessage(t("query.updateSuccess"));
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, t]);

  const totalByCurrency = useMemo(
    () =>
      Object.entries(
        purchases.reduce<Record<string, number>>((totals, purchase) => ({
          ...totals,
          [purchase.currency]: (totals[purchase.currency] ?? 0) + purchase.totalAmount,
        }), {}),
      ),
    [purchases],
  );

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, minHeight: "calc(100vh - 96px)" }}>
      <AppPageHeader
        eyebrow={t("query.eyebrow")}
        title={t("query.title")}
        subtitle={t("query.subtitle")}
        compact
      />

      {errorMessage && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>}

      {!errorMessage && purchases.length === 0 && (
        <Card sx={{ mt: 2, p: 2.5 }}>
          <Typography color="text.secondary">{t("query.empty")}</Typography>
        </Card>
      )}

      {purchases.length > 0 && (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2, mb: 1.5 }}>
            {totalByCurrency.map(([currency, total]) => (
              <Chip key={currency} icon={<ReceiptLongOutlinedIcon />} label={formatCurrencyAmount(total, currency)} />
            ))}
          </Stack>

          <Stack spacing={1.5}>
            {purchases.map((purchase) => (
              <Card key={purchase.purchaseId} sx={{ p: { xs: 1.5, md: 2 } }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{purchase.seller}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("query.purchaseDate")}: {purchase.purchaseDate}
                      {purchase.orderNumber ? ` · ${t("query.orderNumber")}: ${purchase.orderNumber}` : ""}
                    </Typography>
                    <Stack direction="row" spacing={0.6} sx={{ mt: 0.8 }} useFlexGap flexWrap="wrap">
                      <Chip size="small" label={purchase.purchaseChannel === "ONLINE" ? t("query.online") : t("query.physicalStore")} />
                      {purchase.shippingStatus && (
                        <Chip size="small" color={SHIPPING_STATUS_COLOR[purchase.shippingStatus]} label={t(`query.shipping.${purchase.shippingStatus}`)} />
                      )}
                    </Stack>
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                      <Typography variant="caption" color="text.secondary">{t("query.total")}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {formatCurrencyAmount(purchase.totalAmount, purchase.currency)}
                      </Typography>
                    </Box>
                    {hasPermission("purchases:update") && (
                      <Tooltip title={t("query.edit")}>
                        <IconButton
                          aria-label={t("query.edit")}
                          onClick={() => navigate(`/purchases/${purchase.purchaseId}/edit`, {
                            state: {
                              purchase,
                              collectionId: collectionIdByPurchaseId[purchase.purchaseId],
                              collection: collectionsById[collectionIdByPurchaseId[purchase.purchaseId]],
                            },
                          })}
                        >
                          <EditOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {hasPermission("purchases:delete") && (
                      <Tooltip title={t("query.delete")}>
                        <IconButton
                          color="error"
                          aria-label={t("query.delete")}
                          onClick={() => setPendingDeletePurchase(purchase)}
                        >
                          <DeleteOutlineOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>

                <Stepper
                  activeStep={Math.max(0, SHIPPING_STEPS.indexOf(purchase.shippingStatus ?? "NOT_SHIPPED"))}
                  alternativeLabel
                  sx={{
                    mt: 2,
                    px: { xs: 0, sm: 2 },
                    "& .MuiStepLabel-label": {
                      fontSize: { xs: "0.66rem", sm: "0.75rem" },
                    },
                    "& .MuiStepIcon-root.Mui-active": {
                      color: "info.main",
                    },
                    "& .MuiStepIcon-root.Mui-completed": {
                      color: "success.main",
                    },
                  }}
                >
                  {SHIPPING_STEPS.map((status) => (
                    <Step key={status}>
                      <StepLabel>{t(`query.shipping.${status}`)}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <Stack spacing={0.8} sx={{ mt: 1.5 }}>
                  {purchase.figurines.map((line) => {
                    const figurine = figurinesByCollectionId[line.collectionFigurineId];
                    return (
                      <Box key={line.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 0.9, borderRadius: 1, bgcolor: "action.hover" }}>
                        {figurine?.officialImageUrls[0] ? <Box component="img" src={figurine.officialImageUrls[0]} alt="" sx={{ width: 40, height: 40, objectFit: "cover", borderRadius: 0.75 }} /> : <Box sx={{ width: 40, height: 40, borderRadius: 0.75, bgcolor: "divider" }} />}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>{figurine?.displayableName ?? t("query.unknownFigurine", { id: line.collectionFigurineId })}</Typography>
                          <Typography variant="caption" color="text.secondary">{line.purchaseType} · {t("query.quantity")}: {line.quantity}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatCurrencyAmount(line.pricePaid * line.quantity, purchase.currency)}</Typography>
                      </Box>
                    );
                  })}
                </Stack>

                {(purchase.trackingNumber || purchase.carrier || purchase.shippedDate || purchase.deliveredDate) && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    {[purchase.carrier, purchase.trackingNumber, purchase.shippedDate && `${t("query.shipped")}: ${purchase.shippedDate}`, purchase.deliveredDate && `${t("query.delivered")}: ${purchase.deliveredDate}`].filter(Boolean).join(" · ")}
                  </Typography>
                )}
              </Card>
            ))}
          </Stack>
        </>
      )}

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
        open={Boolean(pendingDeletePurchase)}
        onClose={(_, reason) => {
          if (deletingPurchase && (reason === "backdropClick" || reason === "escapeKeyDown")) return;
          if (!deletingPurchase) setPendingDeletePurchase(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("query.deleteTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t("query.deleteDescription")}
          </Typography>
          {pendingDeletePurchase && (
            <Typography variant="caption" sx={{ display: "block", mt: 1, fontWeight: 700 }}>
              {pendingDeletePurchase.seller} · {pendingDeletePurchase.purchaseDate}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPendingDeletePurchase(null)}
            disabled={deletingPurchase}
            startIcon={<CancelOutlinedIcon />}
          >
            {t("query.cancel")}
          </Button>
          <Button
            onClick={() => void handleConfirmDelete()}
            color="error"
            variant="contained"
            disabled={deletingPurchase}
            startIcon={deletingPurchase ? <CircularProgress size={18} color="inherit" /> : <DeleteOutlineOutlinedIcon />}
          >
            {t("query.deleteConfirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
