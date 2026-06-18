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
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { getCollections, deleteCollection } from "../api/collectionApi";
import type { Collection } from "../types/collection";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";

export default function CollectionsListPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
      navigate(`/collections/${selectedCollection.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (selectedCollection) {
      try {
        await deleteCollection(selectedCollection.id);
        setCollections(collections.filter((c) => c.id !== selectedCollection.id));
        setDeleteDialogOpen(false);
        setSelectedCollection(null);
      } catch (err) {
        setError(getApiErrorMessage(err, { action: "delete", resource: "collection" }));
        setDeleteDialogOpen(false);
      }
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
          onClick={() => navigate("/collections/new")}
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/collections/new")}
            sx={{
              background: "linear-gradient(135deg, #d4af37 0%, #e6c547 100%)",
              color: "#000",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #e6c547 0%, #d4af37 100%)",
              },
            }}
          >
            Create Your First Collection
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {collections.map((collection) => (
            <Grid item xs={12} sm={6} md={4} key={collection.id}>
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
                onClick={() => navigate(`/collections/${collection.id}`)}
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
      )}

      {/* Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit} sx={{ gap: 1 }}>
          <EditIcon fontSize="small" /> Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ gap: 1, color: "error.main" }}>
          <DeleteIcon fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Collection?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedCollection?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
