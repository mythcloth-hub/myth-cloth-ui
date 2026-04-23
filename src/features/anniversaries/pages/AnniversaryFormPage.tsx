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
  CircularProgress,
} from "@mui/material";
import axios from "axios";

import { createAnniversary, getAnniversaryById, updateAnniversary } from "../api/anniversaryApi";

type FormData = { description: string; year: string };
type FormErrors = Partial<Record<keyof FormData, string>>;

const emptyForm: FormData = { description: "", year: "" };

export default function AnniversaryFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

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
  };

  useEffect(() => {
    if (!isEdit) return;
    setLoadingForm(true);
    getAnniversaryById(Number(id))
      .then((data) =>
        setForm({ description: data.description, year: String(data.year) }),
      )
      .catch((err) => {
        console.error(err);
        setServerError("Failed to load anniversary. Please try again.");
      })
      .finally(() => setLoadingForm(false));
  }, [id, isEdit]);

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
    const payload = { description: form.description.trim(), year: Number(form.year) };
    try {
      if (isEdit) {
        await updateAnniversary(Number(id), payload);
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
