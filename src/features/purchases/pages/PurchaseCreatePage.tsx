import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import dayjs from "dayjs";
import AppPageHeader from "../../../components/AppPageHeader";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import { formatCurrencyAmount } from "../../../utils/formatCurrencyAmount";
import { countryCodeToFlag } from "../../../utils/countryFlag";
import { CURRENCY_COUNTRY_CODE, type SupportedCurrency } from "../../../currency/currency";
import { getCollectionFigurines } from "../../collections/api/collectionApi";
import type { Collection, CollectionFigurine } from "../../collections/types/collection";
import { createPurchase, updatePurchase } from "../api/purchaseApi";
import {
  PURCHASE_CURRENCIES,
  type CreatePurchaseRequest,
  type PurchaseRecord,
  type PurchaseChannel,
  type PurchaseType,
  type ShippingStatus,
} from "../types/purchase";

const emptyForm = {
  purchaseDate: "",
  seller: "",
  orderNumber: "",
  currency: "JPY",
  purchaseChannel: "ONLINE" as PurchaseChannel,
  shippingStatus: "NOT_SHIPPED" as ShippingStatus,
  trackingNumber: "",
  carrier: "",
};

type FormState = typeof emptyForm;
type FormErrors = Partial<Record<keyof FormState | "figurines", string>>;
type LocationState = {
  collection?: Collection;
  collectionId?: number;
  purchase?: PurchaseRecord;
  selectedCollectionFigurineIds?: number[];
  includeRestocks?: boolean;
};

type PurchaseLineState = {
  quantity: string;
  pricePaid: string;
  purchaseType: PurchaseType;
};

export default function PurchaseCreatePage() {
  const { t } = useTranslation("purchases");
  const { id, purchaseId } = useParams<{ id?: string; purchaseId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = (location.state as LocationState | null) ?? null;
  const collectionId = Number(id ?? locationState?.collectionId);
  const editing = Boolean(purchaseId && locationState?.purchase);

  const collection = locationState?.collection ?? null;
  const [figurines, setFigurines] = useState<CollectionFigurine[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(locationState?.selectedCollectionFigurineIds ?? []);
  const [lineState, setLineState] = useState<Record<number, PurchaseLineState>>({});
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    purchaseDate: dayjs().format("YYYY-MM-DD"),
  }));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(collectionId) || collectionId <= 0) {
      setServerError(t("create.invalidCollection"));
      setLoading(false);
      return;
    }

    if (!collection) {
      setServerError(t("create.invalidCollection"));
      setLoading(false);
      return;
    }

    let active = true;
    getCollectionFigurines(collectionId, { includeRestocks: locationState?.includeRestocks ?? false })
      .then((loadedFigurines) => {
        if (!active) return;

        const ownedFigurines = loadedFigurines.filter((figurine) => figurine.isCollected);
        const initialIds = new Set(
          (locationState?.purchase
            ? locationState.purchase.figurines.map((line) => line.collectionFigurineId)
            : locationState?.selectedCollectionFigurineIds ?? []
          ).filter((selectedId) =>
            ownedFigurines.some((figurine) => figurine.collectionFigurineId === selectedId),
          ),
        );

        setFigurines(ownedFigurines);
        setSelectedIds([...initialIds]);
        setLineState(
          Object.fromEntries(
            ownedFigurines.map((figurine) => [
              figurine.collectionFigurineId,
              {
                quantity: String(locationState?.purchase?.figurines.find((line) => line.collectionFigurineId === figurine.collectionFigurineId)?.quantity ?? 1),
                pricePaid: String(locationState?.purchase?.figurines.find((line) => line.collectionFigurineId === figurine.collectionFigurineId)?.pricePaid ?? ""),
                purchaseType: locationState?.purchase?.figurines.find((line) => line.collectionFigurineId === figurine.collectionFigurineId)?.purchaseType ?? "RETAIL",
              },
            ]),
          ),
        );
        if (locationState?.purchase) {
          setForm({
            purchaseDate: locationState.purchase.purchaseDate,
            seller: locationState.purchase.seller,
            orderNumber: locationState.purchase.orderNumber ?? "",
            currency: locationState.purchase.currency,
            purchaseChannel: locationState.purchase.purchaseChannel,
            shippingStatus: locationState.purchase.shippingStatus ?? "NOT_SHIPPED",
            trackingNumber: locationState.purchase.trackingNumber ?? "",
            carrier: locationState.purchase.carrier ?? "",
          });
        }
      })
      .catch((error) => {
        if (active) {
          setServerError(getApiErrorMessage(error, { action: "load", resource: "collection figurines" }));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [collectionId]);

  const selectedFigurines = useMemo(
    () => figurines.filter((figurine) => selectedIds.includes(figurine.collectionFigurineId)),
    [figurines, selectedIds],
  );

  const grandTotalAmount = useMemo(
    () =>
      selectedFigurines.reduce((total, figurine) => {
        const line = lineState[figurine.collectionFigurineId];
        const quantity = Number(line?.quantity);
        const pricePaid = Number(line?.pricePaid);

        if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(pricePaid) || pricePaid <= 0) {
          return total;
        }

        return total + quantity * pricePaid;
      }, 0),
    [lineState, selectedFigurines],
  );

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setServerError(null);
  };

  const toggleFigurine = (collectionFigurineId: number) => {
    setSelectedIds((current) =>
      current.includes(collectionFigurineId)
        ? current.filter((idValue) => idValue !== collectionFigurineId)
        : [...current, collectionFigurineId],
    );
    setErrors((current) => ({ ...current, figurines: undefined }));
  };

  const updateLine = (collectionFigurineId: number, key: keyof PurchaseLineState, value: string) => {
    setLineState((current) => ({
      ...current,
      [collectionFigurineId]: {
        ...(current[collectionFigurineId] ?? { quantity: "1", pricePaid: "", purchaseType: "RETAIL" }),
        [key]: value,
      },
    }));
    setServerError(null);
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const today = dayjs().format("YYYY-MM-DD");

    if (!form.purchaseDate) nextErrors.purchaseDate = t("create.dateRequired");
    else if (form.purchaseDate > today) nextErrors.purchaseDate = t("create.dateFuture");
    if (form.seller.trim().length < 3 || form.seller.trim().length > 150) nextErrors.seller = t("create.sellerLength");
    if (form.orderNumber.length > 50) nextErrors.orderNumber = t("create.orderNumberLength");
    if (form.trackingNumber.length > 100) nextErrors.trackingNumber = t("create.trackingLength");
    if (form.carrier.length > 100) nextErrors.carrier = t("create.carrierLength");
    if (selectedFigurines.length === 0) nextErrors.figurines = t("create.figurinesRequired");

    selectedFigurines.forEach((figurine) => {
      const line = lineState[figurine.collectionFigurineId];
      if (!line || !Number.isInteger(Number(line.quantity)) || Number(line.quantity) <= 0) {
        nextErrors.figurines = t("create.lineValuesRequired");
      }
      if (!line || !Number.isFinite(Number(line.pricePaid)) || Number(line.pricePaid) <= 0) {
        nextErrors.figurines = t("create.lineValuesRequired");
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const request: CreatePurchaseRequest = {
      purchaseDate: form.purchaseDate,
      seller: form.seller.trim(),
      ...(form.orderNumber.trim() ? { orderNumber: form.orderNumber.trim() } : {}),
      currency: form.currency,
      purchaseChannel: form.purchaseChannel,
      shippingStatus: form.shippingStatus,
      ...(form.trackingNumber.trim() ? { trackingNumber: form.trackingNumber.trim() } : {}),
      ...(form.carrier.trim() ? { carrier: form.carrier.trim() } : {}),
      figurines: selectedFigurines.map((figurine) => {
        const line = lineState[figurine.collectionFigurineId];
        return {
          collectionFigurineId: figurine.collectionFigurineId,
          quantity: Number(line.quantity),
          pricePaid: Number(line.pricePaid),
          purchaseType: line.purchaseType,
        };
      }),
    };

    setSubmitting(true);
    setServerError(null);
    try {
      if (editing && purchaseId) {
        await updatePurchase(Number(purchaseId), request);
        navigate("/purchases", { replace: true, state: { purchaseUpdated: true } });
      } else {
        await createPurchase(collectionId, request);
        navigate(`/collections/${collectionId}`, {
          replace: true,
          state: { collection, purchaseCreated: true },
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.detail) {
        setServerError(String(error.response.data.detail));
      } else {
        setServerError(getApiErrorMessage(error, { action: "create", resource: "purchase" }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", minHeight: "60vh", alignItems: "center" }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, minHeight: "calc(100vh - 96px)" }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 2 }}>
        <Tooltip title={t("create.back")}>
          <IconButton
            onClick={() => navigate(`/collections/${collectionId}`, { state: { collection } })}
            sx={{ mt: 0.5 }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AppPageHeader
            eyebrow={t("create.eyebrow")}
            title={t(editing ? "update.title" : "create.title")}
            subtitle={collection ? t(editing ? "update.subtitle" : "create.subtitle", { collection: collection.name }) : t("create.title")}
            compact
          />
        </Box>
      </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2, display: "grid", gap: 2 }}>
        {serverError && <Alert severity="error" onClose={() => setServerError(null)}>{serverError}</Alert>}

        <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>{t(editing ? "update.figurinesTitle" : "create.figurinesTitle")}</Typography>
          <Stack spacing={1}>
            {figurines.map((figurine) => {
              const selected = selectedIds.includes(figurine.collectionFigurineId);
              return (
                <Box key={figurine.collectionFigurineId} sx={{ display: "flex", gap: 1, alignItems: "center", p: 1, border: "1px solid", borderColor: selected ? "primary.main" : "divider", borderRadius: 1 }}>
                  {figurine.officialImageUrls[0] ? <Box component="img" src={figurine.officialImageUrls[0]} alt="" sx={{ width: 44, height: 44, objectFit: "cover", borderRadius: 0.75 }} /> : <Box sx={{ width: 44, height: 44, bgcolor: "action.hover", borderRadius: 0.75 }} />}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>{figurine.displayableName}</Typography>
                    <Typography variant="caption" color="text.secondary">{t("create.ownedQuantity", { count: figurine.ownedQuantity })}</Typography>
                  </Box>
                  <Button size="small" variant={selected ? "outlined" : "contained"} startIcon={selected ? <DeleteOutlineIcon /> : <AddIcon />} onClick={() => toggleFigurine(figurine.collectionFigurineId)}>
                    {selected ? t("create.remove") : t("create.add")}
                  </Button>
                </Box>
              );
            })}
          </Stack>
          {errors.figurines && <FormHelperText error>{errors.figurines}</FormHelperText>}
        </Paper>

        {selectedFigurines.map((figurine) => {
          const line = lineState[figurine.collectionFigurineId];
          return (
            <Paper key={`line-${figurine.collectionFigurineId}`} sx={{ p: { xs: 1.5, sm: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>{figurine.displayableName}</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <TextField label={t("create.quantity")} type="number" value={line?.quantity ?? "1"} onChange={(event) => updateLine(figurine.collectionFigurineId, "quantity", event.target.value)} inputProps={{ min: 1, step: 1 }} required fullWidth />
                <TextField label={t("create.pricePaid")} type="number" value={line?.pricePaid ?? ""} onChange={(event) => updateLine(figurine.collectionFigurineId, "pricePaid", event.target.value)} inputProps={{ min: 0.01, step: "0.01" }} required fullWidth />
                <FormControl fullWidth required>
                  <InputLabel>{t("create.purchaseType")}</InputLabel>
                  <Select value={line?.purchaseType ?? "RETAIL"} label={t("create.purchaseType")} onChange={(event) => updateLine(figurine.collectionFigurineId, "purchaseType", event.target.value)}>
                    <MenuItem value="RETAIL">{t("create.retail")}</MenuItem>
                    <MenuItem value="PREORDER">{t("create.preorder")}</MenuItem>
                    <MenuItem value="SECOND_HAND">{t("create.secondHand")}</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Paper>
          );
        })}

        <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>{t("create.purchaseInformation")}</Typography>
          <Box
            sx={{
              mb: 1.5,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {t("create.grandTotal")}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: "primary.main" }}>
              {formatCurrencyAmount(grandTotalAmount, form.currency, {
                style: "currency",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                fallbackCurrency: "USD",
              })}
            </Typography>
          </Box>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField label={t("create.purchaseDate")} type="date" value={form.purchaseDate} onChange={(event) => updateForm("purchaseDate", event.target.value)} error={Boolean(errors.purchaseDate)} helperText={errors.purchaseDate} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: dayjs().format("YYYY-MM-DD") } }} required fullWidth />
              <TextField label={t("create.seller")} value={form.seller} onChange={(event) => updateForm("seller", event.target.value)} error={Boolean(errors.seller)} helperText={errors.seller} inputProps={{ maxLength: 150 }} required fullWidth />
              <FormControl fullWidth required>
                <InputLabel>{t("create.currency")}</InputLabel>
                <Select
                  value={form.currency}
                  label={t("create.currency")}
                  onChange={(event) => updateForm("currency", event.target.value)}
                  renderValue={(value) => (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <Typography component="span" sx={{ fontSize: "1rem", lineHeight: 1 }}>
                        {countryCodeToFlag(CURRENCY_COUNTRY_CODE[value as SupportedCurrency])}
                      </Typography>
                      <Typography component="span">{value}</Typography>
                    </Box>
                  )}
                >
                  {PURCHASE_CURRENCIES.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <Typography component="span" sx={{ fontSize: "1rem", lineHeight: 1 }}>
                          {countryCodeToFlag(CURRENCY_COUNTRY_CODE[currency])}
                        </Typography>
                        <Typography component="span">{currency}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField label={t("create.orderNumber")} value={form.orderNumber} onChange={(event) => updateForm("orderNumber", event.target.value)} error={Boolean(errors.orderNumber)} helperText={errors.orderNumber} inputProps={{ maxLength: 50 }} fullWidth />
              <FormControl fullWidth required><InputLabel>{t("create.purchaseChannel")}</InputLabel><Select value={form.purchaseChannel} label={t("create.purchaseChannel")} onChange={(event) => updateForm("purchaseChannel", event.target.value as PurchaseChannel)}><MenuItem value="ONLINE">{t("create.online")}</MenuItem><MenuItem value="PHYSICAL_STORE">{t("create.physicalStore")}</MenuItem></Select></FormControl>
              <FormControl fullWidth><InputLabel>{t("create.shippingStatus")}</InputLabel><Select value={form.shippingStatus} label={t("create.shippingStatus")} onChange={(event) => updateForm("shippingStatus", event.target.value as ShippingStatus)}><MenuItem value="NOT_SHIPPED">{t("create.notShipped")}</MenuItem><MenuItem value="SHIPPED">{t("create.shipped")}</MenuItem><MenuItem value="DELIVERED">{t("create.delivered")}</MenuItem></Select></FormControl>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField label={t("create.trackingNumber")} value={form.trackingNumber} onChange={(event) => updateForm("trackingNumber", event.target.value)} error={Boolean(errors.trackingNumber)} helperText={errors.trackingNumber} inputProps={{ maxLength: 100 }} fullWidth />
              <TextField label={t("create.carrier")} value={form.carrier} onChange={(event) => updateForm("carrier", event.target.value)} error={Boolean(errors.carrier)} helperText={errors.carrier} inputProps={{ maxLength: 100 }} fullWidth />
            </Stack>
          </Stack>
        </Paper>

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button variant="outlined" onClick={() => navigate(`/collections/${collectionId}`, { state: { collection } })}>{t("create.cancel")}</Button>
          <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SaveOutlinedIcon />}>
            {submitting ? t(editing ? "update.submitting" : "create.submitting") : t(editing ? "update.submit" : "create.submit")}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
