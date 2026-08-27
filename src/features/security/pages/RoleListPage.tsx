import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

import { getAllRoles, deleteRole } from "../api/roleApi";
import type { Role } from "../types/role";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import AppPageHeader from "../../../components/AppPageHeader";
import ScrollableHintDataGrid from "../../../components/ScrollableHintDataGrid";
import { useAuth } from "../../../auth/AuthContext";

function CustomNoRowsOverlay() {
  const { t } = useTranslation("security");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 1 }}>
      <Typography variant="body1" color="text.secondary">{t("roles.noRolesYet")}</Typography>
      <Typography variant="body2" color="text.secondary">{t("roles.chooseAndClick")}</Typography>
    </Box>
  );
}

export default function RoleListPage() {
  const { t } = useTranslation("security");
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const canReadRoles = hasPermission("roles:read");
  const canUpdateRoles = hasPermission("roles:update");
  const canCreateRoles = hasPermission("roles:create");

  const loadData = async () => {
    if (!canReadRoles) {
      setRoles([]);
      setLoading(false);
      return;
    }

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
  }, [canReadRoles]);

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
      headerName: t("roles.columns.description"),
      flex: 3,
    },
    {
      field: "actions",
      headerName: t("roles.columns.actions"),
      width: 130,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <>
          {canUpdateRoles && (
            <Tooltip title={t("roles.columns.editTooltip")}>
              <IconButton
                size="small"
                onClick={() => navigate(`/security/roles/edit/${params.row.id}`)}
                sx={{ color: "primary.main", "&:hover": { color: "primary.light" } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t("roles.columns.deleteTooltip")}>
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
          eyebrow={t("roles.eyebrow")}
          title={t("roles.title")}
          subtitle={t("roles.subtitle")}
          actions={canCreateRoles ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/security/roles/new")}>
              {t("roles.addRoleButton")}
            </Button>
          ) : undefined}
        />
      </Box>

      <ScrollableHintDataGrid
        containerStyle={{ height: "calc(100vh - 220px)", minHeight: 300, width: "100%" }}
        rows={roles}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.id}
        onRowDoubleClick={canUpdateRoles ? (params) => navigate(`/security/roles/edit/${params.row.id}`) : undefined}
        slots={{ noRowsOverlay: CustomNoRowsOverlay }}
        sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
      />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t("roles.deleteDialog.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("roles.deleteDialog.body")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} startIcon={<CancelOutlinedIcon />}>{t("roles.deleteDialog.cancelButton")}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting} startIcon={<DeleteIcon />}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : t("roles.deleteDialog.deleteButton")}
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
          {t("roles.deleteSuccessful")}
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
