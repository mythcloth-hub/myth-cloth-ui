import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import axios from "axios";
import {
  emptyPurchaseDraft,
  emptyPurchaseLine,
  PURCHASE_CURRENCIES,
  type PurchaseDraft,
  type PurchaseLineDraft,
  type PurchaseRecord,
  type PurchaseRecordInput,
  type ShippingStatus,
} from "../types/purchase";

type FigurineOption = {
  id: number;
  displayableName: string;
  isCollected?: boolean;
};

type PurchaseFormDialogProps = {
  open: boolean;
  title?: string;
  submitLabel?: string;
  figurines: FigurineOption[];
  initialPurchase?: PurchaseRecord | null;
  initialDraft?: PurchaseDraft | null;
  onClose: () => void;
  onSubmit: (record: PurchaseRecordInput) => Promise<void> | void;
};

const toPurchaseDraft = (purchase: PurchaseRecord): PurchaseDraft => ({
  orderDate: purchase.orderDate,
  store: purchase.store ?? "",
  orderNumber: purchase.orderNumber ?? "",
  currency: purchase.currency,
  totalAmount: String(purchase.totalAmount),
  shippingStatus: purchase.shippingStatus,
  trackingNumber: purchase.trackingNumber ?? "",
  carrier: purchase.carrier ?? "",
  lines: purchase.lines.length > 0
    ? purchase.lines.map((line) => ({
        figurineId: String(line.figurineId),
        quantity: String(line.quantity),
        pricePaid: String(line.pricePaid),
        purchaseType: line.purchaseType,
      }))
    : [emptyPurchaseLine()],
});

export default function PurchaseFormDialog({
  open,
  title = "Record Purchase",
  submitLabel = "Save Purchase",
  figurines,
  initialPurchase,
  initialDraft,
  onClose,
  onSubmit,
}: PurchaseFormDialogProps) {
  const [draft, setDraft] = useState<PurchaseDraft>(emptyPurchaseDraft());
  const [formError, setFormError] = useState<string | null>(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const maxOrderDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const isOrderDateInFuture = (value: string): boolean => {
    if (!value) return false;

    const selectedDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today;
  };

  const clearValidationFeedback = () => {
    setFormError(null);
    setFieldErrors({});
  };

  const getFieldError = (fieldName: string): string | undefined => fieldErrors[fieldName];

  const getLineFieldError = (index: number, fieldName: string): string | undefined =>
    fieldErrors[`lineItems[${index}].${fieldName}`];

  const getSelectedFigurineIds = (currentIndex: number): Set<string> =>
    new Set(
      draft.lines
        .filter((_, lineIndex) => lineIndex !== currentIndex)
        .map((line) => line.figurineId)
        .filter((figurineId) => figurineId.trim().length > 0)
    );

  const parseBackendValidationErrors = (
    error: unknown
  ): { message: string; fieldErrors: Record<string, string> } | null => {
    if (!axios.isAxiosError(error)) {
      return null;
    }

    const responseData = error.response?.data as
      | {
          detail?: string;
          title?: string;
          errors?: Record<string, string>;
        }
      | undefined;

    if (!responseData?.errors || typeof responseData.errors !== "object") {
      return null;
    }

    return {
      message:
        responseData.detail?.trim() ||
        responseData.title?.trim() ||
        "Please fix the highlighted fields and try again.",
      fieldErrors: responseData.errors,
    };
  };

  const autoTotalAmount = useMemo(() => {
    return draft.lines.reduce((total, line) => {
      const quantity = Number(line.quantity);
      const pricePaid = Number(line.pricePaid);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return total;
      }

      if (!Number.isFinite(pricePaid) || pricePaid < 0) {
        return total;
      }

      return total + quantity * pricePaid;
    }, 0);
  }, [draft.lines]);

  useEffect(() => {
    if (open) {
      if (initialPurchase) {
        setDraft(toPurchaseDraft(initialPurchase));
      } else if (initialDraft) {
        setDraft({
          ...initialDraft,
          lines: initialDraft.lines.length > 0 ? [...initialDraft.lines] : [emptyPurchaseLine()],
        });
      } else {
        setDraft(emptyPurchaseDraft());
      }
      clearValidationFeedback();
      setShowValidationErrors(false);
      setIsSubmitting(false);
    }
  }, [initialDraft, initialPurchase, open]);

  const handleFieldChange = <K extends keyof PurchaseDraft>(key: K, value: PurchaseDraft[K]) => {
    clearValidationFeedback();
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleLineChange = (index: number, key: keyof PurchaseLineDraft, value: string) => {
    clearValidationFeedback();
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [key]: value } : line
      ),
    }));
  };

  const handleAddLine = () => {
    clearValidationFeedback();
    setDraft((current) => ({
      ...current,
      lines: [...current.lines, emptyPurchaseLine()],
    }));
  };

  const handleRemoveLine = (index: number) => {
    clearValidationFeedback();
    setDraft((current) => ({
      ...current,
      lines: current.lines.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const handleSave = async () => {
    setShowValidationErrors(true);
    clearValidationFeedback();

    const trimmedStore = (draft.store ?? "").trim();
    const trimmedOrderNumber = (draft.orderNumber ?? "").trim();
    const trimmedTrackingNumber = (draft.trackingNumber ?? "").trim();
    const trimmedCarrier = (draft.carrier ?? "").trim();

    if (isOrderDateInFuture(draft.orderDate)) {
      setFormError("Order date cannot be in the future.");
      setFieldErrors({ orderDate: "Order date cannot be in the future." });
      return;
    }

    if (trimmedStore.length > 100) {
      setFormError("Store must not exceed 100 characters.");
      setFieldErrors({ store: "Store must not exceed 100 characters." });
      return;
    }

    if (trimmedOrderNumber.length > 50) {
      setFormError("Order number must not exceed 50 characters.");
      setFieldErrors({ orderNumber: "Order number must not exceed 50 characters." });
      return;
    }

    if (trimmedTrackingNumber.length > 50) {
      setFormError("Tracking number must not exceed 50 characters.");
      setFieldErrors({ trackingNumber: "Tracking number must not exceed 50 characters." });
      return;
    }

    if (trimmedCarrier.length > 50) {
      setFormError("Carrier must not exceed 50 characters.");
      setFieldErrors({ carrier: "Carrier must not exceed 50 characters." });
      return;
    }

    const normalizedLines = draft.lines
      .map((line) => ({
        ...line,
        figurineIdNumber: Number(line.figurineId),
        quantityNumber: Number(line.quantity),
        pricePaidNumber: Number(line.pricePaid),
      }))
      .filter(
        (line) =>
          Number.isFinite(line.figurineIdNumber) &&
          line.figurineIdNumber > 0 &&
          Number.isFinite(line.quantityNumber) &&
          line.quantityNumber > 0 &&
          Number.isFinite(line.pricePaidNumber) &&
          line.pricePaidNumber > 0
      );

    if (normalizedLines.length === 0) {
      setFormError("Add at least one valid purchased figurine line.");
      return;
    }

    const duplicateFigurineIds = normalizedLines.reduce<Record<number, number[]>>((accumulator, line, index) => {
      const existingIndexes = accumulator[line.figurineIdNumber] ?? [];
      return {
        ...accumulator,
        [line.figurineIdNumber]: [...existingIndexes, index],
      };
    }, {});

    const duplicateIndexes = Object.values(duplicateFigurineIds)
      .filter((indexes) => indexes.length > 1)
      .flat();

    if (duplicateIndexes.length > 0) {
      const duplicateErrors = Object.fromEntries(
        duplicateIndexes.map((lineIndex) => [
          `lineItems[${lineIndex}].figurineId`,
          "Each line item must use a different figurine.",
        ])
      );

      setFieldErrors(duplicateErrors);
      setFormError("Each line item must use a different figurine.");
      return;
    }

    if (!draft.currency) {
      setFormError("Currency is required.");
      return;
    }

    if (!draft.shippingStatus) {
      setFormError("Shipping status is required.");
      return;
    }

    const computedTotalAmount = normalizedLines.reduce(
      (total, line) => total + line.quantityNumber * line.pricePaidNumber,
      0
    );

    const totalFigurines = normalizedLines.reduce(
      (total, line) => total + line.quantityNumber,
      0
    );

    const figurineNameById = Object.fromEntries(
      figurines.map((figurine) => [figurine.id, figurine.displayableName])
    );

    setIsSubmitting(true);
    try {
      await onSubmit({
        orderDate: draft.orderDate,
        store: trimmedStore,
        orderNumber: trimmedOrderNumber,
        currency: draft.currency,
        totalAmount: Number(computedTotalAmount.toFixed(2)),
        totalFigurines,
        shippingStatus: draft.shippingStatus,
        trackingNumber: trimmedTrackingNumber,
        carrier: trimmedCarrier,
        lines: normalizedLines.map((line) => ({
          figurineId: line.figurineIdNumber,
          figurineName: figurineNameById[line.figurineIdNumber] ?? `Figurine ${line.figurineIdNumber}`,
          quantity: line.quantityNumber,
          pricePaid: line.pricePaidNumber,
          purchaseType: line.purchaseType,
        })),
      });
    } catch (error) {
      const backendValidation = parseBackendValidationErrors(error);
      if (backendValidation) {
        setFieldErrors(backendValidation.fieldErrors);
        setFormError(backendValidation.message);
      } else {
        setFormError("Unable to save purchase. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (isSubmitting && (reason === "backdropClick" || reason === "escapeKeyDown")) {
          return;
        }
        onClose();
      }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.4}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <TextField
              label="Order date"
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: maxOrderDate }}
              value={draft.orderDate}
              onChange={(event) => handleFieldChange("orderDate", event.target.value)}
              error={showValidationErrors && Boolean(getFieldError("orderDate") || isOrderDateInFuture(draft.orderDate))}
              helperText={
                showValidationErrors
                  ? getFieldError("orderDate") ?? (isOrderDateInFuture(draft.orderDate) ? "Order date cannot be in the future." : undefined)
                  : undefined
              }
              fullWidth
            />
            <TextField
              label="Store"
              size="small"
              value={draft.store}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFieldChange("store", event.target.value)}
              inputProps={{ maxLength: 100 }}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <TextField
              label="Order number"
              size="small"
              value={draft.orderNumber}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFieldChange("orderNumber", event.target.value)}
              inputProps={{ maxLength: 50 }}
              fullWidth
            />
            <FormControl size="small" fullWidth required error={showValidationErrors && Boolean(getFieldError("currency") || !draft.currency)}>
              <InputLabel required>Currency</InputLabel>
              <Select
                value={draft.currency}
                label="Currency"
                onChange={(event) => handleFieldChange("currency", event.target.value)}
              >
                {PURCHASE_CURRENCIES.map((currency) => (
                  <MenuItem key={currency} value={currency}>{currency}</MenuItem>
                ))}
              </Select>
              {showValidationErrors && (getFieldError("currency") || !draft.currency) && (
                <FormHelperText>{getFieldError("currency") ?? "Currency is required."}</FormHelperText>
              )}
            </FormControl>
            <TextField
              label="Total amount"
              size="small"
              value={autoTotalAmount.toFixed(2)}
              inputProps={{ readOnly: true }}
              helperText="Auto-calculated from quantity x price paid"
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <FormControl size="small" fullWidth required error={showValidationErrors && Boolean(getFieldError("shippingStatus") || !draft.shippingStatus)}>
              <InputLabel required>Shipping status</InputLabel>
              <Select
                value={draft.shippingStatus}
                label="Shipping status"
                onChange={(event) => handleFieldChange("shippingStatus", event.target.value as ShippingStatus)}
              >
                <MenuItem value="ORDERED">Ordered</MenuItem>
                <MenuItem value="SHIPPED">Shipped</MenuItem>
                <MenuItem value="READY_TO_PICKUP">Ready to Pickup</MenuItem>
                <MenuItem value="DELIVERED">Delivered</MenuItem>
              </Select>
              {showValidationErrors && (getFieldError("shippingStatus") || !draft.shippingStatus) && (
                <FormHelperText>{getFieldError("shippingStatus") ?? "Shipping status is required."}</FormHelperText>
              )}
            </FormControl>
            <TextField
              label="Tracking number"
              size="small"
              value={draft.trackingNumber}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFieldChange("trackingNumber", event.target.value)}
              inputProps={{ maxLength: 50 }}
              fullWidth
            />
            <TextField
              label="Carrier"
              size="small"
              value={draft.carrier}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleFieldChange("carrier", event.target.value)}
              inputProps={{ maxLength: 50 }}
              fullWidth
            />
          </Stack>

          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Purchased Figurines
          </Typography>

          {draft.lines.map((line, index) => (
            <Stack key={`line-${index}`} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-start">
              {(() => {
                const selectedFigurineIds = getSelectedFigurineIds(index);

                return (
              <FormControl
                size="small"
                fullWidth
                required
                error={showValidationErrors && Boolean(getLineFieldError(index, "figurineId") || !Number.isFinite(Number(line.figurineId)) || Number(line.figurineId) <= 0)}
                sx={{ minWidth: 0 }}
              >
                <InputLabel required>Figurine</InputLabel>
                <Select
                  value={line.figurineId}
                  label="Figurine"
                  onChange={(event) => handleLineChange(index, "figurineId", String(event.target.value))}
                >
                  {figurines
                    .filter((figurine) => figurine.isCollected !== false)
                    .map((figurine) => (
                      <MenuItem
                        key={figurine.id}
                        value={String(figurine.id)}
                        disabled={selectedFigurineIds.has(String(figurine.id))}
                      >
                        {figurine.displayableName}
                      </MenuItem>
                    ))}
                </Select>
                <FormHelperText sx={{ minHeight: 40 }}>
                  {showValidationErrors && (getLineFieldError(index, "figurineId") || !Number.isFinite(Number(line.figurineId)) || Number(line.figurineId) <= 0)
                    ? getLineFieldError(index, "figurineId") ?? "Figurine is required."
                    : " "}
                </FormHelperText>
              </FormControl>
                );
              })()}

              <TextField
                label="Qty"
                required
                size="small"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                value={line.quantity}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleLineChange(index, "quantity", event.target.value)}
                error={showValidationErrors && Boolean(getLineFieldError(index, "quantity") || !Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0)}
                helperText={
                  showValidationErrors
                    ? getLineFieldError(index, "quantity") ?? (!Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0 ? "Qty must be positive." : " ")
                    : " "
                }
                FormHelperTextProps={{ sx: { minHeight: 40 } }}
                sx={{ width: { xs: "100%", sm: 90 } }}
              />

              <TextField
                label="Price paid"
                required
                size="small"
                type="number"
                inputProps={{ min: 0.01, step: "0.01" }}
                value={line.pricePaid}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleLineChange(index, "pricePaid", event.target.value)}
                error={showValidationErrors && Boolean(getLineFieldError(index, "pricePaid") || !Number.isFinite(Number(line.pricePaid)) || Number(line.pricePaid) <= 0)}
                helperText={
                  showValidationErrors
                    ? getLineFieldError(index, "pricePaid") ?? (!Number.isFinite(Number(line.pricePaid)) || Number(line.pricePaid) <= 0 ? "Price paid must be greater than 0." : " ")
                    : " "
                }
                FormHelperTextProps={{ sx: { minHeight: 40 } }}
                sx={{ width: { xs: "100%", sm: 140 } }}
              />

              <FormControl size="small" required error={showValidationErrors && Boolean(getLineFieldError(index, "purchaseType"))} sx={{ width: { xs: "100%", sm: 150 }, minWidth: 0 }}>
                <InputLabel required>Type</InputLabel>
                <Select
                  value={line.purchaseType}
                  label="Type"
                  onChange={(event) => handleLineChange(index, "purchaseType", String(event.target.value))}
                >
                  <MenuItem value="PREORDER">Preorder</MenuItem>
                  <MenuItem value="RETAIL">Retail</MenuItem>
                  <MenuItem value="SECOND_HAND">Second-hand</MenuItem>
                </Select>
                <FormHelperText sx={{ minHeight: 40 }}>
                  {showValidationErrors && getLineFieldError(index, "purchaseType") ? getLineFieldError(index, "purchaseType") : " "}
                </FormHelperText>
              </FormControl>

              <IconButton
                size="small"
                color="error"
                onClick={() => handleRemoveLine(index)}
                disabled={draft.lines.length === 1}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}

          <Box>
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddLine}>
              Add figurine
            </Button>
          </Box>

          {formError && <Alert severity="error">{formError}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
