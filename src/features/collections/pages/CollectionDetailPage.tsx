import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { getCollectionById, updateCollection, removeFigurineFromCollection } from "../api/collectionApi";
import type { Collection } from "../types/collection";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import { getFigurineById } from "../../figurines/api/figurineApi";
import type { Figurine } from "../../figurines/types/figurine";

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [figurines, setFigurines] = useState<Figurine[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    loadCollection();
  }, [id]);

  const loadCollection = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getCollectionById(Number(id));
      setCollection(data);
      setNewName(data.name);

      // Fetch all figurines in the collection
      const figureList = await Promise.all(
        data.figurineIds.map((fid) => getFigurineById(fid).catch(() => null))
      );
      setFigurines(figureList.filter((f) => f !== null) as Figurine[]);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "collection" }));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFigurine = async (figurineId: number) => {
    if (!collection) return;

    try {
      await removeFigurineFromCollection(collection.id, figurineId);
      setFigurines(figurines.filter((f) => f.id !== figurineId));
      setCollection({
        ...collection,
        figurineIds: collection.figurineIds.filter((id) => id !== figurineId),
      });
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(err, { action: "remove", resource: "figurine from collection" })
      );
    }
  };

  const handleSaveName = async () => {
    if (!collection || newName.trim() === collection.name) {
      setEditingName(false);
      return;
    }

    try {
      const updated = await updateCollection(collection.id, { name: newName });
      setCollection(updated);
      setEditingName(false);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, { action: "update", resource: "collection" }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#d4af37" }} />
      </Box>
    );
  }

  if (!collection) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error">Collection not found.</Alert>
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
          gap: 2,
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
        <Tooltip title="Back to Collections">
          <IconButton onClick={() => navigate("/collections")} sx={{ color: "primary.main" }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        {editingName ? (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flex: 1 }}>
            <TextField
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              size="small"
              autoFocus
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "text.primary",
                  "& fieldset": {
                    borderColor: "rgba(212,175,55,0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(212,175,55,0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#d4af37",
                  },
                },
              }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveName}
              sx={{
                background: "linear-gradient(135deg, #d4af37 0%, #e6c547 100%)",
                color: "#000",
              }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditingName(false);
                setNewName(collection.name);
              }}
            >
              Cancel
            </Button>
          </Box>
        ) : (
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: "1.5rem", md: "2rem" },
                fontWeight: 700,
                background: "linear-gradient(135deg, #d4af37 0%, #4fc3f7 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {collection.name}
            </Typography>
            {collection.description && (
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                {collection.description}
              </Typography>
            )}
          </Box>
        )}

        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setEditingName(true)}
          disabled={editingName}
          sx={{ flexShrink: 0 }}
        >
          Edit
        </Button>
      </Box>

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

      {figurines.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            gap: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: "text.secondary" }}>
            No figurines in this collection yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/figurines")}
            sx={{
              background: "linear-gradient(135deg, #4fc3f7 0%, #81d4fa 100%)",
              color: "#000",
              fontWeight: 600,
            }}
          >
            Browse Figurines
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`${figurines.length} figurine${figurines.length !== 1 ? "s" : ""}`}
              sx={{
                bgcolor: "rgba(212,175,55,0.15)",
                color: "#d4af37",
                fontWeight: 600,
              }}
            />
          </Box>

          <Grid container spacing={3}>
            {figurines.map((figurine) => {
              const imageUrl = figurine.officialImageUrls?.[0] ?? null;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={figurine.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid rgba(212,175,55,0.15)",
                      background: "linear-gradient(135deg, rgba(6,8,24,0.8) 0%, rgba(20,15,40,0.8) 100%)",
                      backdropFilter: "blur(10px)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 32px rgba(212,175,55,0.15)",
                        border: "1px solid rgba(212,175,55,0.3)",
                      },
                      position: "relative",
                    }}
                  >
                    {imageUrl ? (
                      <CardMedia
                        component="img"
                        image={imageUrl}
                        alt={figurine.name}
                        sx={{
                          height: 200,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 200,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "rgba(212,175,55,0.05)",
                          color: "text.secondary",
                        }}
                      >
                        <Typography variant="body2">No image</Typography>
                      </Box>
                    )}

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#d4af37",
                          mb: 0.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {figurine.displayableName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {figurine.series.description}
                      </Typography>
                    </CardContent>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        p: 1,
                        borderTop: "1px solid rgba(212,175,55,0.1)",
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={() => navigate(`/figurines/${figurine.id}`)}
                      >
                        View
                      </Button>
                      <Tooltip title="Remove from collection">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveFigurine(figurine.id)}
                          sx={{ color: "error.main" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Box>
  );
}
