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
import AddIcon from "@mui/icons-material/Add";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { getCollections, assignFigurinesToCollections } from "../api/collectionApi";
import type { Collection } from "../types/collection";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

interface AddToCollectionModalProps {
  open: boolean;
  onClose: () => void;
  figurineId: number;
  figurineName: string;
  onSuccess?: () => void;
}

export default function AddToCollectionModal({
  open,
  onClose,
  figurineId,
  figurineName,
  onSuccess,
}: AddToCollectionModalProps) {
  const { t } = useTranslation("figurines");

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionImageUrl, setNewCollectionImageUrl] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load collections on open
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccessMessage(null);
      setNewCollectionName("");
      setNewCollectionImageUrl("");
      setNewCollectionDesc("");
      setSelectedCollections(new Set());
      loadCollections();
      return;
    }

    // Ensure any transient state is cleared after close as well.
    setError(null);
    setSuccessMessage(null);
    setSelectedCollections(new Set());
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
      setError(t("collection.addToCollectionModal.new.name.required"));
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await assignFigurinesToCollections({
        figurineIds: [figurineId],
        collectionMode: "CREATE",
        collection: {
          name: collectionName,
          imageUrl: newCollectionImageUrl.trim() || undefined,
          description: newCollectionDesc.trim() || undefined,
        },
      });

      setSuccessMessage(`✨ ${t("collection.addToCollectionModal.createdAndAddedSuccessful", { collection: collectionName, figurine: figurineName })}`);
      setNewCollectionName("");
      setNewCollectionImageUrl("");
      setNewCollectionDesc("");

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError(t("collection.addToCollectionModal.new.name.duplicate", { name: collectionName }));
      } else {
        setError(getApiErrorMessage(err, { action: "create", resource: "collection" }));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleAddToSelected = async () => {
    if (selectedCollections.size === 0) {
      setError(t("collection.addToCollectionModal.collectionRequired"));
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await assignFigurinesToCollections({
        figurineIds: [figurineId],
        collectionMode: "EXISTING",
        collectionIds: Array.from(selectedCollections),
      });

      const count = selectedCollections.size;
      setSuccessMessage(`✨ ${t("collection.addToCollectionModal.addedSuccessful", { name: figurineName, count })}`);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(getApiErrorMessage(err, { action: "update", resource: "figurine to collection" }));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: "linear-gradient(135deg, rgba(6,8,24,0.95) 0%, rgba(20,15,40,0.95) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(212,175,55,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#d4af37",
          textAlign: "center",
          pb: 1,
          borderBottom: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        💫 {t("collection.addToCollectionModal.title")}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Figurine name info */}
        <Box sx={{ mb: 2, mt: 2, p: 1.5, background: "rgba(79,195,247,0.05)", borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("collection.addToCollectionModal.adding")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#4fc3f7",
              fontWeight: 600,
              mt: 0.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {figurineName}
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
            <CircularProgress sx={{ color: "#d4af37" }} />
          </Box>
        ) : (
          <>
            {/* Existing collections */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "#d4af37", fontWeight: 600, mb: 1 }}
              >
                {t("collection.addToCollectionModal.existing.title")}
              </Typography>

              {collections.length === 0 ? (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("collection.addToCollectionModal.existing.noCollections")}
                </Typography>
              ) : (
                <List
                  sx={{
                    bgcolor: "rgba(212,175,55,0.02)",
                    border: "1px solid rgba(212,175,55,0.1)",
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
                              ? "rgba(212,175,55,0.08)"
                              : "transparent",
                            "&:hover": {
                              backgroundColor: "rgba(212,175,55,0.12)",
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
                                color: isSelected ? "#d4af37" : "rgba(212,175,55,0.3)",
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{
                                  color: isSelected ? "#d4af37" : "text.primary",
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
                                  label={t("collection.addToCollectionModal.existing.figurinesPerCollection", { count: collection.figurineIds.length })}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: "0.65rem",
                                    bgcolor: "rgba(79,195,247,0.1)",
                                    color: "#4fc3f7",
                                  }}
                                />
                              </Stack>
                            }
                          />
                          {isSelected && (
                            <FavoriteIcon sx={{ color: "#d4af37", ml: 1 }} />
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
                sx={{ color: "#d4af37", fontWeight: 600, mb: 1, display: "flex", alignItems: "center", gap: 1 }}
              >
                <AddIcon sx={{ fontSize: "1.1rem" }} />
                {t("collection.addToCollectionModal.new.title")}
              </Typography>

              <TextField
                fullWidth
                label={t("collection.addToCollectionModal.new.name.label")}
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                size="small"
                disabled={creating}
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": {
                    color: "text.primary",
                    "& fieldset": {
                      borderColor: "rgba(212,175,55,0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(212,175,55,0.4)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#d4af37",
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "rgba(255,255,255,0.3)",
                    opacity: 1,
                  },
                }}
              />

              <TextField
                fullWidth
                label={t("collection.addToCollectionModal.new.imageUrlLabel")}
                value={newCollectionImageUrl}
                onChange={(e) => setNewCollectionImageUrl(e.target.value)}
                size="small"
                disabled={creating}
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": {
                    color: "text.primary",
                    "& fieldset": {
                      borderColor: "rgba(212,175,55,0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(212,175,55,0.4)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#d4af37",
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "rgba(255,255,255,0.3)",
                    opacity: 1,
                  },
                }}
              />

              <TextField
                fullWidth
                label={t("collection.addToCollectionModal.new.descriptionLabel")}
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                size="small"
                multiline
                rows={2}
                disabled={creating}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "text.primary",
                    "& fieldset": {
                      borderColor: "rgba(212,175,55,0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(212,175,55,0.4)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#d4af37",
                    },
                  },
                }}
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: "1px solid rgba(212,175,55,0.1)",
          p: 2,
          gap: 1,
        }}
      >
        <Button
          startIcon={<CancelOutlinedIcon />}
          onClick={onClose}
          disabled={creating}
          sx={{
            color: "text.secondary",
            "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
          }}
        >
          {t("collection.addToCollectionModal.actions.cancel")}
        </Button>

        {newCollectionName.trim() && (
          <Button
            onClick={handleCreateAndAdd}
            disabled={creating}
            variant="contained"
            startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{
              background: "linear-gradient(135deg, #d4af37 0%, #e6c547 100%)",
              color: "#000",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #e6c547 0%, #d4af37 100%)",
              },
              "&:disabled": {
                opacity: 0.7,
              },
            }}
          >
            {creating ? t("collection.addToCollectionModal.actions.creating") : t("collection.addToCollectionModal.actions.create")}
          </Button>
        )}

        {selectedCollections.size > 0 && (
          <Button
            onClick={handleAddToSelected}
            disabled={creating}
            variant="contained"
            startIcon={creating ? <CircularProgress size={20} /> : <FavoriteIcon />}
            sx={{
              background: "linear-gradient(135deg, #4fc3f7 0%, #81d4fa 100%)",
              color: "#000",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #81d4fa 0%, #4fc3f7 100%)",
              },
              "&:disabled": {
                opacity: 0.7,
              },
            }}
          >
            {creating ? t("collection.addToCollectionModal.actions.adding") : t("collection.addToCollectionModal.actions.add", { count: selectedCollections.size })}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
