import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { deleteCollection, duplicateCollection, getCollections, updateCollection } from "../api/collectionApi";
import type { Collection } from "../types/collection";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

export default function CollectionsListPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState(false);
  const [duplicatingCollection, setDuplicatingCollection] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCollections();
      setCollections(data);
    } catch (err) {
      setError(getApiErrorMessage(err, { action: "load", resource: "collections" }));
    } finally {
      setLoading(false);
    }
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
      setSuccessMessage(`Collection "${selectedCollection.name}" duplication started.`);
    } catch (err) {
      setError(getApiErrorMessage(err, { action: "update", resource: "collection" }));
    } finally {
      setDuplicatingCollection(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCollection) return;

    setDeletingCollection(true);
    setError(null);
    try {
      await deleteCollection(selectedCollection.id);
      setCollections((currentCollections) =>
        currentCollections.filter((collection) => collection.id !== selectedCollection.id)
      );
      setSuccessMessage(`Collection "${selectedCollection.name}" was removed.`);
      setDeleteDialogOpen(false);
      setSelectedCollection(null);
    } catch (err) {
      setError(getApiErrorMessage(err, { action: "delete", resource: "collection" }));
    } finally {
      setDeletingCollection(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCollection) return;

    const nextName = editName.trim();
    if (!nextName) {
      setError("Collection name is required.");
      return;
    }

    setSavingEdit(true);
    setError(null);
    try {
      const updated = await updateCollection(selectedCollection.id, {
        name: nextName,
        description: editDescription.trim() || undefined,
      });

      setCollections((currentCollections) =>
        currentCollections.map((collection) =>
          collection.id === updated.id ? updated : collection
        )
      );
      setSelectedCollection(updated);
      setEditDialogOpen(false);
      setSuccessMessage(`Collection "${updated.name}" was updated.`);
    } catch (err) {
      setError(getApiErrorMessage(err, { action: "update", resource: "collection" }));
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#d4af37" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.default",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          mx: { xs: -2, md: -3 },
          px: { xs: 2, md: 3 },
          py: 2,
          borderBottom: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: "1.5rem", md: "2.125rem" },
            fontWeight: 700,
            background: "linear-gradient(135deg, #d4af37 0%, #4fc3f7 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            flexShrink: 0,
          }}
        >
          💫 My Collections
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
              onClick={() => navigate("/figurines")}
          sx={{
            background: "linear-gradient(135deg, #d4af37 0%, #e6c547 100%)",
            color: "#000",
            fontWeight: 600,
            flexShrink: 0,
            "&:hover": {
              background: "linear-gradient(135deg, #e6c547 0%, #d4af37 100%)",
              boxShadow: "0 8px 24px rgba(212,175,55,0.3)",
            },
          }}
        >
          New Collection
        </Button>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
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
            No collections yet
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 560 }}>
            Collections are created automatically when you add a figurine to one.
            Open any figurine and use Add to Collection to create your first collection.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/figurines")}
            sx={{
              background: "linear-gradient(135deg, #d4af37 0%, #e6c547 100%)",
              color: "#000",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #e6c547 0%, #d4af37 100%)",
              },
            }}
          >
            Browse Figurines
          </Button>
        </Box>
      ) : (
        <>
          <Card
            sx={{
              mb: 3,
              border: "1px solid rgba(212,175,55,0.2)",
              background: "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(79,195,247,0.12) 100%)",
              backdropFilter: "blur(10px)",
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: "#4fc3f7", letterSpacing: 1.2 }}>
                Collections Overview
              </Typography>
              {largestCollection && (
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                  Largest collection: <strong>{largestCollection.name}</strong> with {largestCollection.figurineIds.length}{" "}
                  figurine{largestCollection.figurineIds.length !== 1 ? "s" : ""}
                </Typography>
              )}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 1 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#d4af37", lineHeight: 1 }}>
                    {collections.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    collection{collections.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#d4af37", lineHeight: 1 }}>
                    {totalFigurinesAcrossCollections}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    figurines across all collections
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#d4af37", lineHeight: 1 }}>
                    {uniqueFigurinesAcrossCollections}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    unique figurines across collections
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#d4af37", lineHeight: 1 }}>
                    {averageFigurinesPerCollection.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    average figurines per collection
                  </Typography>
                </Box>
              </Box>

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
                    border: "1px solid rgba(79,195,247,0.2)",
                    background: "rgba(9,20,40,0.35)",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#4fc3f7", mb: 1.5, fontWeight: 700 }}>
                    Collection Size Distribution
                  </Typography>
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
                            <Typography variant="caption" sx={{ color: "#d4af37", fontWeight: 700, flexShrink: 0 }}>
                              {count}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              background: "rgba(79,195,247,0.12)",
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                height: "100%",
                                width: `${Math.max(barWidth, count > 0 ? 6 : 0)}%`,
                                borderRadius: 999,
                                background: "linear-gradient(90deg, #4fc3f7 0%, #d4af37 100%)",
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
                    border: "1px solid rgba(212,175,55,0.2)",
                    background: "rgba(26,20,8,0.28)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#d4af37", fontWeight: 700 }}>
                    Uniqueness Score
                  </Typography>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      p: "10px",
                      background: `conic-gradient(#4fc3f7 0% ${uniquenessPercent}%, rgba(212,175,55,0.2) ${uniquenessPercent}% 100%)`,
                      boxShadow: "0 8px 24px rgba(79,195,247,0.2)",
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
                        bgcolor: "rgba(8,12,24,0.95)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="h5" sx={{ color: "#4fc3f7", fontWeight: 800, lineHeight: 1 }}>
                        {uniquenessPercent}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        unique
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 220 }}>
                    {uniqueFigurinesAcrossCollections} unique out of {totalFigurinesAcrossCollections} total figurine entries.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
          {collections.map((collection) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={collection.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  border: "1px solid rgba(212,175,55,0.15)",
                  background: "linear-gradient(135deg, rgba(6,8,24,0.8) 0%, rgba(20,15,40,0.8) 100%)",
                  backdropFilter: "blur(10px)",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 16px 32px rgba(212,175,55,0.2)",
                    border: "1px solid rgba(212,175,55,0.3)",
                  },
                }}
                onClick={() => navigate(`/collections/${collection.id}`, { state: { collection } })}
              >
                {/* Collection cover gradient */}
                <CardMedia
                  sx={{
                    height: 140,
                    background: `linear-gradient(135deg, 
                      ${["#d4af37", "#4fc3f7", "#81d4fa", "#42a5f5", "#ff9800"][collection.id % 5]} 0%, 
                      ${["#4fc3f7", "#81d4fa", "#ff9800", "#d4af37", "#42a5f5"][collection.id % 5]} 100%)`,
                    position: "relative",
                    overflow: "hidden",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(45deg, rgba(212,175,55,0.1) 25%, transparent 25%, transparent 50%, rgba(212,175,55,0.1) 50%, rgba(212,175,55,0.1) 75%, transparent 75%, transparent)",
                      backgroundSize: "20px 20px",
                      animation: "shimmer 3s infinite",
                    },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    "@keyframes shimmer": {
                      "0%": { backgroundPosition: "0 0" },
                      "100%": { backgroundPosition: "20px 20px" },
                    },
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      color: "rgba(255,255,255,0.9)",
                      fontWeight: 700,
                      textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                      zIndex: 1,
                      textAlign: "center",
                      px: 2,
                    }}
                  >
                    📦
                  </Typography>
                </CardMedia>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "#d4af37",
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
                      background: "rgba(79,195,247,0.1)",
                      borderRadius: "12px",
                      border: "1px solid rgba(79,195,247,0.2)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#4fc3f7",
                        fontWeight: 600,
                      }}
                    >
                      {collection.figurineIds.length} figurine{collection.figurineIds.length !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          </Grid>
        </>
      )}

      {/* Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit} sx={{ gap: 1 }}>
          <EditIcon fontSize="small" /> Edit
        </MenuItem>
        <MenuItem onClick={() => void handleDuplicateClick()} sx={{ gap: 1 }} disabled={duplicatingCollection}>
          <ContentCopyIcon fontSize="small" /> Duplicate
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ gap: 1, color: "error.main" }}>
          <DeleteIcon fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deletingCollection && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Collection?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedCollection?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deletingCollection}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deletingCollection}>
            {deletingCollection ? "Deleting..." : "Delete"}
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
        <DialogTitle sx={{ pb: 1.5 }}>Edit Collection</DialogTitle>
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
            label="Collection name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
            size="medium"
            autoFocus
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 0.5 }}
          />
          <TextField
            label="Description (optional)"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            fullWidth
            size="medium"
            multiline
            minRows={4}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={savingEdit}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={savingEdit}>
            {savingEdit ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
