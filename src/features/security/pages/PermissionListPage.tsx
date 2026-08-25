import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import AddIcon from "@mui/icons-material/Add";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import type { GridColDef } from "@mui/x-data-grid";

import { getAllPermissions, deletePermission } from "../api/permissionApi";
import type { Permission } from "../types/permission";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import AppPageHeader from "../../../components/AppPageHeader";
import ScrollableHintDataGrid from "../../../components/ScrollableHintDataGrid";
import { useAuth } from "../../../auth/AuthContext";

function CustomNoRowsOverlay() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 1 }}>
      <Typography variant="body1" color="text.secondary">No permissions yet.</Typography>
      <Typography variant="body2" color="text.secondary">Click + Add Permission to get started.</Typography>
    </Box>
  );
}

export default function PermissionListPage() {
  const { hasPermission } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const canReadPermissions = hasPermission("permissions:read");
  const canUpdatePermissions = hasPermission("permissions:update");
  const canCreatePermissions = hasPermission("permissions:create");
  const canDeletePermissions = hasPermission("permissions:delete");

  const loadData = async () => {
    if (!canReadPermissions) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getAllPermissions();
      setPermissions(data);
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "permissions" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [canReadPermissions]);

  const handleDeleteClick = (id: number) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId === null) return;
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await deletePermission(pendingDeleteId);
      await loadData();
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "delete", resource: "permission" }));
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
          {canUpdatePermissions && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => navigate(`/security/permissions/edit/${params.row.id}`)}
                sx={{ color: "primary.main", "&:hover": { color: "primary.light" } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDeletePermissions && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(params.row.id)}
                sx={{ color: "error.main", "&:hover": { color: "error.light" } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      ),
    },
  ];

  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow="Administration • Security"
          title="Permissions"
          subtitle="Manage granular permissions that are assigned to roles and protected features."
          actions={canCreatePermissions ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/security/permissions/new")}>
              Add Permission
            </Button>
          ) : undefined}
        />
      </Box>

      <ScrollableHintDataGrid
        containerStyle={{ height: "calc(100vh - 220px)", minHeight: 300, width: "100%" }}
        rows={permissions}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.id}
        onRowDoubleClick={canUpdatePermissions ? (params) => navigate(`/security/permissions/edit/${params.row.id}`) : undefined}
        slots={{ noRowsOverlay: CustomNoRowsOverlay }}
        sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
      />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Permission</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this permission? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} startIcon={<CancelOutlinedIcon />}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting} startIcon={<DeleteIcon />}>
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
          Permission deleted successfully.
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