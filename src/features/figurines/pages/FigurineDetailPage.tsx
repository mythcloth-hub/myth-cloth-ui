import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { getFigurineById } from "../api/figurineApi";
import type { Figurine } from "../types/figurine";

type Badge = { label: string; color: "warning" | "info" | "success" | "error" | "default" };

function getBadges(f: Figurine): Badge[] {
  const badges: Badge[] = [];
  if (f.isOriginalColorEdition) badges.push({ label: "Original Color Edition", color: "warning" });
  if (f.isRevival)              badges.push({ label: "Revival",                color: "info"    });
  if (f.isBattleDamaged)        badges.push({ label: "Battle Damaged",         color: "error"   });
  if (f.isMetalBody)            badges.push({ label: "Metal Body",             color: "default" });
  if (f.isGoldenArmor)          badges.push({ label: "Golden Armor",           color: "warning" });
  if (f.isGold24kEdition)       badges.push({ label: "Gold 24K Edition",       color: "warning" });
  if (f.isMangaVersion)         badges.push({ label: "Manga Version",          color: "info"    });
  if (f.isPlainCloth)           badges.push({ label: "Plain Cloth",            color: "default" });
  if (f.isMultiPack)            badges.push({ label: "Multi-Pack",             color: "success" });
  return badges;
}

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      {value
        ? <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "success.main" }} />
        : <CancelOutlinedIcon    sx={{ fontSize: 18, color: "text.disabled" }} />}
    </Box>
  );
}

export default function FigurineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [figurine, setFigurine] = useState<Figurine | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getFigurineById(Number(id))
      .then((data) => {
        setFigurine(data);
        setSelectedImage(0);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Failed to load figurine details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!figurine) {
    return (
      <Box sx={{ padding: 3 }}>
        <Alert severity="error">Figurine not found.</Alert>
      </Box>
    );
  }

  const badges = getBadges(figurine);
  const images = figurine.officialImageUrls ?? [];
  const mainImage = images[selectedImage] ?? null;

  return (
    <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Back button + title */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Tooltip title="Back to collection">
          <IconButton onClick={() => navigate(-1)} sx={{ color: "primary.main" }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.4rem", md: "2rem" } }}>
          {figurine.name}
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* ── Left column: images ── */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Main image */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              paddingTop: "125%",
              bgcolor: "#0a0b14",
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid rgba(212,175,55,0.18)",
            }}
          >
            {mainImage ? (
              <Box
                component="img"
                src={mainImage}
                alt={figurine.name}
                sx={{
                  position: "absolute",
                  top: 0, left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "opacity 0.25s",
                }}
              />
            ) : (
              <Box
                sx={{
                  position: "absolute",
                  top: 0, left: 0,
                  width: "100%", height: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column", gap: 1, color: "text.secondary",
                }}
              >
                <ImageNotSupportedOutlinedIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                <Typography variant="body2" sx={{ opacity: 0.4 }}>No image available</Typography>
              </Box>
            )}
          </Box>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
              {images.map((url, i) => (
                <Box
                  key={i}
                  component="img"
                  src={url}
                  alt={`${figurine.name} ${i + 1}`}
                  onClick={() => setSelectedImage(i)}
                  sx={{
                    width: 60,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 1,
                    cursor: "pointer",
                    border: i === selectedImage
                      ? "2px solid rgba(212,175,55,0.9)"
                      : "2px solid rgba(212,175,55,0.15)",
                    opacity: i === selectedImage ? 1 : 0.55,
                    transition: "opacity 0.2s, border-color 0.2s",
                    "&:hover": { opacity: 1 },
                  }}
                />
              ))}
            </Box>
          )}
        </Grid>

        {/* ── Right column: info ── */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Edition badges */}
          {badges.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
              {badges.map((b) => (
                <Chip key={b.label} label={b.label} color={b.color} size="small" sx={{ fontWeight: 600 }} />
              ))}
            </Box>
          )}

          {/* Core catalog info */}
          <Box
            sx={{
              bgcolor: "rgba(212,175,55,0.05)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderRadius: 2,
              p: 2,
              mb: 2,
            }}
          >
            <Grid container spacing={1}>
              {[
                { label: "Series",  value: figurine.series.description  },
                { label: "Line Up", value: figurine.lineUp.description  },
                { label: "Group",   value: figurine.group.description   },
              ].map(({ label, value }) => (
                <Grid key={label} size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", fontSize: "0.65rem" }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.primary", mt: 0.25 }}>
                    {value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Attributes */}
          <Typography variant="overline" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
            Attributes
          </Typography>
          <Box sx={{ mb: 2 }}>
            <BoolRow label="Metal Body"            value={figurine.isMetalBody} />
            <BoolRow label="Articulable"           value={figurine.isArticulable} />
            <BoolRow label="Revival"               value={figurine.isRevival} />
            <BoolRow label="Original Color Ed."    value={figurine.isOriginalColorEdition} />
            <BoolRow label="Battle Damaged"        value={figurine.isBattleDamaged} />
            <BoolRow label="Golden Armor"          value={figurine.isGoldenArmor} />
            <BoolRow label="Gold 24K Edition"      value={figurine.isGold24kEdition} />
            <BoolRow label="Manga Version"         value={figurine.isMangaVersion} />
            <BoolRow label="Plain Cloth"           value={figurine.isPlainCloth} />
            <BoolRow label="Multi-Pack"            value={figurine.isMultiPack} />
          </Box>

          {/* Notes */}
          {figurine.notes && (
            <>
              <Divider sx={{ borderColor: "rgba(212,175,55,0.1)", mb: 1.5 }} />
              <Typography variant="overline" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                Notes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                {figurine.notes}
              </Typography>
            </>
          )}

          {/* Distributors */}
          {figurine.distributors?.length > 0 && (
            <>
              <Divider sx={{ borderColor: "rgba(212,175,55,0.1)", mb: 1.5 }} />
              <Typography variant="overline" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                Distributors
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5 }}>
                {figurine.distributors.map((d, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      bgcolor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(212,175,55,0.08)",
                      borderRadius: 1,
                      px: 1.5,
                      py: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {d.distributor.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {d.currency}
                        {d.price > 0 ? ` · ${d.price.toLocaleString()}` : ""}
                        {d.announcedAt ? ` · Announced ${d.announcedAt}` : ""}
                        {d.releasedAt  ? ` · Released ${d.releasedAt}`  : ""}
                        {!d.releaseDateConfirmed ? " · TBD" : ""}
                      </Typography>
                    </Box>
                    {d.distributor.website && (
                      <Tooltip title={d.distributor.website}>
                        <IconButton
                          component="a"
                          href={d.distributor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          sx={{ color: "secondary.main" }}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* Events */}
          {figurine.events && figurine.events.length > 0 && (
            <>
              <Divider sx={{ borderColor: "rgba(212,175,55,0.1)", mt: 2, mb: 1.5 }} />
              <Typography variant="overline" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                Events
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 0.5 }}>
                {figurine.events.map((ev) => (
                  <Box key={ev.id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                    <Box sx={{ minWidth: 90 }}>
                      <Typography variant="caption" color="primary.main" fontWeight={700}>
                        {ev.date}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.06em" }}>
                        {ev.type} · {ev.region}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                        {ev.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Grid>
      </Grid>

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
