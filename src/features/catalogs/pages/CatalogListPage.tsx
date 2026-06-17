import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import type { GridColDef } from "@mui/x-data-grid";

import { catalogApiMap } from "../api/catalogApi";
import { CATALOG_META } from "../types/catalog";
import type { Catalog, CatalogType } from "../types/catalog";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

export default function CatalogListPage() {
  const { catalogType } = useParams<{ catalogType: string }>();
  const navigate = useNavigate();

  const api = catalogApiMap[catalogType as CatalogType];
  const meta = CATALOG_META[catalogType as CatalogType];
  const { plural, singular } = meta ?? { plural: "Entries", singular: "Entry" };

  const [items, setItems] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    if (!api) { setLoading(false); return; }
    try {
      const data = await api.getAll();
      setItems(data);
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: plural }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setItems([]);
    loadData();
  }, [catalogType]);

  const handleDeleteClick = (id: number) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId === null || !api) return;
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await api.remove(pendingDeleteId);
      await loadData();
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "delete", resource: singular }));
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const NoRowsOverlay = useMemo(
    () => () => (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 1 }}>
        <Typography variant="body1" color="text.secondary">No {plural.toLowerCase()} yet.</Typography>
        <Typography variant="body2" color="text.secondary">Click + Add {singular} to get started.</Typography>
      </Box>
    ),
    [plural, singular],
  );

  const columns: GridColDef[] = [
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => navigate(`/catalogs/${catalogType}/edit/${params.row.id}`)}
              sx={{ color: "primary.main", "&:hover": { color: "primary.light" } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(params.row.id)}
              sx={{ color: "error.main", "&:hover": { color: "error.light" } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }}>
          {plural}
        </Typography>
        <Button variant="contained" onClick={() => navigate(`/catalogs/${catalogType}/new`)}>
          + Add {singular}
        </Button>
      </Box>

      <div style={{ height: "calc(100vh - 220px)", minHeight: 300, width: "100%" }}>
        <DataGrid
          rows={items}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          onRowDoubleClick={(params) => navigate(`/catalogs/${catalogType}/edit/${params.row.id}`)}
          slots={{ noRowsOverlay: NoRowsOverlay }}
          sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
        />
      </div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete {singular}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this entry? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          {singular} deleted successfully.
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
