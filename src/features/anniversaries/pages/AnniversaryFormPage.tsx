import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

import {
  createAnniversary,
  getAnniversaryById,
  updateAnniversary,
  type SaveAnniversaryPayload,
  type UpdateAnniversaryPayload,
} from "../api/anniversaryApi";
import type { Anniversary, AnniversaryType } from "../types/anniversary";

const ANNIVERSARY_TYPE_OPTIONS: { value: AnniversaryType; label: string }[] = [
  { value: "TAMASHII_NATIONS_WORLD_TOUR", label: "Tamashii Nations World Tour" },
  { value: "SAINT_CLOTH_MYTH", label: "Saint Cloth Myth" },
  { value: "SAINT_SEIYA", label: "Saint Seiya" },
];

type FormData = { description: string; year: string; type: "" | AnniversaryType };
type FormErrors = Partial<Record<keyof FormData, string>>;

const emptyForm: FormData = { description: "", year: "", type: "" };

export default function AnniversaryFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const location = useLocation();
  const navigate = useNavigate();
  const stateAnniversary = (location.state as { anniversary?: Anniversary } | null)?.anniversary;

  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(isEdit);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Maps server-side field names to form field names
  const serverFieldMap: Record<string, keyof FormData> = {
    description: "description",
    year: "year",
    type: "type",
  };

  useEffect(() => {
    if (!isEdit) return;
    setLoadingForm(true);
    getAnniversaryById(Number(id))
      .then((data) =>
        setForm({
          description: data.description,
          year: String(data.year),
          type: data.type ?? stateAnniversary?.type ?? "",
        }),
      )
      .catch((err) => {
        console.error(err);
        setServerError("Failed to load anniversary. Please try again.");
      })
      .finally(() => setLoadingForm(false));
  }, [id, isEdit, stateAnniversary?.type]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.description.trim()) newErrors.description = "Description is required";
    const parsedYear = Number(form.year);
    if (!form.year.trim()) {
      newErrors.year = "Year is required";
    } else if (!Number.isInteger(parsedYear) || parsedYear < 10 || parsedYear > 100) {
      newErrors.year = "Year must be a valid number between 10 and 100";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
  };

  const handleTypeChange = (value: string) => {
    setForm((prev) => ({ ...prev, type: value as FormData["type"] }));
    setErrors((prev) => ({ ...prev, type: undefined }));
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const payload: SaveAnniversaryPayload = {
      description: form.description.trim(),
      year: form.year.trim(),
      ...(form.type ? { type: form.type } : {}),
    };
    try {
      if (isEdit) {
        const updatePayload: UpdateAnniversaryPayload = {
          id: Number(id),
          ...payload,
        };
        await updateAnniversary(Number(id), updatePayload);
      } else {
        await createAnniversary(payload);
      }
      setSuccessMessage(
        isEdit ? "Anniversary updated successfully." : "Anniversary created successfully.",
      );
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        if (err.response?.data) {
          const body = err.response.data as Record<string, unknown>;
          if (body.errors && typeof body.errors === "object") {
            const fieldErrors: FormErrors = {};
            for (const [key, message] of Object.entries(body.errors as Record<string, string>)) {
              const formField = serverFieldMap[key];
              if (formField) fieldErrors[formField] = message;
            }
            setErrors((prev) => ({ ...prev, ...fieldErrors }));
          } else {
            setServerError(
              (body.detail as string) ??
                `Failed to ${isEdit ? "update" : "create"} anniversary`,
            );
          }
        } else {
          setServerError("Unable to connect to the server. Please check your connection and try again.");
        }
      } else {
        setServerError(`Failed to ${isEdit ? "update" : "create"} anniversary`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
      <Typography
        variant="h4"
        sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }}
        gutterBottom
      >
        {isEdit ? "Edit Anniversary" : "New Anniversary"}
      </Typography>

      {loadingForm ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ padding: { xs: 2, sm: 3 } }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {serverError && (
              <Alert severity="error" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            )}
            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              fullWidth
              autoFocus
              slotProps={{ htmlInput: { maxLength: 150 } }}
              error={Boolean(errors.description)}
              helperText={errors.description}
            />
            <TextField
              label="Year"
              name="year"
              value={form.year}
              onChange={handleChange}
              required
              fullWidth
              type="number"
              slotProps={{ htmlInput: { min: 10, max: 100 } }}
              error={Boolean(errors.year)}
              helperText={errors.year}
            />
            <FormControl fullWidth error={Boolean(errors.type)}>
              <InputLabel id="anniversary-type-label">Type</InputLabel>
              <Select
                labelId="anniversary-type-label"
                label="Type"
                name="type"
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {ANNIVERSARY_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.type ?? "Optional"}</FormHelperText>
            </FormControl>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1 }}>
              <Button variant="outlined" onClick={() => navigate("/anniversaries")}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || Boolean(successMessage)}
              >
                {isEdit ? "Update" : "Create"}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={1500}
        onClose={() => { setSuccessMessage(null); navigate("/anniversaries"); }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
}
