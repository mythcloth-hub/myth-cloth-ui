import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";

import AppPageHeader from "../../../components/AppPageHeader";
import { useAuth } from "../../../auth/AuthContext";
import { loadAllFigurines } from "../../figurines/api/figurineApi";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

export default function FigurineLoaderPage() {
  const { hasPermission } = useAuth();
  const canLoadFigurines = hasPermission("figurines:load");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoad = async () => {
    if (!canLoadFigurines) return;

    setSubmitting(true);
    try {
      const status = await loadAllFigurines();
      if (status === 202) {
        setSuccessMessage("All the figurines were imported.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "figurines from Google Sheets" }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadClick = () => {
    if (!canLoadFigurines || submitting) return;
    setConfirmOpen(true);
  };

  const handleConfirmLoad = async () => {
    setConfirmOpen(false);
    await handleLoad();
  };

  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow="Security"
          title="Figurine Loader"
          subtitle="Trigger a full figurine import from Google Sheets. This process can be executed multiple times."
        />
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: 860 }}>
        <Stack spacing={2.5}>
          <Typography color="text.secondary">
            This option loads all figurines from the shared spreadsheet.
          </Typography>
          <Typography color="text.secondary">
            Use it whenever you want to refresh the figurines in the app.
            Once you click the button, the import starts in the background.
          </Typography>

          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <UploadFileOutlinedIcon />}
              onClick={handleLoadClick}
              disabled={!canLoadFigurines || submitting}
            >
              {submitting ? "Starting Import..." : "Load All Figurines"}
            </Button>
          </Box>

          {!canLoadFigurines && (
            <Alert severity="warning">
              You do not have the required permission: figurines:load
            </Alert>
          )}
        </Stack>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Load All Figurines</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will start importing all figurines from the spreadsheet.
            You can run this process multiple times whenever you need to refresh data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmLoad} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : "Start Import"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={5000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
