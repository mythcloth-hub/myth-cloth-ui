import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  Pagination,
  Skeleton,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";

import { getFigurines } from "../api/figurineApi";
import type { Figurine } from "../types/figurine";

const PAGE_SIZE = 12;

type Badge = { label: string; color: "warning" | "info" | "success" | "error" | "default" };

function getBadges(f: Figurine): Badge[] {
  const badges: Badge[] = [];
  if (f.isOriginalColorEdition) badges.push({ label: "OCE",          color: "warning" });
  if (f.isRevival)              badges.push({ label: "Revival",      color: "info"    });
  if (f.isBattleDamaged)        badges.push({ label: "Battle Dmg",   color: "error"   });
  if (f.isMetalBody)            badges.push({ label: "Metal Body",   color: "default" });
  if (f.isGoldenArmor)          badges.push({ label: "Gold Armor",   color: "warning" });
  if (f.isGold24kEdition)       badges.push({ label: "Gold 24K",     color: "warning" });
  if (f.isMangaVersion)         badges.push({ label: "Manga",        color: "info"    });
  if (f.isPlainCloth)           badges.push({ label: "Plain Cloth",  color: "default" });
  if (f.isMultiPack)            badges.push({ label: "Multi-Pack",   color: "success" });
  return badges;
}

function FigurineCard({ figurine, onClick }: { figurine: Figurine; onClick: () => void }) {
  const imageUrl = figurine.officialImageUrls?.[0] ?? null;
  const badges = getBadges(figurine);

  return (
    <Card
      onClick={onClick}
      sx={
        {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 12px 40px rgba(212, 175, 55, 0.25)",
          borderColor: "rgba(212, 175, 55, 0.5)",
        },
      }}
    >
      {/* Image area */}
      <Box sx={{ position: "relative", paddingTop: "120%", bgcolor: "#0a0b14", flexShrink: 0 }}>
        {imageUrl ? (
          <CardMedia
            component="img"
            image={imageUrl}
            alt={figurine.name}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 1,
              color: "text.secondary",
            }}
          >
            <ImageNotSupportedOutlinedIcon sx={{ fontSize: 48, opacity: 0.3 }} />
            <Typography variant="caption" sx={{ opacity: 0.4 }}>
              No image
            </Typography>
          </Box>
        )}

        {/* Bottom gradient overlay */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "45%",
            background: "linear-gradient(transparent, rgba(10, 11, 20, 0.92))",
            pointerEvents: "none",
          }}
        />

        {/* Edition badges – top-right corner */}
        {badges.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 0.5,
            }}
          >
            {badges.map((b) => (
              <Chip
                key={b.label}
                label={b.label}
                color={b.color}
                size="small"
                sx={{
                  fontSize: "0.6rem",
                  height: 18,
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                  opacity: 0.92,
                }}
              />
            ))}
          </Box>
        )}

        {/* Lineup badge – bottom-left inside image */}
        <Box sx={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <Typography
            variant="caption"
            sx={{
              color: "primary.main",
              fontWeight: 700,
              fontSize: "0.65rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {figurine.lineUp.description}
          </Typography>
        </Box>
      </Box>

      {/* Card content */}
      <CardContent sx={{ flexGrow: 1, p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          noWrap
          title={figurine.name}
          sx={{ color: "text.primary", mb: 0.5, lineHeight: 1.3 }}
        >
          {figurine.name}
        </Typography>

        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mb: 0.25, fontSize: "0.7rem" }}
          noWrap
          title={figurine.series.description}
        >
          {figurine.series.description}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: "rgba(212, 175, 55, 0.55)",
            display: "block",
            fontSize: "0.68rem",
          }}
          noWrap
          title={figurine.group.description}
        >
          {figurine.group.description}
        </Typography>
      </CardContent>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card sx={{ height: "100%" }}>
      <Skeleton variant="rectangular" sx={{ paddingTop: "120%" }} />
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Skeleton variant="text" width="80%" height={18} />
        <Skeleton variant="text" width="60%" height={14} sx={{ mt: 0.5 }} />
        <Skeleton variant="text" width="50%" height={14} sx={{ mt: 0.25 }} />
      </CardContent>
    </Card>
  );
}

export default function FigurineCollectionPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const [figurines, setFigurines] = useState<Figurine[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setFigurines([]);
    getFigurines(page - 1, PAGE_SIZE)
      .then((data) => {
        setFigurines(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Failed to load figurines. Please check your connection and try again.");
      })
      .finally(() => setLoading(false));
  }, [page]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setSearchParams({ page: String(value) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }}>
            Collection
          </Typography>
          {!loading && totalElements > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {totalElements.toLocaleString()} figurines · page {page} of {totalPages}
            </Typography>
          )}
        </Box>
        <Button variant="contained" onClick={() => navigate("/figurines/new")}>
          + New Figurine
        </Button>
      </Box>

      {/* Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {loading
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Grid key={i} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                <CardSkeleton />
              </Grid>
            ))
          : figurines.map((fig) => (
              <Grid key={fig.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                <FigurineCard figurine={fig} onClick={() => navigate(`/figurines/${fig.id}`)} />
              </Grid>
            ))}
      </Grid>

      {/* Empty state */}
      {!loading && figurines.length === 0 && !errorMessage && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 300,
            gap: 1,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No figurines in the collection yet.
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
            sx={{
              "& .MuiPaginationItem-root": { color: "text.secondary" },
              "& .MuiPaginationItem-root.Mui-selected": {
                backgroundColor: "rgba(212, 175, 55, 0.2)",
                color: "primary.main",
                fontWeight: 700,
              },
            }}
          />
        </Box>
      )}

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
