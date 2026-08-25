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
import AddIcon from "@mui/icons-material/Add";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import { getPermissionById, createPermission, updatePermission } from "../api/permissionApi";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

const PERMISSION_DESCRIPTION_PATTERN = /^[a-z0-9_-]+(:[a-z0-9_-]+)+$/;

export default function PermissionFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(isEdit);
  const [descriptionError, setDescriptionError] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoadingForm(true);
    getPermissionById(Number(id))
      .then((data) => {
        setDescription(data.description);
      })
      .catch((err) => {
        console.error(err);
        setServerError(getApiErrorMessage(err, { action: "load", resource: "permission" }));
      })
      .finally(() => setLoadingForm(false));
  }, [id, isEdit]);

  const validate = (): boolean => {
    const normalizedDescription = description.trim();

    if (!normalizedDescription) {
      setDescriptionError("Description must not be blank.");
      return false;
    }

    if (normalizedDescription.length > 200) {
      setDescriptionError("Description must not exceed 200 characters.");
      return false;
    }

    if (!PERMISSION_DESCRIPTION_PATTERN.test(normalizedDescription)) {
      setDescriptionError(
        "Description must follow 'resource:action[:subaction...]' (e.g., 'posts:create' or 'posts:create:comment') using lowercase letters, numbers, hyphens, or underscores.",
      );
      return false;
    }

    setDescriptionError(undefined);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await updatePermission(Number(id), { description: description.trim() });
      } else {
        await createPermission({ description: description.trim() });
      }
      setSuccessMessage(isEdit ? "Permission updated successfully." : "Permission created successfully.");
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        if (err.response?.data) {
          const body = err.response.data as Record<string, unknown>;
          setServerError(
            (body.detail as string) ??
              getApiErrorMessage(err, { action: isEdit ? "update" : "create", resource: "permission" }),
          );
        } else {
          setServerError(getApiErrorMessage(err, { action: isEdit ? "update" : "create", resource: "permission" }));
        }
      } else {
        setServerError(getApiErrorMessage(err, { action: isEdit ? "update" : "create", resource: "permission" }));
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
        {isEdit ? "Edit Permission" : "New Permission"}
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
              slotProps={{ htmlInput: { maxLength: 200 } }}
              error={Boolean(descriptionError)}
              helperText={descriptionError ?? "Use format resource:action[:subaction...] (lowercase, numbers, '-' or '_')."}
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1 }}>
              <Button variant="outlined" startIcon={<CancelOutlinedIcon />} onClick={() => navigate("/security/permissions")}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || Boolean(successMessage)}
                startIcon={isEdit ? <SaveOutlinedIcon /> : <AddIcon />}
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
        onClose={() => {
          setSuccessMessage(null);
          navigate("/security/permissions");
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
}