import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	FormControl,
	FormControlLabel,
	FormHelperText,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Snackbar,
	Switch,
	TextField,
	Typography,
} from "@mui/material";
import axios from "axios";
import AddIcon from "@mui/icons-material/Add";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import { useAuth } from "../../../auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import { createStore, getStoreById, updateStore } from "../api/storeApi";
import type { StoreCurrency, StoreInput, StoreName } from "../types/store";
import { countryCodeToFlag } from "../../../utils/countryFlag";

type FormData = {
	name: string;
	storeName: string;
	website: string;
	logoUrl: string;
	currency: string;
	country: string;
	active: boolean;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const EMPTY_FORM: FormData = {
	name: "",
	storeName: "",
	website: "",
	logoUrl: "",
	currency: "",
	country: "",
	active: true,
};

const CURRENCY_OPTIONS = ["JPY", "MXN", "EUR", "USD", "CNY", "CAD"] as const;
const COUNTRY_OPTIONS = [
	{ value: "JP", label: "Japan" },
	{ value: "MX", label: "Mexico" },
	{ value: "US", label: "United States" },
	{ value: "BE", label: "Belgium" },
	{ value: "CN", label: "China" },
	{ value: "CA", label: "Canada" },
	{ value: "EU", label: "Europe" },
] as const;

function mapFormToInput(form: FormData): StoreInput {
	return {
		name: form.name.trim(),
		storeName: form.storeName.trim() as StoreName,
		website: form.website.trim(),
		logoUrl: form.logoUrl.trim(),
		currency: form.currency.trim() as StoreCurrency,
		country: form.country.trim(),
		active: form.active,
	};
}

export default function StoreFormPage() {
	const { id } = useParams<{ id: string }>();
	const isEdit = Boolean(id);
	const navigate = useNavigate();
	const { hasPermission } = useAuth();

	const canReadStores = hasPermission("stores:read");
	const canCreateStores = hasPermission("stores:create");
	const canUpdateStores = hasPermission("stores:update");
	const canSubmit = isEdit ? canUpdateStores : canCreateStores;

	const [form, setForm] = useState<FormData>(EMPTY_FORM);
	const [errors, setErrors] = useState<FormErrors>({});
	const [loadingForm, setLoadingForm] = useState(isEdit);
	const [loading, setLoading] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!isEdit) return;
		if (!canReadStores) {
			setLoadingForm(false);
			return;
		}

		setLoadingForm(true);
		getStoreById(Number(id))
			.then((data) => {
				setForm({
					name: data.name ?? "",
					storeName: data.storeName ?? "",
					website: data.website ?? "",
					logoUrl: data.logoUrl ?? "",
					currency: data.currency ?? "",
					country: data.country ?? "",
					active: Boolean(data.active),
				});
			})
			.catch((err) => {
				console.error(err);
				setServerError(getApiErrorMessage(err, { action: "load", resource: "store" }));
			})
			.finally(() => setLoadingForm(false));
	}, [canReadStores, id, isEdit]);

	const validate = (): boolean => {
		const nextErrors: FormErrors = {};

		if (!form.name.trim()) {
			nextErrors.name = "Name is required";
		} else if (form.name.trim().length > 150) {
			nextErrors.name = "Store name must not exceed 150 characters";
		}

		if (!form.storeName.trim()) {
			nextErrors.storeName = "Store key is required";
		}

		if (!form.website.trim()) {
			nextErrors.website = "Website is required";
		} else {
			try {
				const parsed = new URL(form.website.trim());
				if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
					nextErrors.website = "Website must start with http:// or https://";
				}
			} catch {
				nextErrors.website = "Website must be a valid URL";
			}
		}

		if (!form.logoUrl.trim()) {
			nextErrors.logoUrl = "Logo URL is required";
		} else {
			try {
				const parsed = new URL(form.logoUrl.trim());
				if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
					nextErrors.logoUrl = "Logo URL must start with http:// or https://";
				}
			} catch {
				nextErrors.logoUrl = "Logo URL must be a valid URL";
			}
		}

		if (!form.currency.trim()) {
			nextErrors.currency = "Currency is required";
		}

		if (!form.country.trim()) {
			nextErrors.country = "Country is required";
		} else if (form.country.trim().length > 100) {
			nextErrors.country = "Country must not exceed 100 characters";
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: undefined }));
		setServerError(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!canSubmit) {
			setServerError(`You do not have permission to ${isEdit ? "update" : "create"} stores.`);
			return;
		}

		if (!validate()) return;
		setLoading(true);

		try {
			const payload = mapFormToInput(form);
			if (isEdit) {
				await updateStore(Number(id), payload);
			} else {
				await createStore(payload);
			}
			setSuccessMessage(isEdit ? "Store updated successfully." : "Store created successfully.");
		} catch (err) {
			console.error(err);
			if (axios.isAxiosError(err)) {
				if (err.response?.data) {
					const body = err.response.data as Record<string, unknown>;
					setServerError(
						(body.detail as string) ??
							getApiErrorMessage(err, { action: isEdit ? "update" : "create", resource: "store" }),
					);
				} else {
					setServerError(getApiErrorMessage(err, { action: isEdit ? "update" : "create", resource: "store" }));
				}
			} else {
				setServerError(getApiErrorMessage(err, { action: isEdit ? "update" : "create", resource: "store" }));
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
			<Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }} gutterBottom>
				{isEdit ? "Edit Store" : "New Store"}
			</Typography>

			{!canReadStores && (
				<Alert severity="warning" sx={{ mb: 2 }}>
					You do not have the required permission: stores:read
				</Alert>
			)}

			{loadingForm ? (
				<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 220 }}>
					<CircularProgress />
				</Box>
			) : (
				<Paper sx={{ padding: { xs: 2, sm: 3 } }}>
					<Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						{serverError && (
							<Alert severity="error" onClose={() => setServerError(null)}>
								{serverError}
							</Alert>
						)}

						<TextField
							label="Store Name"
							name="name"
							value={form.name}
							onChange={handleTextChange}
							required
							fullWidth
							autoFocus
							slotProps={{ htmlInput: { maxLength: 150 } }}
							error={Boolean(errors.name)}
							helperText={errors.name}
						/>

						<TextField
							label="Store Key"
							name="storeName"
							value={form.storeName}
							onChange={handleTextChange}
							required
							fullWidth
							slotProps={{ htmlInput: { maxLength: 120 } }}
							error={Boolean(errors.storeName)}
							helperText={errors.storeName ?? "Required. Example: LOGAN_STORE"}
						/>

						<TextField
							label="Website"
							name="website"
							value={form.website}
							onChange={handleTextChange}
							fullWidth
							placeholder="https://example.com"
							slotProps={{ htmlInput: { maxLength: 220 } }}
							error={Boolean(errors.website)}
							helperText={errors.website ?? "Required"}
						/>

						<TextField
							label="Logo URL"
							name="logoUrl"
							value={form.logoUrl}
							onChange={handleTextChange}
							fullWidth
							placeholder="https://example.com/logo.png"
							slotProps={{ htmlInput: { maxLength: 350 } }}
							error={Boolean(errors.logoUrl)}
							helperText={errors.logoUrl ?? "Required"}
						/>

						<FormControl fullWidth error={Boolean(errors.currency)}>
							<InputLabel id="store-currency-label">Currency</InputLabel>
							<Select
								labelId="store-currency-label"
								label="Currency"
								name="currency"
								value={form.currency}
								onChange={(e) => {
									setForm((prev) => ({ ...prev, currency: e.target.value }));
									setErrors((prev) => ({ ...prev, currency: undefined }));
									setServerError(null);
								}}
							>
								<MenuItem value="">Select currency</MenuItem>
								{CURRENCY_OPTIONS.map((currency) => (
									<MenuItem key={currency} value={currency}>{currency}</MenuItem>
								))}
							</Select>
							<FormHelperText>{errors.currency ?? "Required"}</FormHelperText>
						</FormControl>

						<FormControl required fullWidth error={Boolean(errors.country)}>
							<InputLabel id="store-country-label">Country</InputLabel>
							<Select
								labelId="store-country-label"
								label="Country"
								name="country"
								value={form.country}
								onChange={(e) => {
									setForm((prev) => ({ ...prev, country: e.target.value }));
									setErrors((prev) => ({ ...prev, country: undefined }));
									setServerError(null);
								}}
							>
								<MenuItem value="">Select country</MenuItem>
								{COUNTRY_OPTIONS.map((country) => (
									<MenuItem key={country.value} value={country.value}>
										<span style={{ marginRight: 8 }}>{countryCodeToFlag(country.value)}</span>
										{country.label}
									</MenuItem>
								))}
							</Select>
							<FormHelperText>{errors.country ?? "Required"}</FormHelperText>
						</FormControl>

						<FormControlLabel
							control={(
								<Switch
									checked={form.active}
									onChange={(e) => {
										setForm((prev) => ({ ...prev, active: e.target.checked }));
										setServerError(null);
									}}
								/>
							)}
							label={form.active ? "Store is active" : "Store is inactive"}
						/>

						{!canSubmit && (
							<Alert severity="warning">
								You do not have the required permission: {isEdit ? "stores:update" : "stores:create"}
							</Alert>
						)}

						<Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1 }}>
							<Button variant="outlined" startIcon={<CancelOutlinedIcon />} onClick={() => navigate("/stores")}>Cancel</Button>
							<Button type="submit" variant="contained" disabled={loading || Boolean(successMessage) || !canSubmit} startIcon={isEdit ? <SaveOutlinedIcon /> : <AddIcon />}>
								{isEdit ? "Update" : "Create"}
							</Button>
						</Box>
					</Box>
				</Paper>
			)}

			<Snackbar
				open={Boolean(successMessage)}
				autoHideDuration={1500}
				onClose={() => {
					setSuccessMessage(null);
					navigate("/stores");
				}}
				anchorOrigin={{ vertical: "top", horizontal: "center" }}
			>
				<Alert severity="success">{successMessage}</Alert>
			</Snackbar>
		</Box>
	);
}