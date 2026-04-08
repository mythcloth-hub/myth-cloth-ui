import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { Box, Typography, Tooltip, IconButton, Button, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress } from "@mui/material";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { getAllDistributors, deleteDistributor } from "../api/distributorApi";
import type { Distributor } from "../types/distributor";
import type { GridColDef } from "@mui/x-data-grid";

const countryCodeToFlag = (code: string) =>
  code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");

function CustomNoRowsOverlay() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 1 }}>
      <Typography variant="body1" color="text.secondary">No distributors yet.</Typography>
      <Typography variant="body2" color="text.secondary">Click + Add Distributor to get started.</Typography>
    </Box>
  );
}

export default function DistributorListPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const loadData = async () => {
    try {
      const data = await getAllDistributors();
      setDistributors(data);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load distributors. Please check your connection and try again.");
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
      await deleteDistributor(pendingDeleteId);
      await loadData();
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to delete distributor. Please try again.");
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "description",
      headerName: "Description",
      flex: 2,
    },
    {
      field: "countryCode",
      headerName: "Country",
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span style={{ fontSize: "1.5rem" }}>
            {countryCodeToFlag(params.value)}
          </span>
        </Tooltip>
      )
    },
    {
      field: "website",
      headerName: "Website",
      width: 120,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) =>
        params.value ? (
          <Tooltip title={params.value}>
            <IconButton
              component="a"
              href={params.value}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: "secondary.main", "&:hover": { color: "primary.main" } }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          ""
        ),
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
              onClick={() => navigate(`/distributors/edit/${params.row.id}`)}
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
    }
  ];

  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }}>
          Distributors
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/distributors/new")}
        >
          + Add Distributor
        </Button>
      </Box>

      <div style={{ height: "calc(100vh - 220px)", minHeight: 300, width: "100%" }}>
        <DataGrid
          rows={distributors}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          columnVisibilityModel={{ website: !isMobile }}
          onRowDoubleClick={(params) => navigate(`/distributors/edit/${params.row.id}`)}
          slots={{ noRowsOverlay: CustomNoRowsOverlay }}
          sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
        />
      </div>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Distributor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this distributor? This action cannot be undone.
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
          Distributor deleted successfully.
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