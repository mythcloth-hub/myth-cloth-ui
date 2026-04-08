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
} from "@mui/material";
import axios from "axios";

import { createDistributor, getDistributorById, updateDistributor } from "../api/distributorApi";
import type { Distributor } from "../types/distributor";

type FormData = Omit<Distributor, "id">;

const emptyForm: FormData = {
  name: "",
  description: "",
  country: "",
  website: "",
};

export default function DistributorFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Maps server-side field names to form field names
  const serverFieldMap: Record<string, keyof FormData> = {
    name: "name",
    description: "description",
    country: "country",
    website: "website",
  };

  useEffect(() => {
    if (!isEdit) return;
    getDistributorById(Number(id))
      .then((data) => {
        const { id: _id, ...rest } = data;
        setForm(rest);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load distributor");
      });
  }, [id, isEdit]);

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.description.trim()) newErrors.description = "Description is required";
    if (!form.country.trim()) newErrors.country = "Country code is required";
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
      if (axios.isAxiosError(err) && err.response?.data) {
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

      <Paper sx={{ padding: { xs: 2, sm: 3 }, maxWidth: 600 }}>
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
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={Boolean(errors.name)}
            helperText={errors.name}
            required
            fullWidth
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            error={Boolean(errors.description)}
            helperText={errors.description}
            required
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Country Code"
            name="country"
            value={form.country}
            onChange={handleChange}
            error={Boolean(errors.country)}
            helperText={errors.country ?? "2-letter code, e.g. US, MX, JP"}
            required
            fullWidth
            slotProps={{ htmlInput: { maxLength: 2 } }}
          />
          <TextField
            label="Website"
            name="website"
            value={form.website}
            onChange={handleChange}
            fullWidth
            placeholder="https://example.com"
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
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => { setSuccessMessage(null); navigate("/distributors"); }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
}
