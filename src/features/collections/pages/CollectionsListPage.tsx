import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Collapse,
  Grid,
  Typography,
  Alert,
  Snackbar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import KeyboardArrowUpOutlinedIcon from "@mui/icons-material/KeyboardArrowUpOutlined";
import { alpha, useTheme } from "@mui/material/styles";
import { deleteCollection, duplicateCollection, getCollectionSummary, getCollections, setCollectionFavorite, updateCollection } from "../api/collectionApi";
import type { Collection, CollectionSummaryResponse } from "../types/collection";
import { getApiErrorDetails, type ApiErrorSeverity } from "../../../utils/apiErrorMessage";
import AppPageHeader from "../../../components/AppPageHeader";
import { useAuth } from "../../../auth/AuthContext";

export default function CollectionsListPage() {
  const { t } = useTranslation("collections");

  const navigate = useNavigate();
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const canReadCollectionFigurines = hasPermission("collections:figurines:read");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorSeverity, setErrorSeverity] = useState<ApiErrorSeverity>("error");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState(false);
  const [duplicatingCollection, setDuplicatingCollection] = useState(false);
  const [settingFavoriteId, setSettingFavoriteId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [collectionSummaries, setCollectionSummaries] = useState<Record<number, CollectionSummaryResponse>>({});
  const totalFigurinesAcrossCollections = collections.reduce(
    (total, collection) => total + collection.figurineIds.length,
    0
  );
  const uniqueFigurinesAcrossCollections = new Set(
    collections.flatMap((collection) => collection.figurineIds)
  ).size;
  const largestCollection = collections.reduce<Collection | null>((largest, current) => {
    if (!largest || current.figurineIds.length > largest.figurineIds.length) {
      return current;
    }

    return largest;
  }, null);
  const topCollectionsBySize = [...collections]
    .sort((a, b) => b.figurineIds.length - a.figurineIds.length)
    .slice(0, 5);
  const maxCollectionSize = topCollectionsBySize[0]?.figurineIds.length ?? 1;
  const averageFigurinesPerCollection =
    collections.length > 0 ? totalFigurinesAcrossCollections / collections.length : 0;
  const uniquenessRatio =
    totalFigurinesAcrossCollections > 0 ? uniqueFigurinesAcrossCollections / totalFigurinesAcrossCollections : 0;
  const uniquenessPercent = Math.round(uniquenessRatio * 100);
  const repeatedEntriesAcrossCollections = Math.max(
    totalFigurinesAcrossCollections - uniqueFigurinesAcrossCollections,
    0
  );
  const metricCardSx = {
    p: 1.25,
    borderRadius: 1.5,
    bgcolor: alpha(theme.palette.background.paper, 0.64),
    border: `1px solid ${alpha(theme.palette.info.main, 0.24)}`,
  };
  const metricLabelRowSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 1,
    mb: 0.5,
  };
  const infoIconSx = { fontSize: "0.95rem" };
  const metricValueSx = { fontWeight: 700, color: "primary.main", lineHeight: 1 };
  const coverGradients = [
    [theme.palette.primary.main, theme.palette.info.main],
    [theme.palette.info.main, theme.palette.secondary.main],
    [theme.palette.success.main, theme.palette.primary.main],
    [theme.palette.warning.main, theme.palette.secondary.main],
    [theme.palette.secondary.main, theme.palette.info.main],
  ];

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCollections();
      setCollections(data);
      void loadCollectionSummaries(data);
    } catch (err) {
      const { message, severity } = getApiErrorDetails(err, { action: "load", resource: "collections" });
      setError(message);
      setErrorSeverity(severity);
    } finally {
      setLoading(false);
    }
  };

  const loadCollectionSummaries = async (items: Collection[]) => {
    if (items.length === 0) {
      setCollectionSummaries({});
      return;
    }

    const results = await Promise.allSettled(items.map((item) => getCollectionSummary(item.id)));
    const nextSummaries: Record<number, CollectionSummaryResponse> = {};
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        nextSummaries[items[index].id] = result.value;
      }
    });
    setCollectionSummaries(nextSummaries);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, collection: Collection) => {
    setAnchorEl(event.currentTarget);
    setSelectedCollection(collection);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedCollection) {
      setEditName(selectedCollection.name);
      setEditImageUrl(selectedCollection.imageUrl ?? "");
      setEditDescription(selectedCollection.description ?? "");
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDuplicateClick = async () => {
    if (!selectedCollection) return;

    setDuplicatingCollection(true);
    setError(null);
    handleMenuClose();

    try {
      await duplicateCollection(selectedCollection.id);
      await loadCollections();
      setSuccessMessage(t("messages.duplicationStarted", { name: selectedCollection.name }));
    } catch (err) {
      const { message, severity } = getApiErrorDetails(err, { action: "update", resource: "collection" });
      setError(message);
      setErrorSeverity(severity);
    } finally {
      setDuplicatingCollection(false);
    }
  };

  const handleSetFavoriteClick = async () => {
    if (!selectedCollection) return;

    const collectionId = selectedCollection.id;
    setSettingFavoriteId(collectionId);
    setError(null);
    handleMenuClose();

    try {
      await setCollectionFavorite(collectionId);
      await loadCollections();
      setSuccessMessage(t("messages.favoriteSet", { name: selectedCollection.name }));
    } catch (err) {
      const { message, severity } = getApiErrorDetails(err, { action: "update", resource: "collection" });
      setError(message);
      setErrorSeverity(severity);
    } finally {
      setSettingFavoriteId((current) => (current === collectionId ? null : current));
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCollection) return;

    setDeletingCollection(true);
    setError(null);
    try {
      await deleteCollection(selectedCollection.id);
      await loadCollections();
      setSuccessMessage(t("messages.removed", { name: selectedCollection.name }));
      setDeleteDialogOpen(false);
      setSelectedCollection(null);
    } catch (err) {
      const { message, severity } = getApiErrorDetails(err, { action: "delete", resource: "collection" });
      setError(message);
      setErrorSeverity(severity);
    } finally {
      setDeletingCollection(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCollection) return;

    const nextName = editName.trim();
    if (!nextName) {
      setError(t("messages.required"));
      setErrorSeverity("error");
      return;
    }

    setSavingEdit(true);
    setError(null);
    try {
      const updated = await updateCollection(selectedCollection.id, {
        name: nextName,
        imageUrl: editImageUrl.trim() || undefined,
        description: editDescription.trim() || undefined,
      });

      await loadCollections();
      setSelectedCollection(updated);
      setEditDialogOpen(false);
      setSuccessMessage(t("messages.updated", { name: updated.name }));
    } catch (err) {
      const { message, severity } = getApiErrorDetails(err, { action: "update", resource: "collection" });
      setError(message);
      setErrorSeverity(severity);
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "primary.main" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 9,
          bgcolor: "background.default",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          mx: { xs: -1.5, sm: -2, md: -3 },
          px: { xs: 1.5, sm: 2, md: 3 },
          pt: 0.25,
          pb: 1,
          mb: 2,
        }}
      >
        <Box sx={{ width: "100%" }}>
          <AppPageHeader
            eyebrow={t("header.eyebrow")}
            title={t("header.title")}
            subtitle={t("header.subtitle")}
            compact
            actions={
              <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/figurines")}
                  sx={{ flexShrink: 0 }}>
                    {t("header.newCollection")}
                </Button>
              </Box>
            }
          />
        </Box>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity={errorSeverity} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Empty state */}
      {collections.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            gap: 3,
          }}
        >
          <Typography variant="h6" sx={{ color: "text.secondary" }}>
            {t("empty.noCollections")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 560 }}>
            {t("empty.description")}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/figurines")}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              color: theme.palette.getContrastText(theme.palette.primary.main),
              fontWeight: 600,
              "&:hover": {
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
              },
            }}
          >
            {t("empty.browseFigurines")}
          </Button>
        </Box>
      ) : (
        <>
          <Card
            sx={{
              mb: 2.5,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
              backdropFilter: "blur(10px)",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="overline" sx={{ color: "info.main", letterSpacing: 1.1, lineHeight: 1 }}>
                    {t("overview.title")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, maxWidth: 760 }}>
                    {t("overview.description")}
                  </Typography>
                </Box>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setOverviewExpanded((current) => !current)}
                  endIcon={overviewExpanded ? <KeyboardArrowUpOutlinedIcon /> : <KeyboardArrowDownOutlinedIcon />}
                  sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  {overviewExpanded ? t("overview.hideDetails") : t("overview.showDetails")}
                </Button>
              </Box>

              <Collapse in={overviewExpanded}>
              {largestCollection && (
                <Typography variant="caption" sx={{ color: "primary.main", mt: 0.75, display: "block", fontWeight: 600 }}>
                  {t("overview.largestCollectionDesc", { name: largestCollection.name, count: largestCollection.figurineIds.length })}
                </Typography>
              )}
              <Box
                sx={{
                  mt: 1.5,
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
                  gap: 1.25,
                }}
              >
                <Box sx={metricCardSx}>
                  <Box sx={metricLabelRowSx}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {t("overview.totalCollections.label")}
                    </Typography>
                    <Tooltip title={t("overview.totalCollections.tooltip")} arrow>
                      <span>
                        <Box component="span" sx={{ display: "inline-flex", color: "text.disabled" }}>
                          <InfoOutlinedIcon sx={infoIconSx} />
                        </Box>
                      </span>
                    </Tooltip>
                  </Box>
                  <Typography variant="h5" sx={metricValueSx}>
                    {collections.length}
                  </Typography>
                </Box>
                <Box sx={metricCardSx}>
                  <Box sx={metricLabelRowSx}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {t("overview.totalFigurineEntries.label")}
                    </Typography>
                    <Tooltip title={t("overview.totalFigurineEntries.tooltip")} arrow>
                      <span>
                        <Box component="span" sx={{ display: "inline-flex", color: "text.disabled" }}>
                          <InfoOutlinedIcon sx={infoIconSx} />
                        </Box>
                      </span>
                    </Tooltip>
                  </Box>
                  <Typography variant="h5" sx={metricValueSx}>
                    {totalFigurinesAcrossCollections}
                  </Typography>
                </Box>
                <Box sx={metricCardSx}>
                  <Box sx={metricLabelRowSx}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {t("overview.uniqueFigurines.label")}
                    </Typography>
                    <Tooltip title={t("overview.uniqueFigurines.tooltip")} arrow>
                      <span>
                        <Box component="span" sx={{ display: "inline-flex", color: "text.disabled" }}>
                          <InfoOutlinedIcon sx={infoIconSx} />
                        </Box>
                      </span>
                    </Tooltip>
                  </Box>
                  <Typography variant="h5" sx={metricValueSx}>
                    {uniqueFigurinesAcrossCollections}
                  </Typography>
                </Box>
                <Box sx={metricCardSx}>
                  <Box sx={metricLabelRowSx}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {t("overview.averageFigurinesPerCollection.label")}
                    </Typography>
                    <Tooltip title={t("overview.averageFigurinesPerCollection.tooltip")} arrow>
                      <span>
                        <Box component="span" sx={{ display: "inline-flex", color: "text.disabled" }}>
                          <InfoOutlinedIcon sx={infoIconSx} />
                        </Box>
                      </span>
                    </Tooltip>
                  </Box>
                  <Typography variant="h5" sx={metricValueSx}>
                    {averageFigurinesPerCollection.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1.1 }}>
                {t("overview.repeatedEntries.label", { total: repeatedEntriesAcrossCollections })}
                {repeatedEntriesAcrossCollections > 0
                  ? t("overview.repeatedEntries.repetitions")
                  : t("overview.repeatedEntries.noRepetitions")}
              </Typography>

              <Box
                sx={{
                  mt: 2.5,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" },
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.24)}`,
                    background: alpha(theme.palette.info.main, 0.07),
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ color: "info.main", fontWeight: 700 }}>
                      {t("overview.largestCollection.title")}
                    </Typography>
                    <Tooltip title={t("overview.largestCollection.tooltip")} arrow>
                      <span>
                        <Box component="span" sx={{ display: "inline-flex", color: "text.disabled" }}>
                          <InfoOutlinedIcon sx={infoIconSx} />
                        </Box>
                      </span>
                    </Tooltip>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    {topCollectionsBySize.map((collection, index) => {
                      const count = collection.figurineIds.length;
                      const barWidth = maxCollectionSize > 0 ? (count / maxCollectionSize) * 100 : 0;

                      return (
                        <Box key={collection.id}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5, gap: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.primary",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {collection.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, flexShrink: 0 }}>
                              {t("overview.largestCollection.total", { count })}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              background: alpha(theme.palette.info.main, 0.14),
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                height: "100%",
                                width: `${Math.max(barWidth, count > 0 ? 6 : 0)}%`,
                                borderRadius: 999,
                                background: `linear-gradient(90deg, ${theme.palette.info.main} 0%, ${theme.palette.primary.main} 100%)`,
                                transformOrigin: "left center",
                                animation: `barReveal 700ms cubic-bezier(0.2, 0.9, 0.2, 1) ${index * 90}ms both`,
                                "@keyframes barReveal": {
                                  "0%": { transform: "scaleX(0)", opacity: 0.7 },
                                  "100%": { transform: "scaleX(1)", opacity: 1 },
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
                    background: alpha(theme.palette.primary.main, 0.08),
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Typography variant="subtitle2" sx={{ color: "primary.main", fontWeight: 700 }}>
                      {t("overview.uniqueFigurinesRatio.title")}
                    </Typography>
                    <Tooltip title={t("overview.uniqueFigurinesRatio.tooltip")} arrow>
                      <span>
                        <Box component="span" sx={{ display: "inline-flex", color: "text.disabled" }}>
                          <InfoOutlinedIcon sx={infoIconSx} />
                        </Box>
                      </span>
                    </Tooltip>
                  </Box>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      p: 1.25,
                      background: `conic-gradient(${theme.palette.info.main} 0% ${uniquenessPercent}%, ${alpha(theme.palette.primary.main, 0.22)} ${uniquenessPercent}% 100%)`,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.24)}`,
                      animation: "donutReveal 700ms ease-out both",
                      "@keyframes donutReveal": {
                        "0%": { transform: "scale(0.86)", opacity: 0 },
                        "100%": { transform: "scale(1)", opacity: 1 },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        bgcolor: alpha(theme.palette.background.paper, 0.95),
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="h5" sx={{ color: "info.main", fontWeight: 800, lineHeight: 1 }}>
                        {uniquenessPercent}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {t("overview.uniqueFigurinesRatio.unique")}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 220 }}>
                    {t("overview.uniqueFigurinesRatio.footer", { count: uniqueFigurinesAcrossCollections, entries: totalFigurinesAcrossCollections })}
                  </Typography>
                </Box>
              </Box>
              </Collapse>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
          {collections.map((collection, index) => {
            const summary = collectionSummaries[collection.id];
            const totalReleased = summary?.summary.totalReleased ?? 0;
            const ownedFigurines = summary?.collection.ownedFigurines ?? 0;
            const hasProgressData = totalReleased > 0;
            const progressPercent = hasProgressData ? Math.round((ownedFigurines / totalReleased) * 100) : 0;

            return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={collection.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  overflow: "hidden",
                  cursor: canReadCollectionFigurines ? "pointer" : "default",
                  transition: "all 0.3s ease",
                  border: collection.isFavorite
                    ? `1px solid ${alpha(theme.palette.warning.main, 0.6)}`
                    : `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.94)} 0%, ${alpha(theme.palette.background.default, 0.96)} 100%)`,
                  backdropFilter: "blur(10px)",
                  ...(collection.isFavorite && {
                    animation: "favoriteCollectionPulse 3.6s ease-in-out infinite",
                    "@keyframes favoriteCollectionPulse": {
                      "0%, 100%": { boxShadow: `0 0 0 0 ${alpha(theme.palette.warning.main, 0.55)}` },
                      "50%": { boxShadow: `0 0 22px 5px ${alpha(theme.palette.warning.main, 0.55)}` },
                    },
                  }),
                  ...(canReadCollectionFigurines
                    ? {}
                    : {
                        opacity: 0.62,
                        filter: "grayscale(1) brightness(0.78) contrast(0.88)",
                        border: `1px solid ${alpha(theme.palette.text.disabled, 0.5)}`,
                      }),
                  "&:hover": {
                    transform: canReadCollectionFigurines ? "translateY(-8px)" : "none",
                    boxShadow: canReadCollectionFigurines ? `0 16px 32px ${alpha(theme.palette.primary.main, 0.24)}` : "none",
                    border: canReadCollectionFigurines ? `1px solid ${alpha(theme.palette.primary.main, 0.4)}` : `1px solid ${alpha(theme.palette.text.disabled, 0.5)}`,
                  },
                }}
                onClick={canReadCollectionFigurines ? () => navigate(`/collections/${collection.id}`, { state: { collection } }) : undefined}
              >
                {collection.isFavorite && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: -38,
                      zIndex: 2,
                      width: 150,
                      py: 0.35,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: "rotate(45deg)",
                      background: `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 100%)`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.38)}`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.66rem",
                        fontWeight: 800,
                        color: "#000",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        lineHeight: 1,
                      }}
                    >
                      {t("myCollection.favorite")}
                    </Typography>
                  </Box>
                )}

                {/* Collection cover gradient */}
                {collection.imageUrl ? (
                  <Box
                    component="img"
                    src={collection.imageUrl}
                    alt={collection.name}
                    sx={{
                      height: 140,
                      width: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <CardMedia
                    sx={{
                      height: 140,
                      background: `linear-gradient(135deg, 
                      ${coverGradients[collection.id % coverGradients.length][0]} 0%, 
                      ${coverGradients[collection.id % coverGradients.length][1]} 100%)`,
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        inset: 0,
                        background:
                          `linear-gradient(45deg, ${alpha(theme.palette.common.white, 0.1)} 25%, transparent 25%, transparent 50%, ${alpha(theme.palette.common.white, 0.1)} 50%, ${alpha(theme.palette.common.white, 0.1)} 75%, transparent 75%, transparent)`,
                        backgroundSize: "20px 20px",
                        animation: "shimmer 3s infinite",
                      },
                      "@keyframes shimmer": {
                        "0%": { backgroundPosition: "0 0" },
                        "100%": { backgroundPosition: "20px 20px" },
                      },
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        color: alpha(theme.palette.common.white, 0.9),
                        fontWeight: 700,
                        textShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.4)}`,
                        zIndex: 1,
                        textAlign: "center",
                        px: 2,
                      }}
                    >
                      📦
                    </Typography>
                  </CardMedia>
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "primary.main",
                          mb: 0.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {collection.name}
                      </Typography>
                      {collection.description && (
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                          {collection.description}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, collection);
                      }}
                      sx={{ color: "text.secondary" }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Figurine count badge */}
                  <Box
                    sx={{
                      display: "inline-block",
                      px: 1.5,
                      py: 0.75,
                      background: alpha(theme.palette.info.main, 0.12),
                      borderRadius: 1.5,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "info.main",
                        fontWeight: 600,
                      }}
                    >
                      {t("myCollection.totalFigurines", { count: collection.figurineIds.length })}
                    </Typography>
                  </Box>

                  {/* Owned vs. released progress */}
                  <Tooltip title={t("myCollection.progress.tooltip")} arrow>
                    <Box sx={{ mt: 1.25, display: "flex", alignItems: "center", gap: 1.25 }}>
                      <Box
                        key={summary ? "loaded" : "loading"}
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          p: 0.55,
                          flexShrink: 0,
                          background: summary
                            ? `conic-gradient(${theme.palette.success.main} 0% ${progressPercent}%, ${alpha(theme.palette.common.white, 0.14)} ${progressPercent}% 100%)`
                            : alpha(theme.palette.common.white, 0.12),
                          boxShadow: summary ? `0 0 12px ${alpha(theme.palette.success.main, 0.28)}` : "none",
                          transition: "background 500ms ease, box-shadow 500ms ease",
                          ...(summary && {
                            animation: `donutRingReveal 650ms cubic-bezier(0.2, 0.9, 0.2, 1) ${Math.min(index * 60, 360)}ms both`,
                          }),
                          "@keyframes donutRingReveal": {
                            "0%": { transform: "scale(0.7)", opacity: 0 },
                            "65%": { transform: "scale(1.08)", opacity: 1 },
                            "100%": { transform: "scale(1)", opacity: 1 },
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            bgcolor: alpha(theme.palette.background.paper, 0.96),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {summary ? (
                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "success.main", lineHeight: 1 }}>
                              {progressPercent}%
                            </Typography>
                          ) : (
                            <CircularProgress size={16} sx={{ color: "text.disabled" }} />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block" }}>
                          {t("myCollection.progress.title")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 700 }}>
                          {summary
                            ? t("myCollection.progress.label", { owned: ownedFigurines, total: totalReleased })
                            : t("myCollection.progress.loading")}
                        </Typography>
                      </Box>
                    </Box>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
            );
          })}
          </Grid>
        </>
      )}

      {/* Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {hasPermission("collections:update") && (
          <MenuItem onClick={handleEdit} sx={{ gap: 1 }}>
            <EditIcon fontSize="small" /> {t("myCollection.edit")}
          </MenuItem>
        )}
        {hasPermission("collections:update") && selectedCollection && !selectedCollection.isFavorite && (
          <MenuItem
            onClick={() => void handleSetFavoriteClick()}
            sx={{ gap: 1 }}
            disabled={settingFavoriteId === selectedCollection.id}
          >
            <StarOutlineOutlinedIcon fontSize="small" /> {t("myCollection.setAsFavorite")}
          </MenuItem>
        )}
        {hasPermission("collections:duplicate") && (
        <MenuItem onClick={() => void handleDuplicateClick()} sx={{ gap: 1 }} disabled={duplicatingCollection}>
          <ContentCopyIcon fontSize="small" /> {t("myCollection.duplicate")}
        </MenuItem>
        )}
        {hasPermission("collections:delete") && (
          <MenuItem onClick={handleDeleteClick} sx={{ gap: 1, color: "error.main" }}>
            <DeleteIcon fontSize="small" /> {t("myCollection.delete")}
          </MenuItem>
        )}
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deletingCollection && setDeleteDialogOpen(false)}>
        <DialogTitle>{t("myCollection.dialogDelete.title")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("myCollection.dialogDelete.description", { name: selectedCollection?.name })}
          </Typography>
          <Typography sx={{ mt: 2 }}>
            {t("myCollection.dialogDelete.description2")}
          </Typography>
          <Typography sx={{ mt: 2 }}>
            {t("myCollection.dialogDelete.description3")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deletingCollection} startIcon={<CancelOutlinedIcon />}>{t("myCollection.dialogDelete.cancel")}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deletingCollection} startIcon={<DeleteIcon />}>
            {deletingCollection ? t("myCollection.dialogDelete.deleting") : t("myCollection.dialogDelete.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: 360,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1.5 }}>{t("myCollection.dialogEdit.title")}</DialogTitle>
        <DialogContent
          sx={{
            pt: 2.5,
            pb: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            minHeight: 220,
          }}
        >
          <TextField
            label={t("myCollection.dialogEdit.name")}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
            size="medium"
            autoFocus
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 0.5 }}
          />
          <TextField
            label={t("myCollection.dialogEdit.imageUrl")}
            value={editImageUrl}
            onChange={(e) => setEditImageUrl(e.target.value)}
            fullWidth
            size="medium"
            autoFocus
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 0.5 }}
          />
          <TextField
            label={t("myCollection.dialogEdit.description")}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            fullWidth
            size="medium"
            multiline
            minRows={4}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={savingEdit} startIcon={<CancelOutlinedIcon />}>
            {t("myCollection.dialogEdit.cancel")}
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={savingEdit} startIcon={savingEdit ? undefined : <SaveOutlinedIcon />}>
            {savingEdit ? t("myCollection.dialogEdit.saving") : t("myCollection.dialogEdit.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
