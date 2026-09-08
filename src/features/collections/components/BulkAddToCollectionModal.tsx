import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { getCollections, assignFigurinesToCollections } from "../api/collectionApi";
import type { Collection } from "../types/collection";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

interface BulkAddToCollectionModalProps {
  open: boolean;
  onClose: () => void;
  figurineIds: number[];
  selectedCount: number;
  onSuccess?: () => void;
}

export default function BulkAddToCollectionModal({
  open,
  onClose,
  figurineIds,
  selectedCount,
  onSuccess,
}: BulkAddToCollectionModalProps) {
  const { t } = useTranslation("figurines");
  const theme = useTheme();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionImageUrl, setNewCollectionImageUrl] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleModalClose = () => {
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open]);

  const loadCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCollections();
      setCollections(data);
      setSelectedCollections(new Set());
    } catch (err) {
      setError(getApiErrorMessage(err, { action: "load", resource: "collections" }));
    } finally {
      setLoading(false);
    }
  };

  const toggleCollection = (collectionId: number) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  const handleCreateAndAdd = async () => {
    const collectionName = newCollectionName.trim();
    if (!collectionName) {
      setError(t("collection.bulkAddToCollectionModal.new.name.required"));
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await assignFigurinesToCollections({
        figurineIds,
        collectionMode: "CREATE",
        collection: {
          name: collectionName,
          imageUrl: newCollectionImageUrl.trim() || undefined,
          description: newCollectionDesc.trim() || undefined,
        },
      });

      setSuccessMessage(`✨ ${t("collection.bulkAddToCollectionModal.createdAndAddedSuccessful", { name: collectionName, count: selectedCount })}`);
      setNewCollectionName("");
      setNewCollectionImageUrl("");
      setNewCollectionDesc("");

      // Close after brief delay to show success
      setTimeout(() => {
        onSuccess?.();
        handleModalClose();
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError(t("collection.bulkAddToCollectionModal.duplicateName", { name: collectionName }));
      } else {
        setError(getApiErrorMessage(err, { action: "create", resource: "collection" }));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleAddToSelected = async () => {
    if (selectedCollections.size === 0) {
      setError(t("collection.bulkAddToCollectionModal.collectionRequired"));
      return;
    }

    const selectedCollectionIds = Array.from(selectedCollections);
    if (selectedCollectionIds.length === 0) {
      setError(t("collection.bulkAddToCollectionModal.collectionRequired"));
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await assignFigurinesToCollections({
        figurineIds,
        collectionMode: "EXISTING",
        collectionIds: selectedCollectionIds,
      });

      const collectionCount = selectedCollections.size;
      setSuccessMessage(`✨ ${t("collection.bulkAddToCollectionModal.addedSuccessful", { count: collectionCount, collection: collectionCount })}`);

      setTimeout(() => {
        onSuccess?.();
        handleModalClose();
      }, 1500);
    } catch (err) {
      setError(getApiErrorMessage(err, { action: "update", resource: "figurines to collection" }));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleModalClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "primary.main",
          textAlign: "center",
          pb: 1,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        💫 {t("collection.bulkAddToCollectionModal.title", { count: selectedCount })}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Selected count info */}
        <Box sx={{ mb: 2, p: 1.5, bgcolor: alpha(theme.palette.secondary.main, 0.08), borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("collection.bulkAddToCollectionModal.selected")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "secondary.main",
              fontWeight: 600,
              mt: 0.5,
            }}
          >
            {t("collection.bulkAddToCollectionModal.totalSelected", { count: selectedCount })}
          </Typography>
        </Box>

        {/* Error messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Success message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* Loading state */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <>
            {/* Existing collections */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "primary.main", fontWeight: 600, mb: 1 }}
              >
                {t("collection.bulkAddToCollectionModal.existing.title")}
              </Typography>

              {collections.length === 0 ? (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("collection.bulkAddToCollectionModal.existing.noCollections")}
                </Typography>
              ) : (
                <List
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    borderRadius: 1,
                    maxHeight: 300,
                    overflow: "auto",
                  }}
                >
                  {collections.map((collection, index) => {
                    const isSelected = selectedCollections.has(collection.id);
                    return (
                      <div key={collection.id}>
                        <ListItemButton
                          onClick={() => toggleCollection(collection.id)}
                          sx={{
                            backgroundColor: isSelected
                              ? alpha(theme.palette.primary.main, 0.1)
                              : "transparent",
                            "&:hover": {
                              backgroundColor: alpha(theme.palette.primary.main, 0.15),
                            },
                            transition: "all 0.2s ease",
                          }}
                        >
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={isSelected}
                              tabIndex={-1}
                              disableRipple
                              sx={{
                                color: isSelected ? "primary.main" : alpha(theme.palette.primary.main, 0.35),
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{
                                  color: isSelected ? "primary.main" : "text.primary",
                                  fontWeight: isSelected ? 600 : 500,
                                }}
                              >
                                {collection.name}
                              </Typography>
                            }
                            secondary={
                              <Stack direction="row" gap={1} sx={{ mt: 0.5 }}>
                                {collection.description && (
                                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    {collection.description}
                                  </Typography>
                                )}
                                <Chip
                                  label={`${t("collection.bulkAddToCollectionModal.existing.figurinesPerCollection", { count: collection.totalFigurines })}`}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: "0.65rem",
                                    bgcolor: alpha(theme.palette.secondary.main, 0.12),
                                    color: "secondary.main",
                                  }}
                                />
                              </Stack>
                            }
                          />
                          {isSelected && (
                            <FavoriteIcon sx={{ color: "primary.main", ml: 1 }} />
                          )}
                        </ListItemButton>
                        {index < collections.length - 1 && (
                          <Divider sx={{ opacity: 0.1 }} />
                        )}
                      </div>
                    );
                  })}
                </List>
              )}
            </Box>

            {/* Create new collection section */}
            <Divider sx={{ my: 2, opacity: 0.1 }} />

            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "primary.main", fontWeight: 600, mb: 1, display: "flex", alignItems: "center", gap: 1 }}
              >
                <AddIcon sx={{ fontSize: "1.1rem" }} />
                {t("collection.bulkAddToCollectionModal.new.title")}
              </Typography>

              <TextField
                fullWidth
                label={t("collection.bulkAddToCollectionModal.new.name.label")}
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                size="small"
                disabled={creating}
                sx={{ mb: 1 }}
              />

              <TextField
                fullWidth
                label={t("collection.bulkAddToCollectionModal.new.imageUrlLabel")}
                value={newCollectionImageUrl}
                onChange={(e) => setNewCollectionImageUrl(e.target.value)}
                size="small"
                disabled={creating}
                sx={{ mb: 1 }}
              />

              <TextField
                fullWidth
                label={t("collection.bulkAddToCollectionModal.new.descriptionLabel")}
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                size="small"
                multiline
                rows={2}
                disabled={creating}
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          p: 2,
          gap: 1,
        }}
      >
        <Button
          startIcon={<CancelOutlinedIcon />}
          onClick={handleModalClose}
          disabled={creating}
        >
          {t("collection.bulkAddToCollectionModal.actions.cancel")}
        </Button>

        {figurineIds.length > 0 && (
          <Button
            onClick={handleCreateAndAdd}
            disabled={creating || !newCollectionName.trim()}
            variant="contained"
            color="primary"
            startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {creating ? t("collection.bulkAddToCollectionModal.actions.creating") : t("collection.bulkAddToCollectionModal.actions.create", { count: selectedCount })}
          </Button>
        )}

        {selectedCollections.size > 0 && (
          <Button
            onClick={handleAddToSelected}
            disabled={creating}
            variant="contained"
            color="secondary"
            startIcon={creating ? <CircularProgress size={20} /> : <FavoriteIcon />}
          >
            {creating ? t("collection.bulkAddToCollectionModal.actions.adding") : t("collection.bulkAddToCollectionModal.actions.add", { count: selectedCollections.size })}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
