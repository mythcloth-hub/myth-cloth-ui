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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import axios from "axios";
import dayjs from "dayjs";

import { getFigurineById, createFigurine, updateFigurine, deleteFigurine } from "../api/figurineApi";
import { groupsApi, lineupsApi, seriesApi } from "../../catalogs/api/catalogApi";
import { getAllDistributors } from "../../distributors/api/distributorApi";
import type { Catalog } from "../../catalogs/types/catalog";
import type { Distributor } from "../../distributors/types/distributor";
import type { Figurine } from "../types/figurine";

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
const PRICE_SUBMIT_PATTERN = /^\d+(\.\d{1,2})?$/;
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
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // catalog options
  const [lineups,      setLineups]      = useState<Catalog[]>([]);
  const [seriesList,   setSeriesList]   = useState<Catalog[]>([]);
  const [groups,       setGroups]       = useState<Catalog[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);

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
      getAllDistributors(),
    ];
    const requests = isEdit
      ? [...catalogRequests, getFigurineById(Number(id))]
      : catalogRequests;

    Promise.all(requests)
      .then((results) => {
        const [lu, sr, gr, dist, fig] = results;
        setLineups(lu as Catalog[]);
        setSeriesList(sr as Catalog[]);
        setGroups(gr as Catalog[]);
        setDistributors(dist as Distributor[]);

        if (isEdit && fig) {
          const f = fig as Figurine;
          setForm({
            name:                  f.name,
            lineUpId:              String(f.lineUp.id),
            seriesId:              String(f.series.id),
            groupId:               f.group ? String(f.group.id) : "",
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
        } else {
          setForm(emptyForm);
        }
      })
      .catch((err) => {
        console.error(err);
        setServerError("Failed to load data.");
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
      //if (!priceRaw || priceValue === 0) {
      //  newErrors[`dist_${i}_price`] = "Price is required";
      //  return;
      //}

      if (!Number.isFinite(priceValue) || priceValue < 0) {
        newErrors[`dist_${i}_price`] = "Price must be a valid number";
        return;
      }

      //if (!PRICE_SUBMIT_PATTERN.test(priceRaw)) {
      //  newErrors[`dist_${i}_price`] = "Price can include up to 2 decimals";
      //  return;
      //}

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
    } catch {
      setServerError("Failed to delete figurine.");
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
        setServerError((body.detail as string) ?? `Failed to ${isEdit ? "update" : "create"} figurine.`);
      } else {
        setServerError(`Failed to ${isEdit ? "update" : "create"} figurine.`);
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Tooltip title="Back">
          <IconButton
            onClick={() => isEdit ? navigate(-1) : navigate("/figurines")}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.4rem", md: "2rem" } }}>
          {isEdit ? "Edit Figurine" : "New Figurine"}
        </Typography>
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
              <Grid key={key} size={{ xs: 12, sm: 4 }}>
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
            slotProps={{ htmlInput: { maxLength: 500 } }}
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
