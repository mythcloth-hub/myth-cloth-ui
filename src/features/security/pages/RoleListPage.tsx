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

import { getAllRoles, deleteRole } from "../api/roleApi";
import type { Role } from "../types/role";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import AppPageHeader from "../../../components/AppPageHeader";

function CustomNoRowsOverlay() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 1 }}>
      <Typography variant="body1" color="text.secondary">No roles yet.</Typography>
      <Typography variant="body2" color="text.secondary">Click + Add Role to get started.</Typography>
    </Box>
  );
}

export default function RoleListPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const data = await getAllRoles();
      setRoles(data);
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "roles" }));
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

  const handleConfirmDelete = async () => {
    if (pendingDeleteId === null) return;
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await deleteRole(pendingDeleteId);
      await loadData();
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "delete", resource: "role" }));
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "description",
      headerName: "Description",
      flex: 3,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => navigate(`/security/roles/edit/${params.row.id}`)}
              sx={{ color: "primary.main", "&:hover": { color: "primary.light" } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <span>
                <IconButton
                size="small"
                onClick={() => handleDeleteClick(params.row.id)}
                disabled={true}
                sx={{ color: "error.main", "&:hover": { color: "error.light" } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
            </span>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow="Security"
          title="Roles"
          subtitle="Manage role definitions used to control access across the application."
          actions={<Button variant="contained" onClick={() => navigate("/security/roles/new")}>+ Add Role</Button>}
        />
      </Box>

      <div style={{ height: "calc(100vh - 220px)", minHeight: 300, width: "100%" }}>
        <DataGrid
          rows={roles}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          onRowDoubleClick={(params) => navigate(`/security/roles/edit/${params.row.id}`)}
          slots={{ noRowsOverlay: CustomNoRowsOverlay }}
          sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
        />
      </div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this role? This action cannot be undone.
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
          Role deleted successfully.
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