import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import {
  Alert,
  Box,
  Button,
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
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { getFigurineById } from "../api/figurineApi";
import type { Figurine, ReleaseStatus } from "../types/figurine";
import { countryCodeToFlag } from "../../../utils/countryFlag";
import AnniversaryIcon from "./AnniversaryIcon";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import AddToCollectionModal from "../../collections/components/AddToCollectionModal";
import { getCollections } from "../../collections/api/collectionApi";

const RELEASE_STATUS_CONFIG: Record<ReleaseStatus, { label: string; color: string; borderColor: string }> = {
  RELEASED:  { label: "Released",  color: "#4caf50", borderColor: "rgba(76,175,80,0.30)"   },
  ANNOUNCED: { label: "Announced", color: "#42a5f5", borderColor: "rgba(66,165,245,0.30)"  },
  RUMORED:   { label: "Rumored",   color: "#ff9800", borderColor: "rgba(255,152,0,0.35)"   },
  PROTOTYPE: { label: "Prototype", color: "#90a4ae", borderColor: "rgba(144,164,174,0.30)" },
  UNRELEASED: { label: "Unreleased", color: "#ef5350", borderColor: "rgba(239,83,80,0.30)" },
};

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <Chip
      label={label}
      size="small"
      icon={value
        ? <CheckCircleOutlineIcon style={{ fontSize: 13 }} />
        : <CancelOutlinedIcon style={{ fontSize: 13 }} />}
      sx={{
        fontWeight: value ? 700 : 400,
        fontSize: "0.72rem",
        height: 24,
        bgcolor: value ? "rgba(212,175,55,0.15)" : "transparent",
        color: value ? "primary.main" : "text.disabled",
        border: "1px solid",
        borderColor: value ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)",
        "& .MuiChip-icon": { color: value ? "primary.main" : "text.disabled" },
      }}
    />
  );
}

type SelectedCollectionContext = {
  id: number;
  name: string;
  figurineIds: number[];
};

export default function FigurineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, isAuthenticated } = useAuth();

  const [figurine, setFigurine] = useState<Figurine | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [selectedCollectionContext, setSelectedCollectionContext] = useState<SelectedCollectionContext | null>(() => {
    const stateCollection = (location.state as { selectedCollection?: SelectedCollectionContext } | null)?.selectedCollection;
    if (stateCollection) {
      return stateCollection;
    }

    const rawStoredContext = sessionStorage.getItem("figurineSelectedCollectionContext");
    if (!rawStoredContext) {
      return null;
    }

    try {
      const parsedContext = JSON.parse(rawStoredContext) as SelectedCollectionContext;
      if (
        parsedContext &&
        typeof parsedContext.id === "number" &&
        typeof parsedContext.name === "string" &&
        Array.isArray(parsedContext.figurineIds)
      ) {
        return parsedContext;
      }
    } catch {
      sessionStorage.removeItem("figurineSelectedCollectionContext");
    }

    return null;
  });

  const navList: number[] = JSON.parse(sessionStorage.getItem("figurineNavList") ?? "[]");
  const currentIndex = navList.indexOf(Number(id));
  const prevId = currentIndex > 0 ? navList[currentIndex - 1] : null;
  const nextId = currentIndex !== -1 && currentIndex < navList.length - 1 ? navList[currentIndex + 1] : null;
  const collectionSearch = sessionStorage.getItem("figurineCollectionSearch");
  const figurineId = Number(id);
  const isInSelectedCollection = selectedCollectionContext
    ? selectedCollectionContext.figurineIds.includes(figurineId)
    : null;

  useEffect(() => {
    const stateCollection = (location.state as { selectedCollection?: SelectedCollectionContext } | null)?.selectedCollection;
    if (!stateCollection) {
      return;
    }

    setSelectedCollectionContext(stateCollection);
    sessionStorage.setItem("figurineSelectedCollectionContext", JSON.stringify(stateCollection));
  }, [location.state]);

  const handleBackToCollection = () => {
    navigate(collectionSearch ? `/figurines?${collectionSearch}` : "/figurines");
  };

  useEffect(() => {
    setLoading(true);
    getFigurineById(Number(id))
      .then((data) => {
        setFigurine(data);
        setSelectedImage(0);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(getApiErrorMessage(err, { action: "load", resource: "figurine details" }));
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

  const images = figurine.officialImageUrls ?? [];
  const mainImage = images[selectedImage] ?? null;
  const catalogDetails = [
    { label: "Series", value: figurine.series.description },
    { label: "Line Up", value: figurine.lineUp.description },
    { label: "Group", value: figurine.group?.description },
    { label: "Distribution", value: figurine.distribution?.description },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
  const notesText = figurine.notes ? figurine.notes.replace(/\\n/g, "\n") : "";

  return (
    <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Back button + title + prev/next */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 3,
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.default",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          mx: { xs: -1.5, sm: -2, md: -3 },
          px: { xs: 1.5, sm: 2, md: 3 },
          py: 1,
          borderBottom: "1px solid rgba(212,175,55,0.1)",
        }}
      >
        <Tooltip title="Back to Myth Cloth Collection">
          <IconButton onClick={handleBackToCollection} sx={{ mt: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.4rem", md: "2rem" }, flex: 1 }}>
          {figurine.displayableName}
        </Typography>
        {/* Prev / Next arrows */}
        {navList.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title={prevId ? "Previous figurine" : ""}>
              <span>
                <IconButton
                  onClick={() =>
                    prevId &&
                    navigate(`/figurines/${prevId}`, {
                      replace: true,
                      state: selectedCollectionContext
                        ? { selectedCollection: selectedCollectionContext }
                        : undefined,
                    })
                  }
                  disabled={!prevId}
                  size="small"
                  sx={{ color: prevId ? "primary.main" : "text.disabled" }}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Typography variant="caption" sx={{ color: "text.secondary", minWidth: 40, textAlign: "center" }}>
              {currentIndex + 1} / {navList.length}
            </Typography>
            <Tooltip title={nextId ? "Next figurine" : ""}>
              <span>
                <IconButton
                  onClick={() =>
                    nextId &&
                    navigate(`/figurines/${nextId}`, {
                      replace: true,
                      state: selectedCollectionContext
                        ? { selectedCollection: selectedCollectionContext }
                        : undefined,
                    })
                  }
                  disabled={!nextId}
                  size="small"
                  sx={{ color: nextId ? "primary.main" : "text.disabled" }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
        {hasPermission("figurines:update") && (
          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={() => navigate(`/figurines/${id}/edit`)}
            sx={{ flexShrink: 0 }}
          >
            Edit
          </Button>
        )}
        {isAuthenticated && (
          <Button
            variant="contained"
            startIcon={<FavoriteBorderIcon />}
            onClick={() => setAddToCollectionOpen(true)}
            sx={{
              flexShrink: 0,
              background: "linear-gradient(135deg, #4fc3f7 0%, #81d4fa 100%)",
              color: "#000",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #81d4fa 0%, #4fc3f7 100%)",
                boxShadow: "0 8px 24px rgba(79,195,247,0.3)",
              },
              transition: "all 0.3s ease",
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%, 100%": {
                  opacity: 1,
                },
                "50%": {
                  opacity: 0.8,
                },
              },
            }}
          >
            Add to Collection
          </Button>
        )}
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
            {figurine.isRevival && (
              <Box
                sx={{
                  position: "absolute",
                  top: 14,
                  left: -34,
                  zIndex: 2,
                  width: 150,
                  py: 0.6,
                  textAlign: "center",
                  transform: "rotate(-35deg)",
                  bgcolor: "primary.main",
                  color: "#1a1202",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                }}
              >
                Revival
              </Box>
            )}
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
                  objectFit: "contain",
                  transition: "opacity 0.25s",
                  background: "#181a22",
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
              {catalogDetails.map(({ label, value }) => (
                <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", fontSize: "0.65rem" }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.primary", mt: 0.25 }}>
                    {value}
                  </Typography>
                </Grid>
              ))}
              {figurine.releaseStatus && (() => {
                const cfg = RELEASE_STATUS_CONFIG[figurine.releaseStatus];
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", fontSize: "0.65rem" }}>
                      Release Status
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: cfg.color, border: `1px solid ${cfg.borderColor}`, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: cfg.color, fontWeight: 600 }}>
                        {cfg.label}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })()}
              {figurine.anniversary && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", fontSize: "0.65rem" }}>
                    Anniversary
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                    <AnniversaryIcon sx={{ fontSize: 18, color: "#bfa100" }} />
                    <Typography variant="body2" sx={{ color: "text.primary" }}>
                      {figurine.anniversary.description}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {(figurine.tamashiiUrl || selectedCollectionContext) && (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      mt: 0.75,
                      pt: 1.25,
                      borderTop: "1px solid rgba(212,175,55,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: { xs: "stretch", sm: "flex-start" },
                      gap: 1.25,
                      flexDirection: { xs: "column", sm: "row" },
                    }}
                  >
                    {selectedCollectionContext && isInSelectedCollection !== null && (
                      <Chip
                        size="small"
                        icon={isInSelectedCollection ? <CheckCircleOutlineIcon /> : <CancelOutlinedIcon />}
                        label={
                          isInSelectedCollection
                            ? `Owned in ${selectedCollectionContext.name}`
                            : `Missing in ${selectedCollectionContext.name}`
                        }
                        variant="outlined"
                        sx={{
                          height: 30,
                          borderRadius: 999,
                          fontWeight: 700,
                          maxWidth: { xs: "100%", sm: 320 },
                          borderColor: isInSelectedCollection ? "rgba(76,175,80,0.45)" : "rgba(255,152,0,0.38)",
                          bgcolor: isInSelectedCollection ? "rgba(76,175,80,0.12)" : "rgba(255,152,0,0.10)",
                          alignSelf: { xs: "stretch", sm: "auto" },
                          "& .MuiChip-icon": {
                            color: isInSelectedCollection ? "#66bb6a" : "#ffb74d",
                            fontSize: 16,
                            ml: 0.75,
                          },
                          "& .MuiChip-label": {
                            fontWeight: 700,
                            letterSpacing: "0.01em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            pr: 1.1,
                          },
                        }}
                      />
                    )}
                    {figurine.tamashiiUrl && (
                      <Button
                        component="a"
                        href={figurine.tamashiiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        endIcon={<OpenInNewIcon />}
                        sx={{ flexShrink: 0, alignSelf: { xs: "stretch", sm: "auto" }, ml: { sm: "auto" } }}
                      >
                        Open Official Page
                      </Button>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Attributes */}
          <Typography variant="overline" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
            Attributes
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2, mt: 0.5 }}>
            <BoolRow label="Metal Body"          value={figurine.isMetalBody} />
            <BoolRow label="Articulable"         value={figurine.isArticulable} />
            <BoolRow label="Revival"             value={figurine.isRevival} />
            <BoolRow label="Original Color Ed." value={figurine.isOriginalColorEdition} />
            <BoolRow label="Battle Damaged"      value={figurine.isBattleDamaged} />
            <BoolRow label="Golden Armor"        value={figurine.isGoldenArmor} />
            <BoolRow label="Gold 24K Edition"    value={figurine.isGold24kEdition} />
            <BoolRow label="Manga Version"       value={figurine.isMangaVersion} />
            <BoolRow label="Plain Cloth"         value={figurine.isPlainCloth} />
            <BoolRow label="Multi-Pack"          value={figurine.isMultiPack} />
          </Box>

          {/* Notes */}
          {notesText && (
            <>
              <Divider sx={{ borderColor: "rgba(212,175,55,0.1)", mb: 1.5 }} />
              <Typography
                variant="overline"
                sx={(theme) => theme.custom.magazineNotes.label}
              >
                Additional Information
              </Typography>
              <Box
                sx={(theme) => ({
                  ...theme.custom.magazineNotes.container,
                  p: { xs: 1.25, sm: 1.5 },
                  pb: { xs: 1.75, sm: 3 },
                })}
              >
                <Typography
                  sx={(theme) => ({
                    ...theme.custom.magazineNotes.body,
                    fontSize: { xs: "1rem", sm: "1.05rem" },
                    whiteSpace: "pre-line",
                  })}
                >
                  {notesText}
                </Typography>
              </Box>
            </>
          )}

          {/* Distributors */}
          {figurine.distributors?.length > 0 && (
            <>
              <Divider sx={{ borderColor: "rgba(212,175,55,0.1)", mb: 1.5 }} />
              <Typography variant="overline" sx={{ color: "text.secondary", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                Distributors
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 0.75 }}>
                {figurine.distributors.map((d, i) => {
                  const formatDate = (dateStr: string, confirmed: boolean) => {
                    const parts = dateStr.split("-");
                    const year = parts[0] ?? "";
                    const monthAbbr = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(parts[1] ?? "0", 10) - 1] ?? "";
                    const day = parts[2] ?? "";
                    return confirmed ? `${monthAbbr} ${day}, ${year}` : `${monthAbbr} ${year}`;
                  };
                  return (
                  <Box
                    key={i}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(212,175,55,0.12)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    {/* Header row */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 1.5,
                        py: 1,
                        bgcolor: "rgba(0,0,0,0.18)",
                        borderBottom: "1px solid rgba(212,175,55,0.08)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Tooltip title={d.distributor.countryCode} placement="top" arrow>
                          <Typography component="span" sx={{ fontSize: "1.1rem", lineHeight: 1, cursor: "default" }}>
                            {countryCodeToFlag(d.distributor.countryCode)}
                          </Typography>
                        </Tooltip>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                          {d.distributor.description}
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
                            sx={{ color: "secondary.main", "&:hover": { color: "primary.main" } }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    {/* Details grid */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0, px: 1.5, py: 1 }}>
                      {/* Price */}
                      <Box sx={{ flex: "1 1 120px", py: 0.5, pr: 2 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                          Price
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          {d.price != null ? `${d.price.toLocaleString()} ${d.currency}` : (
                            <Typography component="span" variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>
                              N/A
                            </Typography>
                          )}
                        </Typography>
                        {d.priceWithTax != null && d.priceWithTax !== d.price && d.distributor.countryCode !== "MX" && (
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                            {d.priceWithTax.toLocaleString()} {d.currency} w/ tax
                          </Typography>
                        )}
                      </Box>

                      {/* Pre-order */}
                      {d.preorderOpensAt && (
                        <Box sx={{ flex: "1 1 120px", py: 0.5, pr: 2 }}>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                            Pre-order
                          </Typography>
                          <Typography variant="body2" fontWeight={500} color="text.primary">
                            {formatDate(d.preorderOpensAt, true)}
                          </Typography>
                        </Box>
                      )}

                      {/* Release date */}
                      <Box sx={{ flex: "1 1 120px", py: 0.5, pr: 2 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                          Release
                        </Typography>
                        {d.releaseDate ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={500} color="text.primary">
                              {formatDate(d.releaseDate, d.releaseDateConfirmed)}
                            </Typography>
                            {!d.releaseDateConfirmed && (
                              <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic", fontSize: "0.68rem" }}>
                                (unconfirmed)
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic", fontSize: "0.8rem" }}>
                            TBD
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  );
                })}
              </Box>
            </>
          )}

          {/* Events timeline */}
          {figurine.events && figurine.events.length > 0 && (
            <>
              <Divider sx={{ borderColor: "rgba(212,175,55,0.1)", mt: 2, mb: 1.5 }} />
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", fontSize: "0.65rem", letterSpacing: "0.1em" }}
              >
                Chronology
              </Typography>

              <Box sx={{ position: "relative", mt: 1.5, ml: 1 }}>
                {/* Vertical connector line */}
                <Box
                  sx={{
                    position: "absolute",
                    left: 7,
                    top: 8,
                    bottom: 8,
                    width: 2,
                    bgcolor: "rgba(212,175,55,0.18)",
                    borderRadius: 1,
                  }}
                />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {figurine.events.map((ev) => {
                    const isRelease = ev.type.toUpperCase().includes("RELEASE");
                    return (
                    <Box key={ev.id} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                      {/* Timeline dot */}
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor: isRelease ? "primary.main" : "background.paper",
                          border: "2px solid",
                          borderColor: "primary.main",
                          boxShadow: isRelease
                            ? "0 0 12px rgba(212,175,55,0.7), 0 0 4px rgba(212,175,55,0.9)"
                            : "0 0 6px rgba(212,175,55,0.4)",
                          flexShrink: 0,
                          mt: 0.25,
                          zIndex: 1,
                        }}
                      />

                      {/* Content card */}
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "stretch",
                          bgcolor: isRelease ? "rgba(212,175,55,0.09)" : "rgba(212,175,55,0.04)",
                          border: "1px solid",
                          borderColor: isRelease ? "rgba(212,175,55,0.4)" : "rgba(212,175,55,0.12)",
                          borderRadius: 2,
                          overflow: "hidden",
                          boxShadow: isRelease ? "0 2px 12px rgba(212,175,55,0.12)" : "none",
                        }}
                      >
                        {/* Date badge column */}
                        {(() => {
                          const parts = ev.date.split("-");
                          const year = parts[0] ?? "";
                          const day = parts[2] ?? "";
                          const monthAbbr = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][parseInt(parts[1] ?? "0", 10) - 1] ?? "";
                          return (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: 52,
                                px: 1,
                                py: 1.25,
                                bgcolor: isRelease ? "rgba(212,175,55,0.12)" : "rgba(0,0,0,0.15)",
                                borderRight: "1px solid",
                                borderColor: isRelease ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.07)",
                                flexShrink: 0,
                              }}
                            >
                              <Typography sx={{ fontSize: "0.58rem", fontWeight: 800, color: "primary.main", letterSpacing: "0.1em", lineHeight: 1 }}>
                                {monthAbbr}
                              </Typography>
                              {ev.dateConfirmed ? (
                                <Typography sx={{ fontSize: "1.45rem", fontWeight: 800, color: isRelease ? "primary.main" : "text.primary", lineHeight: 1.1, mt: 0.25 }}>
                                  {day}
                                </Typography>
                              ) : null}
                              <Typography sx={{ fontSize: "0.58rem", color: "text.secondary", letterSpacing: "0.04em", lineHeight: 1, mt: 0.25 }}>
                                {year}
                              </Typography>
                            </Box>
                          );
                        })()}

                        {/* Main content */}
                        <Box sx={{ flex: 1, px: 1.5, py: 1.25 }}>
                          {/* Flag + release badge */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                          <Tooltip title={ev.region} placement="top" arrow>
                            <Typography
                              component="span"
                              sx={{ fontSize: "1rem", lineHeight: 1, cursor: "default" }}
                            >
                              {countryCodeToFlag(ev.region)}
                            </Typography>
                          </Tooltip>
                          {isRelease && (
                            <Chip
                              icon={<RocketLaunchOutlinedIcon sx={{ fontSize: "0.75rem !important" }} />}
                              label="Release"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                bgcolor: "rgba(212,175,55,0.18)",
                                color: "primary.main",
                                border: "1px solid rgba(212,175,55,0.35)",
                                "& .MuiChip-icon": { color: "primary.main" },
                              }}
                            />
                          )}
                        </Box>

                        {/* Description */}
                        <Typography
                          variant="body2"
                          sx={{ color: isRelease ? "text.primary" : "text.secondary", fontSize: "0.82rem", lineHeight: 1.5 }}
                        >
                          {ev.description}
                        </Typography>
                        </Box>{/* end main content */}
                      </Box>
                    </Box>
                    );
                  })}
                </Box>
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

      <Snackbar
        open={addSuccess}
        autoHideDuration={3000}
        onClose={() => setAddSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setAddSuccess(false)}>
          ✨ Added to collection successfully!
        </Alert>
      </Snackbar>

      {figurine && (
        <AddToCollectionModal
          open={addToCollectionOpen}
          onClose={() => setAddToCollectionOpen(false)}
          figurineId={figurine.id}
          figurineName={figurine.displayableName}
          onSuccess={async () => {
            setAddSuccess(true);
            setAddToCollectionOpen(false);

            if (!selectedCollectionContext) {
              return;
            }

            try {
              const collections = await getCollections();
              const refreshedSelectedCollection = collections.find(
                (collection) => collection.id === selectedCollectionContext.id
              );

              if (!refreshedSelectedCollection) {
                return;
              }

              const updatedContext: SelectedCollectionContext = {
                id: refreshedSelectedCollection.id,
                name: refreshedSelectedCollection.name,
                figurineIds: refreshedSelectedCollection.figurineIds ?? [],
              };

              setSelectedCollectionContext(updatedContext);
              sessionStorage.setItem("figurineSelectedCollectionContext", JSON.stringify(updatedContext));
            } catch {
              // Keep current UI state if a background refresh fails.
            }
          }}
        />
      )}
    </Box>
  );
}
