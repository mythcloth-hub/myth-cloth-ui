import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";

import { getAllRoles } from "../api/roleApi";
import { getAllPermissions } from "../api/permissionApi";
import { getPermissionsByRoleId, syncRolePermissions } from "../api/rolePermissionApi";
import type { Role } from "../types/role";
import type { Permission } from "../types/permission";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import AppPageHeader from "../../../components/AppPageHeader";
import ScrollableHintDataGrid from "../../../components/ScrollableHintDataGrid";
import { useAuth } from "../../../auth/AuthContext";

function CustomNoRowsOverlay() {
  const { t } = useTranslation("security");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 1 }}>
      <Typography variant="body1" color="text.secondary">{t("rolePermissions.noPermissionsYet")}</Typography>
      <Typography variant="body2" color="text.secondary">{t("rolePermissions.chooseAndClick")}</Typography>
    </Box>
  );
}

export default function RolePermissionsPage() {
  const { t } = useTranslation("security");
  const { hasPermission } = useAuth();
  const canSyncRolePermissions = hasPermission("roles:permissions:sync");
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [assignedPermissions, setAssignedPermissions] = useState<Permission[]>([]);

  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  const [loadingLookups, setLoadingLookups] = useState(true);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [rolesData, permissionsData] = await Promise.all([
          getAllRoles(),
          getAllPermissions(),
        ]);
        setRoles(rolesData);
        setAllPermissions(permissionsData);
      } catch (err) {
        console.error(err);
        setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "roles and permissions" }));
      } finally {
        setLoadingLookups(false);
      }
    };

    loadLookups();
  }, []);

  useEffect(() => {
    if (!selectedRoleId) {
      setAssignedPermissions([]);
      return;
    }

    const loadAssigned = async () => {
      setLoadingAssigned(true);
      try {
        const data = await getPermissionsByRoleId(selectedRoleId);
        setAssignedPermissions(data);
        setSelectedPermissionIds(data.map((permission) => permission.id));
      } catch (err) {
        console.error(err);
        setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "role permissions" }));
      } finally {
        setLoadingAssigned(false);
      }
    };

    loadAssigned();
  }, [selectedRoleId]);

  const permissionDescriptionById = useMemo(
    () => new Map(allPermissions.map((permission) => [permission.id, permission.description])),
    [allPermissions],
  );

  const columns: GridColDef[] = [
    {
      field: "description",
      headerName: t("rolePermissions.columns.description"),
      flex: 1,
    },
  ];

  const handlePermissionSelectionChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    setSelectedPermissionIds(
      typeof value === "string"
        ? value.split(",").map((item) => Number(item)).filter((item) => Number.isFinite(item))
        : value,
    );
  };

  const handleSync = async () => {
    if (!selectedRoleId) return;

    setSubmitting(true);
    try {
      await syncRolePermissions(selectedRoleId, selectedPermissionIds);
      const updated = await getPermissionsByRoleId(selectedRoleId);
      setAssignedPermissions(updated);
      setSelectedPermissionIds(updated.map((permission) => permission.id));
      setSuccessMessage(t("rolePermissions.syncSuccessful"));
    } catch (err) {
      console.error(err);
      setErrorMessage(getApiErrorMessage(err, { action: "update", resource: "role permissions" }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow={t("rolePermissions.eyebrow")}
          title={t("rolePermissions.title")}
          subtitle={t("rolePermissions.subtitle")}
        />
      </Box>

      <Paper sx={{ padding: { xs: 2, sm: 3 }, mb: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: canSyncRolePermissions ? "1fr 1fr auto" : "1fr 1fr" }, gap: 2, alignItems: "end" }}>
          <FormControl fullWidth>
            <InputLabel id="role-select-label">{t("rolePermissions.roleLabel")}</InputLabel>
            <Select
              labelId="role-select-label"
              label={t("rolePermissions.roleLabel")}
              value={selectedRoleId}
              onChange={(event) => {
                setSelectedRoleId(event.target.value as number);
                setSelectedPermissionIds([]);
              }}
              disabled={loadingLookups}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!selectedRoleId || loadingLookups || submitting}>
            <InputLabel id="permission-select-label">{t("rolePermissions.permissionLabel")}</InputLabel>
            <Select
              labelId="permission-select-label"
              multiple
              label={t("rolePermissions.permissionLabel")}
              value={selectedPermissionIds}
              onChange={handlePermissionSelectionChange}
              renderValue={(selected) =>
                (selected as number[])
                  .map((permissionId) => permissionDescriptionById.get(permissionId) ?? permissionId)
                  .join(", ")
              }
            >
              {allPermissions.map((permission) => (
                <MenuItem key={permission.id} value={permission.id}>
                  {permission.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {canSyncRolePermissions && (
            <Button
              variant="contained"
              onClick={handleSync}
              disabled={!selectedRoleId || submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SyncAltOutlinedIcon />}
              sx={{ height: 56 }}
            >
              {submitting ? t("rolePermissions.syncingButton") : t("rolePermissions.syncButton")}
            </Button>
          )}
        </Box>
      </Paper>

      {loadingLookups ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : !selectedRoleId ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">{t("rolePermissions.selectRoleMessage")}</Typography>
        </Paper>
      ) : (
        <ScrollableHintDataGrid
          containerStyle={{ height: "calc(100vh - 360px)", minHeight: 260, width: "100%" }}
          rows={assignedPermissions}
          columns={columns}
          loading={loadingAssigned}
          getRowId={(row) => row.id}
          slots={{ noRowsOverlay: CustomNoRowsOverlay }}
        />
      )}

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
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
