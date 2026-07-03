import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AddIcon from "@mui/icons-material/Add";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import axios from "axios";
import dayjs from "dayjs";

import {
  getFigurineById,
  createFigurine,
  updateFigurine,
  deleteFigurine,
  getFigurineEvents,
  createFigurineEvent,
  updateFigurineEvent,
  deleteFigurineEvent,
} from "../api/figurineApi";
import { getAllAnniversaries } from "../../anniversaries/api/anniversaryApi";
import { groupsApi, lineupsApi, seriesApi } from "../../catalogs/api/catalogApi";
import { getAllDistributors } from "../../distributors/api/distributorApi";
import type { Anniversary } from "../../anniversaries/types/anniversary";
import type { Catalog } from "../../catalogs/types/catalog";
import type { Distributor } from "../../distributors/types/distributor";
import type {
  Figurine,
  FigurineEvent,
  FigurineEventReq,
  FigurineEventType,
  FigurineEventRegion,
} from "../types/figurine";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import AppPageHeader from "../../../components/AppPageHeader";
// Event form helpers
const EVENT_TYPES: { value: FigurineEventType; label: string }[] = [
  { value: "ANNOUNCEMENT", label: "Announcement" },
  { value: "PREORDER_OPEN", label: "Preorder Opens" },
  { value: "PREORDER_CLOSE", label: "Preorder Closes" },
  { value: "RELEASE", label: "Release" },
  { value: "RESTOCK", label: "Restock" },
  { value: "LOCAL_CONFIRMATION", label: "Local Confirmation" },
  { value: "LOCAL_RELEASE", label: "Local Release" },
];
const EVENT_REGIONS: { value: FigurineEventRegion; label: string }[] = [
  { value: "JP", label: "Japan" },
  { value: "MX", label: "Mexico" },
  { value: "ES", label: "Spain" },
  { value: "US", label: "USA" },
  { value: "CN", label: "China" },
];

// ── Form-level types (all IDs, strings for numeric inputs) ──────────────────

type DistributorEntry = {
  distributorId: string;
  currency: string;
  price: string;
  preorderOpensAt: string;
  announcedAt: string; // New field for backend mapping
  releaseDate: string;
  releaseDateConfirmed: boolean;
};

type FormData = {
  name: string;
  lineUpId: string;
  seriesId: string;
  groupId: string;
  anniversaryId: string;
  isMetalBody: boolean;
  isOriginalColorEdition: boolean;
  isRevival: boolean;
  isPlainCloth: boolean;
  isBattleDamaged: boolean;
  isGoldenArmor: boolean;
  isGold24kEdition: boolean;
  isMangaVersion: boolean;
  isMultiPack: boolean;
  isArticulable: boolean;
  notes: string;
  officialImageUrls: string[];
  distributors: DistributorEntry[];
};

type FormErrors = Partial<Record<string, string>>;

const emptyDistributor = (): DistributorEntry => ({
  distributorId: "",
  currency: "JPY",
  price: "",
  preorderOpensAt: "",
  announcedAt: "",
  releaseDate: "",
  releaseDateConfirmed: false,
});

const CURRENCIES = ["EUR", "MXN", "CAD", "CNY", "JPY", "USD"];

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  MXN: "MX$",
  CAD: "CA$",
  CNY: "CN¥",
  JPY: "JPY ¥",
  USD: "US$",
};

const PRICE_INPUT_PATTERN = /^\d*(\.\d{0,2})?$/;
const MAX_PRICE_INTEGER_PART = 50000;

function isPriceIntegerPartWithinLimit(value: string): boolean {
  const integerPartRaw = value.split(".")[0] ?? "";
  if (!integerPartRaw) return true;
  const integerPart = Number(integerPartRaw);
  return Number.isFinite(integerPart) && integerPart <= MAX_PRICE_INTEGER_PART;
}

const emptyForm: FormData = {
  name:                   "",
  lineUpId:               "",
  seriesId:               "",
  groupId:                "",
  anniversaryId:          "",
  isMetalBody:            false,
  isOriginalColorEdition: false,
  isRevival:              false,
  isPlainCloth:           false,
  isBattleDamaged:        false,
  isGoldenArmor:          false,
  isGold24kEdition:       false,
  isMangaVersion:         false,
  isMultiPack:            false,
  isArticulable:          true,
  notes:                  "",
  officialImageUrls:      [""],
  distributors:           [emptyDistributor()],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const BOOL_FIELDS: { key: keyof FormData; label: string }[] = [
  { key: "isMetalBody",            label: "Metal Body"             },
  { key: "isArticulable",          label: "Articulable"            },
  { key: "isRevival",              label: "Revival"                },
  { key: "isOriginalColorEdition", label: "Original Color Edition" },
  { key: "isBattleDamaged",        label: "Battle Damaged"         },
  { key: "isGoldenArmor",          label: "Golden Armor"           },
  { key: "isGold24kEdition",       label: "Gold 24K Edition"       },
  { key: "isMangaVersion",         label: "Manga Version"          },
  { key: "isPlainCloth",           label: "Plain Cloth"            },
  { key: "isMultiPack",            label: "Multi-Pack"             },
];

// ── Section heading helper ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Typography
        variant="overline"
        sx={{ color: "primary.main", fontSize: "0.65rem", letterSpacing: "0.1em", display: "block", mt: 2, mb: 1 }}
      >
        {children}
      </Typography>
      <Divider sx={{ borderColor: "rgba(212,175,55,0.12)", mb: 2 }} />
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FigurineFormPage() {
      // ── Event dialog handlers ────────────────────────────────────────────────
  // Event management state
  const [events, setEvents] = useState<FigurineEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsModalOpen, setEventsModalOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FigurineEvent | null>(null);
  const [eventForm, setEventForm] = useState<Omit<FigurineEventReq, "figurineId"> & { id?: number }>({
    description: "",
    date: "",
    dateConfirmed: false,
    region: "JP",
    type: "ANNOUNCEMENT",
  });
  const [eventFormError, setEventFormError] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // catalog options
  const [lineups,      setLineups]      = useState<Catalog[]>([]);
  const [seriesList,   setSeriesList]   = useState<Catalog[]>([]);
  const [groups,       setGroups]       = useState<Catalog[]>([]);
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);

  // ── Event dialog handlers ────────────────────────────────────────────────
  const openAddEventDialog = () => {
    setEditingEvent(null);
    setEventForm({ description: "", date: "", dateConfirmed: false, region: "JP", type: "ANNOUNCEMENT" });
    setEventFormError(null);
    setEventDialogOpen(true);
  };

  const openEditEventDialog = (event: FigurineEvent) => {
    setEditingEvent(event);
    setEventForm({
      description: event.description,
      date: event.date,
      dateConfirmed: event.dateConfirmed,
      region: event.region,
      type: event.type,
      id: event.id,
    });
    setEventFormError(null);
    setEventDialogOpen(true);
  };

  const closeEventDialog = () => {
    setEventDialogOpen(false);
    setEditingEvent(null);
    setEventForm({ description: "", date: "", dateConfirmed: false, region: "JP", type: "ANNOUNCEMENT" });
    setEventFormError(null);
  };

  const handleEventFormChange = (key: "description" | "date" | "region" | "type" | "dateConfirmed", value: string | boolean) => {
    setEventForm((prev) => ({
      ...prev,
      dateConfirmed: key === "dateConfirmed" ? Boolean(value) : prev.dateConfirmed,
      [key]: key === "type"
        ? value as FigurineEventType
        : key === "region"
          ? value as FigurineEventRegion
          : key === "dateConfirmed"
            ? Boolean(value)
            : value as string,
    }));
    setEventFormError(null);
  };

  const handleEventFormSubmit = async () => {
    if (!form || !id) return;
    const { description, date, dateConfirmed, region, type, id: eventId } = eventForm;
    if (!description.trim() || !date || !region || !type) {
      setEventFormError("All fields are required.");
      return;
    }
    if (description.trim().length > 100) {
      setEventFormError("Description cannot exceed 100 characters.");
      return;
    }
    if (dayjs(date).isAfter(dayjs(), "day")) {
      setEventFormError("Event date cannot be in the future.");
      return;
    }
    setEventFormError(null);
    try {
      setLoadingEvents(true);
      const figurineId = Number(id);
      if (editingEvent && eventId) {
        // Update existing event
        const updated = await updateFigurineEvent(figurineId, eventId, {
          description: description.trim(),
          date,
          dateConfirmed,
          region,
          type,
          figurineId,
        });
        setEvents((prev) => prev.map((ev) => (ev.id === eventId ? updated : ev)));
      } else {
        // Create new event
        const created = await createFigurineEvent(figurineId, {
          description: description.trim(),
          date,
          dateConfirmed,
          region,
          type,
          figurineId,
        });
        setEvents((prev) => [...prev, created]);
      }
      closeEventDialog();
    } catch (err) {
      setEventFormError(getApiErrorMessage(err, { action: editingEvent ? "update" : "create", resource: "event" }));
      console.error(err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!form || !id) return;
    setDeletingEventId(eventId);
    try {
      await deleteFigurineEvent(Number(id), eventId);
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    } catch (err) {
      setEventFormError(getApiErrorMessage(err, { action: "delete", resource: "event" }));
      console.error(err);
    } finally {
      setDeletingEventId(null);
    }
  };

  const [form,           setForm]           = useState<FormData | null>(null);
  const [errors,         setErrors]         = useState<FormErrors>({});
  const [imgErrors,      setImgErrors]      = useState<Record<number, boolean>>({});
  const [loadingForm,    setLoadingForm]     = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [serverError,    setServerError]    = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successRedirectPath, setSuccessRedirectPath] = useState<string | null>(null);

  // Load catalog options + (optionally) figurine data in parallel
  useEffect(() => {
    const catalogRequests: Promise<unknown>[] = [
      lineupsApi.getAll(),
      seriesApi.getAll(),
      groupsApi.getAll(),
      getAllAnniversaries(),
      getAllDistributors(),
    ];
    const requests = isEdit
      ? [...catalogRequests, getFigurineById(Number(id))]
      : catalogRequests;

    Promise.all(requests)
      .then((results) => {
        const [lu, sr, gr, ann, dist, fig] = results;
        setLineups(lu as Catalog[]);
        setSeriesList(sr as Catalog[]);
        setGroups(gr as Catalog[]);
        setAnniversaries(ann as Anniversary[]);
        setDistributors(dist as Distributor[]);

        if (isEdit && fig) {
          const f = fig as Figurine;
          setForm({
            name:                  f.name,
            lineUpId:              String(f.lineUp.id),
            seriesId:              String(f.series.id),
            groupId:               f.group ? String(f.group.id) : "",
            anniversaryId:         f.anniversary ? String(f.anniversary.id) : "",
            isMetalBody:           f.isMetalBody,
            isOriginalColorEdition:f.isOriginalColorEdition,
            isRevival:             f.isRevival,
            isPlainCloth:          f.isPlainCloth,
            isBattleDamaged:       f.isBattleDamaged,
            isGoldenArmor:         f.isGoldenArmor,
            isGold24kEdition:      f.isGold24kEdition,
            isMangaVersion:        f.isMangaVersion,
            isMultiPack:           f.isMultiPack,
            isArticulable:         f.isArticulable,
            notes:                 f.notes ?? "",
            officialImageUrls:     f.officialImageUrls?.length ? f.officialImageUrls : [""],
            distributors:          f.distributors?.length
              ? f.distributors.map((d) => ({
                  distributorId:      String(d.distributor.id),
                  currency:           d.currency,
                  price:              d.price != null ? String(d.price) : "",
                  preorderOpensAt:    d.preorderOpensAt ?? "",
                  announcedAt:        d.announcedAt ?? "", // Map backend field
                  releaseDate:        d.releaseDate ?? "",
                  releaseDateConfirmed: d.releaseDateConfirmed,
                }))
              : [emptyDistributor()],
          });
          // Load events for this figurine
          setLoadingEvents(true);
          getFigurineEvents(f.id)
            .then(setEvents)
            .catch(() => setEvents([]))
            .finally(() => setLoadingEvents(false));
        } else {
          setForm(emptyForm);
          setEvents([]);
        }

      })
      .catch((err) => {
        console.error(err);
        setServerError(getApiErrorMessage(err, { action: "load", resource: "figurine data" }));
      })
      .finally(() => setLoadingForm(false));
  }, [id, isEdit]);

  // ── Field helpers ───────────────────────────────────────────────────────────

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setServerError(null);
  };

  const setDistributorField = (i: number, key: keyof DistributorEntry, value: string | boolean) => {
    setForm((prev) => {
      if (!prev) return prev;
      const updated = [...prev.distributors];
      updated[i] = { ...updated[i], [key]: value };
      return { ...prev, distributors: updated };
    });
    setErrors((prev) => ({ ...prev, [`dist_${i}_${key}`]: undefined }));
  };

  const addDistributor = () =>
    setForm((prev) => prev ? { ...prev, distributors: [...prev.distributors, emptyDistributor()] } : prev);

  const removeDistributor = (i: number) =>
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, distributors: prev.distributors.filter((_, idx) => idx !== i) };
    });

  const setImageUrl = (i: number, value: string) => {
    setImgErrors((prev) => ({ ...prev, [i]: false }));
    setForm((prev) => {
      if (!prev) return prev;
      const updated = [...prev.officialImageUrls];
      updated[i] = value;
      return { ...prev, officialImageUrls: updated };
    });
  };

  const addImageUrl = () =>
    setForm((prev) => prev ? { ...prev, officialImageUrls: [...prev.officialImageUrls, ""] } : prev);

  const removeImageUrl = (i: number) =>
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, officialImageUrls: prev.officialImageUrls.filter((_, idx) => idx !== i) };
    });

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (!form) return false;
    const newErrors: FormErrors = {};
    if (!form.name.trim())    newErrors.name    = "Name is required";
    if (!form.lineUpId)       newErrors.lineUpId = "Line Up is required";
    if (!form.seriesId)       newErrors.seriesId = "Series is required";

    form.distributors.forEach((d, i) => {
      if (!d.distributorId) return;

      const priceRaw = d.price.trim();
      const priceValue = Number(priceRaw);

      if (!Number.isFinite(priceValue) || priceValue < 0) {
        newErrors[`dist_${i}_price`] = "Price must be a valid number";
        return;
      }

      if (!isPriceIntegerPartWithinLimit(priceRaw)) {
        newErrors[`dist_${i}_price`] = `Price integer part cannot exceed ${MAX_PRICE_INTEGER_PART}`;
      }
    });

    form.officialImageUrls.forEach((url, i) => {
      if (url.trim()) {
        try {
          const u = new URL(url.trim());
          if (u.protocol !== "http:" && u.protocol !== "https:")
            newErrors[`imageUrl_${i}`] = "Must start with http:// or https://";
        } catch {
          newErrors[`imageUrl_${i}`] = "Must be a valid URL";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteFigurine(Number(id));
      navigate("/figurines", { replace: true, state: { deleted: true } });
    } catch (err) {
      setServerError(getApiErrorMessage(err, { action: "delete", resource: "figurine" }));
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !form) return;
    setSaving(true);

    const distributorPayload = form.distributors
      // Ignore blank distributor rows so optional fields do not block submit.
      .filter((d) => Boolean(d.distributorId))
      .map((d) => ({
        supplierId: Number(d.distributorId),
        currency: d.currency || "JPY",
        price: d.price.trim() ? Number(d.price) : null,
        preorderOpensAt: d.preorderOpensAt.trim() || null,
        announcedAt: d.announcedAt.trim() || null,
        releaseDate: d.releaseDate.trim() || null,
        releaseDateConfirmed: d.releaseDateConfirmed,
      }));

    const payload = {
      name:                  form.name.trim(),
      lineUpId:              Number(form.lineUpId),
      seriesId:              Number(form.seriesId),
      ...(form.groupId ? { groupId: Number(form.groupId) } : {}),
      ...(form.anniversaryId ? { anniversaryId: Number(form.anniversaryId) } : {}),
      isMetalBody:           form.isMetalBody,
      isOriginalColorEdition:form.isOriginalColorEdition,
      isRevival:             form.isRevival,
      isPlainCloth:          form.isPlainCloth,
      isBattleDamaged:       form.isBattleDamaged,
      isGoldenArmor:         form.isGoldenArmor,
      isGold24kEdition:      form.isGold24kEdition,
      isMangaVersion:        form.isMangaVersion,
      isMultiPack:           form.isMultiPack,
      isArticulable:         form.isArticulable,
      notes:                 form.notes.trim() || null,
      officialImageUrls:     form.officialImageUrls.filter((u) => u.trim()),
      distributors:          distributorPayload,
    };

    try {
      if (isEdit) {
        await updateFigurine(Number(id), payload);
        setSuccessMessage("Figurine updated successfully.");
        setSuccessRedirectPath(`/figurines/${id}`);
      } else {
        const created = await createFigurine(payload);
        setSuccessMessage("Figurine created successfully.");
        setSuccessRedirectPath(`/figurines/${created.id}`);
      }
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.data) {
        const body = err.response.data as Record<string, unknown>;
        setServerError(
          (body.detail as string) ??
            getApiErrorMessage(err, { action: isEdit ? "update" : "create", resource: "figurine" }),
        );
      } else {
        setServerError(getApiErrorMessage(err, { action: isEdit ? "update" : "create", resource: "figurine" }));
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loadingForm || !form) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 3 }}>
        <Tooltip title="Back">
          <IconButton
            onClick={() => isEdit ? navigate(-1) : navigate("/figurines")}
            sx={{ mt: 0.5 }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <AppPageHeader
            eyebrow="Figurines"
            title={isEdit ? "Edit Figurine" : "New Figurine"}
            subtitle={isEdit ? "Update figurine details, media, distributors, and timeline events." : "Create a new figurine record with media, distributor pricing, and release data."}
            compact
            actions={isEdit ? (
              <Button
                variant="outlined"
                startIcon={<EventOutlinedIcon />}
                onClick={() => setEventsModalOpen(true)}
              >
                Manage Events
              </Button>
            ) : undefined}
          />
        </Box>
      </Box>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {serverError && (
            <Alert severity="error" onClose={() => setServerError(null)}>{serverError}</Alert>
          )}

          {/* ── Myth Cloth ── */}
          <SectionLabel>Myth Cloth</SectionLabel>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            required fullWidth
            error={Boolean(errors.name)}
            helperText={errors.name}
            slotProps={{ htmlInput: { maxLength: 150 } }}
          />

          <Grid container spacing={2}>
            {([
              { key: "lineUpId", label: "Line Up",  items: lineups      },
              { key: "seriesId", label: "Series",   items: seriesList   },
              { key: "groupId",  label: "Group",    items: groups       },
            ] as { key: "lineUpId" | "seriesId" | "groupId"; label: string; items: Catalog[] }[]).map(({ key, label, items }) => (
              <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  select fullWidth
                  required={key !== "groupId"}
                  label={label}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  error={Boolean(errors[key])}
                  helperText={errors[key]}
                >
                  {key === "groupId" && <MenuItem value=""><em>None</em></MenuItem>}
                  {items.map((it) => (
                    <MenuItem key={it.id} value={String(it.id)}>{it.description}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            ))}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Anniversary"
                value={form.anniversaryId}
                onChange={(e) => setField("anniversaryId", e.target.value)}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {anniversaries.map((it) => (
                  <MenuItem key={it.id} value={String(it.id)}>{it.description}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {/* ── Attributes ── */}
          <SectionLabel>Attributes</SectionLabel>
          <Grid container spacing={0}>
            {BOOL_FIELDS.map(({ key, label }) => (
              <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form[key] as boolean}
                      onChange={(e) => setField(key, e.target.checked)}
                      sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                    />
                  }
                  label={<Typography variant="body2">{label}</Typography>}
                />
              </Grid>
            ))}
          </Grid>

          {/* ── Notes ── */}
          <SectionLabel>Notes</SectionLabel>
          <TextField
            label="Notes"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            fullWidth multiline rows={3}
            slotProps={{ htmlInput: { maxLength: 1500 } }}
          />

          {/* ── Image URLs ── */}
          <SectionLabel>Official Image URLs</SectionLabel>
          <Grid container spacing={2}>
            {form.officialImageUrls.map((url, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper
                  variant="outlined"
                  sx={{ borderColor: errors[`imageUrl_${i}`] ? "error.main" : "rgba(212,175,55,0.15)", borderRadius: 2, overflow: "hidden" }}
                >
                  {/* Preview area */}
                  <Box
                    sx={{
                      height: 220,
                      backgroundColor: "rgba(0,0,0,0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {url.trim() && !imgErrors[i] ? (
                      <Box
                        component="img"
                        src={url.trim()}
                        alt={`Image ${i + 1}`}
                        onError={() => setImgErrors((prev) => ({ ...prev, [i]: true }))}
                        sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, opacity: 0.4 }}>
                        <ImageNotSupportedOutlinedIcon sx={{ fontSize: 48 }} />
                        <Typography variant="caption">
                          {url.trim() && imgErrors[i] ? "Failed to load" : "No image"}
                        </Typography>
                      </Box>
                    )}
                    {/* Badge */}
                    <Box
                      sx={{
                        position: "absolute", top: 8, left: 8,
                        bgcolor: "rgba(0,0,0,0.6)", borderRadius: 1,
                        px: 1, py: 0.25,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
                        #{i + 1}
                      </Typography>
                    </Box>
                    {/* Remove button */}
                    {form.officialImageUrls.length > 1 && (
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          onClick={() => removeImageUrl(i)}
                          sx={{
                            position: "absolute", top: 4, right: 4,
                            bgcolor: "rgba(0,0,0,0.55)",
                            color: "error.main",
                            "&:hover": { bgcolor: "rgba(180,0,0,0.3)" },
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  {/* URL input */}
                  <Box sx={{ p: 1.5 }}>
                    <TextField
                      size="small"
                      value={url}
                      onChange={(e) => setImageUrl(i, e.target.value)}
                      fullWidth
                      placeholder="https://example.com/image.jpg"
                      error={Boolean(errors[`imageUrl_${i}`])}
                      helperText={errors[`imageUrl_${i}`]}
                      slotProps={{ htmlInput: { maxLength: 512 } }}
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}

            {/* Add new card */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                variant="outlined"
                onClick={addImageUrl}
                sx={{
                  height: "100%",
                  minHeight: 280,
                  borderColor: "rgba(212,175,55,0.15)",
                  borderRadius: 2,
                  borderStyle: "dashed",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  cursor: "pointer",
                  transition: "border-color 0.2s, background-color 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    backgroundColor: "rgba(212,175,55,0.05)",
                  },
                }}
              >
                <AddIcon sx={{ color: "primary.main", fontSize: 32 }} />
                <Typography variant="body2" sx={{ color: "primary.main" }}>Add Image</Typography>
              </Paper>
            </Grid>
          </Grid>
          {/* ── Distributors ── */}
          <SectionLabel>Distributors</SectionLabel>
          {form.distributors.map((d, i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{ p: 2, borderColor: "rgba(212,175,55,0.15)", position: "relative" }}
            >
              {form.distributors.length > 1 && (
                <Tooltip title="Remove distributor">
                  <IconButton
                    size="small"
                    onClick={() => removeDistributor(i)}
                    sx={{ position: "absolute", top: 8, right: 8, color: "error.main" }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select fullWidth
                    label="Distributor"
                    value={d.distributorId}
                    onChange={(e) => setDistributorField(i, "distributorId", e.target.value)}
                    error={Boolean(errors[`dist_${i}_id`])}
                    helperText={errors[`dist_${i}_id`]}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {distributors.map((dist) => (
                      <MenuItem key={dist.id} value={String(dist.id)}>{dist.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    select fullWidth
                    label="Currency"
                    value={d.currency}
                    onChange={(e) => setDistributorField(i, "currency", e.target.value)}
                    error={Boolean(errors[`dist_${i}_currency`])}
                    helperText={errors[`dist_${i}_currency`]}
                  >
                    {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    label="Price"
                    type="number"
                    fullWidth
                    required={Boolean(d.distributorId)}
                    value={d.price}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      if (PRICE_INPUT_PATTERN.test(nextValue) && isPriceIntegerPartWithinLimit(nextValue)) {
                        setDistributorField(i, "price", nextValue);
                      }
                    }}
                    error={Boolean(errors[`dist_${i}_price`])}
                    helperText={errors[`dist_${i}_price`]}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            {CURRENCY_SYMBOLS[d.currency] ?? d.currency}
                          </InputAdornment>
                        ),
                      },
                      htmlInput: { min: 0.01, step: "0.01" },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Announced At"
                    format="YYYY-MM-DD"
                    value={d.announcedAt ? dayjs(d.announcedAt) : null}
                    onChange={(value) => setDistributorField(i, "announcedAt", value ? value.format("YYYY-MM-DD") : "")}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Pre-order Opens"
                    format="YYYY-MM-DD"
                    value={d.preorderOpensAt ? dayjs(d.preorderOpensAt) : null}
                    onChange={(value) => setDistributorField(i, "preorderOpensAt", value ? value.format("YYYY-MM-DD") : "")}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Release Date"
                    format="YYYY-MM-DD"
                    value={d.releaseDate ? dayjs(d.releaseDate) : null}
                    onChange={(value) => setDistributorField(i, "releaseDate", value ? value.format("YYYY-MM-DD") : "")}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={d.releaseDateConfirmed}
                        onChange={(e) => setDistributorField(i, "releaseDateConfirmed", e.target.checked)}
                        sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                      />
                    }
                    label={<Typography variant="body2">Release Date Confirmed</Typography>}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
          <Box>
            <Button size="small" startIcon={<AddIcon />} onClick={addDistributor} sx={{ color: "primary.main" }}>
              Add Distributor
            </Button>
          </Box>

          {/* ── Actions ── */}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1 }}>
            {isEdit && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ mr: "auto" }}
              >
                Delete
              </Button>
            )}
            <Button variant="outlined" onClick={() => isEdit ? navigate(-1) : navigate("/figurines")}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving || Boolean(successMessage)}>
              {saving ? <CircularProgress size={20} color="inherit" /> : isEdit ? "Save Changes" : "Create"}
            </Button>
          </Box>

          </Box>
        </Paper>
      </LocalizationProvider>

      {/* Events management modal */}
      <Dialog
        open={eventsModalOpen}
        onClose={() => setEventsModalOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { maxHeight: "85vh" } }}
      >
        <DialogTitle>Manage Events</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={openAddEventDialog}
              sx={{ mb: 1 }}
            >
              Add Event
            </Button>
            <Box sx={{ maxHeight: { xs: "45vh", md: "52vh" }, overflowY: "auto", pr: 0.5 }}>
              {loadingEvents ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Loading events...</Typography>
                </Box>
              ) : events.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No events found.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {events.map((ev) => (
                    <Grid key={ev.id} size={{ xs: 12, sm: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, position: "relative" }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 0.5, pr: 8, overflowWrap: "anywhere", wordBreak: "break-word" }}
                        >
                          {ev.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ pr: 8, display: "block", overflowWrap: "anywhere" }}>
                          {ev.date} | {EVENT_TYPES.find((t) => t.value === ev.type)?.label ?? ev.type} | {EVENT_REGIONS.find((r) => r.value === ev.region)?.label ?? ev.region}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Date {ev.dateConfirmed ? "confirmed" : "unconfirmed"}
                        </Typography>
                        <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditEventDialog(ev)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDeleteEvent(ev.id)} disabled={deletingEventId === ev.id}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Event add/edit modal */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Dialog open={eventDialogOpen} onClose={closeEventDialog} fullWidth maxWidth="sm">
          <DialogTitle>{editingEvent ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField
                label="Description"
                value={eventForm.description}
                onChange={(e) => handleEventFormChange("description", e.target.value)}
                required
                fullWidth
                inputProps={{ maxLength: 100 }}
              />
              <DatePicker
                label="Date"
                format="YYYY-MM-DD"
                disableFuture
                value={eventForm.date ? dayjs(eventForm.date) : null}
                onChange={(value) => handleEventFormChange("date", value ? value.format("YYYY-MM-DD") : "")}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={eventForm.dateConfirmed}
                    onChange={(e) => handleEventFormChange("dateConfirmed", e.target.checked)}
                  />
                }
                label="Date Confirmed"
              />
              <TextField
                select
                label="Type"
                value={eventForm.type}
                onChange={(e) => handleEventFormChange("type", e.target.value as FigurineEventType)}
                fullWidth
              >
                {EVENT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Region"
                value={eventForm.region}
                onChange={(e) => handleEventFormChange("region", e.target.value as FigurineEventRegion)}
                fullWidth
              >
                {EVENT_REGIONS.map((r) => (
                  <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                ))}
              </TextField>
              {eventFormError && <Alert severity="error">{eventFormError}</Alert>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEventDialog}>Cancel</Button>
            <Button onClick={handleEventFormSubmit} variant="contained">{editingEvent ? "Save" : "Add"}</Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={1500}
        onClose={() => {
          setSuccessMessage(null);
          if (successRedirectPath) {
            navigate(successRedirectPath, { replace: true });
            setSuccessRedirectPath(null);
          }
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => {
            setSuccessMessage(null);
            if (successRedirectPath) {
              navigate(successRedirectPath, { replace: true });
              setSuccessRedirectPath(null);
            }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Figurine?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete this figurine. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
