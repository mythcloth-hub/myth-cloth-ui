import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

import { getAllAnniversaries, deleteAnniversary } from "../api/anniversaryApi";
import type { Anniversary } from "../types/anniversary";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

const anniversaryTypeLabels: Record<NonNullable<Anniversary["type"]>, string> = {
  TAMASHII_NATIONS_WORLD_TOUR: "Tamashii Nations World Tour",
  SAINT_CLOTH_MYTH: "Saint Cloth Myth",
  SAINT_SEIYA: "Saint Seiya",
};

function getAnniversaryTypeLabel(type?: Anniversary["type"]) {
  if (!type) return "";
  return anniversaryTypeLabels[type] ?? type;
}

function NoRowsOverlay() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 1 }}>
      <Typography variant="body1" color="text.secondary">No anniversaries yet.</Typography>
      <Typography variant="body2" color="text.secondary">Click + Add Anniversary to get started.</Typography>
    </Box>
  );
}

export default function AnniversaryListPage() {
  const [items, setItems] = useState<Anniversary[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const data = await getAllAnniversaries();
      setItems(data);
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "anniversaries" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteClick = (id: number) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const navigateToEdit = (anniversary: Anniversary) => {
    navigate(`/anniversaries/edit/${anniversary.id}`, { state: { anniversary } });
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId === null) return;
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await deleteAnniversary(pendingDeleteId);
      await loadData();
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "delete", resource: "anniversary" }));
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const columns: GridColDef[] = [
    { field: "description", headerName: "Description", flex: 2 },
    { field: "year", headerName: "Year", width: 100 },
    {
      field: "type",
      headerName: "Type",
      minWidth: 220,
      flex: 1,
      valueGetter: (_value, row: Anniversary) => getAnniversaryTypeLabel(row.type),
    },
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
              onClick={() => navigateToEdit(params.row as Anniversary)}
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
          Anniversaries
        </Typography>
        <Button variant="contained" onClick={() => navigate("/anniversaries/new")}>
          + Add Anniversary
        </Button>
      </Box>

      <div style={{ height: "calc(100vh - 220px)", minHeight: 300, width: "100%" }}>
        <DataGrid
          rows={items}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          onRowDoubleClick={(params) => navigateToEdit(params.row as Anniversary)}
          slots={{ noRowsOverlay: NoRowsOverlay }}
          sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
        />
      </div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Anniversary</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this anniversary? This action cannot be undone.
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
          Anniversary deleted successfully.
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
