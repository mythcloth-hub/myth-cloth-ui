import { useEffect, useState } from "react";
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
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
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
      const status = await loadAllFigurines();
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
    setConfirmOpen(true);
  };

  const handleConfirmLoad = async () => {
    setConfirmOpen(false);
    await handleLoad();
  };

  const handleCloseConfirm = () => {
    setConfirmOpen(false);
  };

  const importColumns: GridColDef<FigurineImportRecord>[] = [
    {
      field: "status",
      headerName: "Status",
      width: 100,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const hasError = Boolean(params.row.errorMessage);
        return hasError ? (
          <Tooltip title="Import completed with errors">
            <ErrorOutlineOutlinedIcon color="error" fontSize="small" />
          </Tooltip>
        ) : (
          <Tooltip title="Import completed successfully">
            <CheckCircleOutlineOutlinedIcon sx={{ color: "success.main" }} fontSize="small" />
          </Tooltip>
        );
      },
    },
    {
      field: "imported",
      headerName: "Imported",
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
          eyebrow="Administration"
          title="Figurine Import"
          subtitle="Trigger figurine imports from Google Sheets and review previous import runs."
          actions={(
            <Button
              variant="contained"
              color="primary"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <UploadFileOutlinedIcon />}
              onClick={handleLoadClick}
              disabled={!canLoadFigurines || submitting}
            >
              {submitting ? "Importing..." : "Load All Figurines"}
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
          <Alert severity="warning" sx={{ mt: 2 }}>
            Warning: this process will override existing figurines when the import runs.
          </Alert>
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
