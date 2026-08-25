import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Link,
	Snackbar,
	Tooltip,
	Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import type { GridColDef } from "@mui/x-data-grid";

import { useAuth } from "../../../auth/AuthContext";
import AppPageHeader from "../../../components/AppPageHeader";
import ScrollableHintDataGrid from "../../../components/ScrollableHintDataGrid";
import { countryCodeToFlag } from "../../../utils/countryFlag";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import { deleteStore, getAllStores } from "../api/storeApi";
import type { Store } from "../types/store";

function NoRowsOverlay() {
	return (
		<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 1 }}>
			<Typography variant="body1" color="text.secondary">No stores yet.</Typography>
			<Typography variant="body2" color="text.secondary">Click + Add Store to get started.</Typography>
		</Box>
	);
}

export default function StoreListPage() {
	const { hasPermission } = useAuth();
	const navigate = useNavigate();

	const canReadStores = hasPermission("stores:read");
	const canCreateStores = hasPermission("stores:create");
	const canUpdateStores = hasPermission("stores:update");
	const canDeleteStores = hasPermission("stores:delete");

	const [items, setItems] = useState<Store[]>([]);
	const [loading, setLoading] = useState(true);
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	const loadData = async () => {
		if (!canReadStores) {
			setItems([]);
			setLoading(false);
			return;
		}

		try {
			const data = await getAllStores();
			setItems(data);
		} catch (err) {
			console.error(err);
			setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "stores" }));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setLoading(true);
		void loadData();
	}, [canReadStores]);

	const handleDeleteClick = (id: number) => {
		setPendingDeleteId(id);
		setConfirmOpen(true);
	};

	const navigateToEdit = (store: Store) => {
		navigate(`/stores/edit/${store.id}`, { state: { store } });
	};

	const handleConfirmDelete = async () => {
		if (pendingDeleteId === null) return;

		setConfirmOpen(false);
		setDeleting(true);
		try {
			await deleteStore(pendingDeleteId);
			await loadData();
			setSnackbarOpen(true);
		} catch (err) {
			console.error(err);
			setErrorMessage(getApiErrorMessage(err, { action: "delete", resource: "store" }));
		} finally {
			setDeleting(false);
			setPendingDeleteId(null);
		}
	};

	const columns: GridColDef[] = [
		{
			field: "name",
			headerName: "Name",
			flex: 1.2,
			minWidth: 170,
		},
		{
			field: "storeName",
			headerName: "Key",
			flex: 1,
			minWidth: 170,
		},
		{
			field: "logoUrl",
			headerName: "Logo",
			width: 110,
			sortable: false,
			filterable: false,
			align: "center",
			headerAlign: "center",
			renderCell: (params) => {
				const url = params.row.logoUrl?.trim();
				if (!url) {
					return <StorefrontOutlinedIcon sx={{ color: "text.disabled" }} fontSize="small" />;
				}

				return (
					<Tooltip title={params.row.name}>
						<Box
							component="img"
							src={url}
							alt={params.row.name}
							sx={{ width: 26, height: 26, objectFit: "contain", borderRadius: 0.5 }}
						/>
					</Tooltip>
				);
			},
		},
		{
			field: "website",
			headerName: "Website",
			flex: 1.2,
			minWidth: 200,
			sortable: false,
			renderCell: (params) => {
				const url = params.row.website?.trim();
				if (!url) {
					return <Typography variant="body2" color="text.secondary">-</Typography>;
				}

				return (
					<Link
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						underline="hover"
						sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: "0.82rem" }}
					>
						Open
						<OpenInNewOutlinedIcon sx={{ fontSize: 14 }} />
					</Link>
				);
			},
		},
		{
			field: "currency",
			headerName: "Currency",
			width: 110,
			align: "center",
			headerAlign: "center",
			valueGetter: (value) => value || "-",
		},
		{
			field: "country",
			headerName: "Country",
			width: 110,
			align: "center",
			headerAlign: "center",
			renderCell: (params) => {
				const code = params.row.country?.trim().toUpperCase();
				if (!code) {
					return <Typography variant="body2" color="text.secondary">-</Typography>;
				}

				return (
					<Tooltip title={code}>
						<Typography component="span" sx={{ fontSize: "1.15rem", lineHeight: 1 }}>
							{countryCodeToFlag(code)}
						</Typography>
					</Tooltip>
				);
			},
		},
		{
			field: "active",
			headerName: "Status",
			width: 120,
			align: "center",
			headerAlign: "center",
			renderCell: (params) => (
				<Chip
					size="small"
					label={params.row.active ? "Active" : "Inactive"}
					color={params.row.active ? "success" : "default"}
					variant={params.row.active ? "filled" : "outlined"}
				/>
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
					{canUpdateStores && (
						<Tooltip title="Edit">
							<IconButton
								size="small"
								onClick={() => navigateToEdit(params.row as Store)}
								sx={{ color: "primary.main", "&:hover": { color: "primary.light" } }}
							>
								<EditIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					)}
					{canDeleteStores && (
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
					eyebrow="Administration"
					title="Stores"
					subtitle="Manage store partners used for pricing, matching, and import references."
					actions={canCreateStores ? (
						<Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/stores/new")}>
							Add Store
						</Button>
					) : undefined}
				/>
			</Box>

			{!canReadStores && (
				<Alert severity="warning" sx={{ mb: 2 }}>
					You do not have the required permission: stores:read
				</Alert>
			)}

			<ScrollableHintDataGrid
				containerStyle={{ height: "calc(100vh - 220px)", minHeight: 300, width: "100%" }}
				rows={items}
				columns={columns}
				loading={loading}
				getRowId={(row) => row.id}
				onRowDoubleClick={canUpdateStores ? (params) => navigateToEdit(params.row as Store) : undefined}
				slots={{ noRowsOverlay: NoRowsOverlay }}
				sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
			/>

			<Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
				<DialogTitle>Delete Store</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to delete this store? This action cannot be undone.
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
					Store deleted successfully.
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