import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

import { createDistributor, getDistributorById, updateDistributor } from "../api/distributorApi";
import type { Distributor } from "../types/distributor";

type FormData = Omit<Distributor, "id">;

const emptyForm: FormData = {
  name: "",
  countryCode: "",
  website: "",
};

const DISTRIBUTOR_NAMES: { label: string; value: string }[] = [
  { value: "DAM",              label: "Distribuidora Animéxico" },
  { value: "BANDAI_CHINA",     label: "Tamashii Nations China" },
  { value: "BLUE_FIN",         label: "Bluefin" },
  { value: "BANDAI",           label: "Tamashii Nations" },
  { value: "DS_DISTRIBUTIONS", label: "DS Distribuciones" },
  { value: "DTM",              label: "Distribuidora Toyvision México" },
];

import { countryCodeToFlag } from "../../../utils/countryFlag";

const COUNTRIES: { value: string; label: string }[] = [
  { value: "CN", label: "China" },
  { value: "ES", label: "Spain" },
  { value: "JP", label: "Japan" },
  { value: "MX", label: "Mexico" },
  { value: "US", label: "United States" },
];

export default function DistributorFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(isEdit);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Maps server-side field names to form field names
  const serverFieldMap: Record<string, keyof FormData> = {
    name: "name",
    countryCode: "countryCode",
    website: "website",
  };

  useEffect(() => {
    if (!isEdit) return;
    setLoadingForm(true);
    getDistributorById(Number(id))
      .then((data) => {
        setForm({
          name: data.name,
          countryCode: data.countryCode,
          website: data.website ?? "",
        });
      })
      .catch((err) => {
        console.error(err);
        setServerError("Failed to load distributor. Please try again.");
      })
      .finally(() => setLoadingForm(false));
  }, [id, isEdit]);

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.countryCode.trim()) newErrors.countryCode = "Country is required";
    if (form.website?.trim()) {
      try {
        const url = new URL(form.website.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          newErrors.website = "Website must start with http:// or https://";
        }
      } catch {
        newErrors.website = "Website must be a valid URL (e.g. https://example.com)";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await updateDistributor(Number(id), { id: Number(id), ...form });
      } else {
        await createDistributor({ id: 0, ...form });
      }
      setSuccessMessage(isEdit ? "Distributor updated successfully." : "Distributor created successfully.");
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        if (err.response?.data) {
          const body = err.response.data as Record<string, unknown>;
          if (body.errors && typeof body.errors === "object") {
            const fieldErrors: Partial<FormData> = {};
            for (const [key, message] of Object.entries(body.errors as Record<string, string>)) {
              const formField = serverFieldMap[key];
              if (formField) fieldErrors[formField] = message;
            }
            setErrors((prev) => ({ ...prev, ...fieldErrors }));
          } else {
            setServerError((body.detail as string) ?? `Failed to ${isEdit ? "update" : "create"} distributor`);
          }
        } else {
          setServerError("Unable to connect to the server. Please check your connection and try again.");
        }
      } else {
        setServerError(`Failed to ${isEdit ? "update" : "create"} distributor`);
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
        {isEdit ? "Edit Distributor" : "New Distributor"}
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
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" && (e.target as HTMLElement).getAttribute("role") !== "combobox") {
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {serverError && (
            <Alert severity="error" onClose={() => setServerError(null)}>
              {serverError}
            </Alert>
          )}
          <FormControl required fullWidth error={Boolean(errors.name)}>
            <InputLabel id="name-label">Name</InputLabel>
            <Select
              labelId="name-label"
              label="Name"
              name="name"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                setErrors((prev) => ({ ...prev, name: undefined }));
                setServerError(null);
              }}
            >
              {DISTRIBUTOR_NAMES.map(({ value, label }) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
            {errors.name && <FormHelperText>{errors.name}</FormHelperText>}
          </FormControl>
          <FormControl required fullWidth error={Boolean(errors.countryCode)}>
            <InputLabel id="country-label">Country</InputLabel>
            <Select
              labelId="country-label"
              label="Country"
              name="countryCode"
              value={form.countryCode}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, countryCode: e.target.value }));
                setErrors((prev) => ({ ...prev, countryCode: undefined }));
                setServerError(null);
              }}
            >
              {COUNTRIES.map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                  <span style={{ marginRight: 8 }}>{countryCodeToFlag(value)}</span>
                  {label}
                </MenuItem>
              ))}
            </Select>
            {errors.countryCode && <FormHelperText>{errors.countryCode}</FormHelperText>}
          </FormControl>
          <TextField
            label="Website"
            name="website"
            value={form.website}
            onChange={handleChange}
            fullWidth
            placeholder="https://example.com"
            slotProps={{ htmlInput: { maxLength: 150 } }}
            error={Boolean(errors.website)}
            helperText={errors.website}
          />
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1 }}>
            <Button variant="outlined" onClick={() => navigate("/distributors")}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading || Boolean(successMessage)}>
              {isEdit ? "Update" : "Create"}
            </Button>
          </Box>
        </Box>
      </Paper>
      )}
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={1500}
        onClose={() => { setSuccessMessage(null); navigate("/distributors"); }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
}
