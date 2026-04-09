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

import { catalogApiMap } from "../api/catalogApi";
import { CATALOG_META } from "../types/catalog";
import type { CatalogType } from "../types/catalog";

export default function CatalogFormPage() {
  const { catalogType, id } = useParams<{ catalogType: string; id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const api = catalogApiMap[catalogType as CatalogType];
  const meta = CATALOG_META[catalogType as CatalogType];
  const { singular } = meta ?? { singular: "Entry" };

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(isEdit);
  const [descriptionError, setDescriptionError] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !api) return;
    setLoadingForm(true);
    api
      .getById(Number(id))
      .then((data) => setDescription(data.description))
      .catch((err) => {
        console.error(err);
        setServerError("Failed to load entry. Please try again.");
      })
      .finally(() => setLoadingForm(false));
  }, [id, isEdit, catalogType]);

  const validate = (): boolean => {
    if (!description.trim()) {
      setDescriptionError("Description is required");
      return false;
    }
    setDescriptionError(undefined);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !api) return;
    setLoading(true);
    try {
      if (isEdit) {
        await api.update(Number(id), description.trim());
      } else {
        await api.create(description.trim());
      }
      setSuccessMessage(
        isEdit
          ? `${singular} updated successfully.`
          : `${singular} created successfully.`,
      );
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        if (err.response?.data) {
          const body = err.response.data as Record<string, unknown>;
          setServerError(
            (body.detail as string) ??
              `Failed to ${isEdit ? "update" : "create"} ${singular.toLowerCase()}`,
          );
        } else {
          setServerError("Unable to connect to the server. Please check your connection and try again.");
        }
      } else {
        setServerError(`Failed to ${isEdit ? "update" : "create"} ${singular.toLowerCase()}`);
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
        {isEdit ? `Edit ${singular}` : `New ${singular}`}
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
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescriptionError(undefined);
                setServerError(null);
              }}
              required
              fullWidth
              autoFocus
              slotProps={{ htmlInput: { maxLength: 100 } }}
              error={Boolean(descriptionError)}
              helperText={descriptionError}
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1 }}>
              <Button variant="outlined" onClick={() => navigate(`/catalogs/${catalogType}`)}>
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
        onClose={() => { setSuccessMessage(null); navigate(`/catalogs/${catalogType}`); }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
}
