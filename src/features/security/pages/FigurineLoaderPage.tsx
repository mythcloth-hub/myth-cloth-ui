import { useEffect, useState } from "react";
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
  FormControlLabel,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import type { GridColDef } from "@mui/x-data-grid";

import AppPageHeader from "../../../components/AppPageHeader";
import { useAuth } from "../../../auth/AuthContext";
import { getFigurineImportRecords, loadAllFigurines } from "../../figurines/api/figurineApi";
import type { FigurineImportRecord } from "../../figurines/types/figurine";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import ScrollableHintDataGrid from "../../../components/ScrollableHintDataGrid";

function formatImportCompletedAt(dateTime: string): string {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  return date.toLocaleString();
}

function ImportHistoryNoRows() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 1 }}>
      <Typography variant="body1" color="text.secondary">
        No figurine imports yet.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Run an import to start building the history.
      </Typography>
    </Box>
  );
}

export default function FigurineLoaderPage() {
  const { hasPermission } = useAuth();
  const canLoadFigurines = hasPermission("figurines:load");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [importRecords, setImportRecords] = useState<FigurineImportRecord[]>([]);
  const [importRecordsLoading, setImportRecordsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const gridHeightOffset = canLoadFigurines ? 300 : 360;

  const loadImportRecords = async () => {
    setImportRecordsLoading(true);
    try {
      const records = await getFigurineImportRecords();
      setImportRecords(records);
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "figurine import history" }));
    } finally {
      setImportRecordsLoading(false);
    }
  };

  useEffect(() => {
    void loadImportRecords();
  }, []);

  const handleLoad = async () => {
    if (!canLoadFigurines) return;

    setSubmitting(true);
    try {
      const status = await loadAllFigurines(overwriteExisting);
      if (status === 202) {
        setSuccessMessage("All the figurines were imported.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "figurines from Google Sheets" }));
    } finally {
      await loadImportRecords();
      setSubmitting(false);
    }
  };

  const handleLoadClick = () => {
    if (!canLoadFigurines || submitting) return;
    setOverwriteExisting(false);
    setConfirmOpen(true);
  };

  const handleConfirmLoad = async () => {
    setConfirmOpen(false);
    await handleLoad();
  };

  const handleCloseConfirm = () => {
    setConfirmOpen(false);
    setOverwriteExisting(false);
  };

  const importColumns: GridColDef<FigurineImportRecord>[] = [
    {
      field: "imported",
      headerName: "Imported",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "skipped",
      headerName: "Skipped",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "errorMessage",
      headerName: "Error Message",
      flex: 2,
      minWidth: 220,
      valueGetter: (value) => value || "-",
      renderCell: (params) => (
        <Tooltip title={params.row.errorMessage || "No errors"}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "completedAt",
      headerName: "Completed At",
      flex: 2,
      minWidth: 220,
      valueGetter: (_value, row) => formatImportCompletedAt(row.completedAt),
      renderCell: (params) => (
        <Tooltip title={params.row.completedAt}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow="Security"
          title="Figurine Loader"
          subtitle="Trigger figurine imports from Google Sheets and review previous import runs."
          actions={(
            <Button
              variant="contained"
              color="primary"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <UploadFileOutlinedIcon />}
              onClick={handleLoadClick}
              disabled={!canLoadFigurines || submitting}
            >
              {submitting ? "Starting Import..." : "Load All Figurines"}
            </Button>
          )}
        />
      </Box>

      <Stack spacing={2} sx={{ mb: 2 }}>
        <Typography color="text.secondary">
          Use this page whenever you need to refresh figurines in the app. Each run is recorded in the import history list.
        </Typography>
        {!canLoadFigurines && (
          <Alert severity="warning">
            You do not have the required permission: figurines:load
          </Alert>
        )}
      </Stack>

      <ScrollableHintDataGrid
        containerStyle={{ height: `calc(100vh - ${gridHeightOffset}px)`, minHeight: 260, width: "100%" }}
        rows={importRecords}
        columns={importColumns}
        loading={importRecordsLoading}
        getRowId={(row) => row.id}
        disableRowSelectionOnClick
        slots={{ noRowsOverlay: ImportHistoryNoRows }}
        initialState={{
          sorting: {
            sortModel: [{ field: "completedAt", sort: "desc" }],
          },
        }}
        sx={{ "& .MuiDataGrid-row": { cursor: "default" } }}
      />

      <Dialog open={confirmOpen} onClose={handleCloseConfirm}>
        <DialogTitle>Load All Figurines</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will start importing all figurines from the spreadsheet.
            You can run this process multiple times whenever you need to refresh data.
          </DialogContentText>
          <FormControlLabel
            sx={{ mt: 2, alignItems: "flex-start" }}
            control={
              <Checkbox
                checked={overwriteExisting}
                onChange={(event) => setOverwriteExisting(event.target.checked)}
                disabled={submitting}
              />
            }
            label={
              <Stack spacing={0.5}>
                <Typography variant="body2" fontWeight={600}>
                  Overwrite existing figurines
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  When enabled, this will replace the figurines that already exist in the app.
                </Typography>
              </Stack>
            }
          />
          {overwriteExisting && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Warning: this will override all existing figurines when the import runs.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} disabled={submitting}>
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
