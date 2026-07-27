import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
  Snackbar,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";

import { useAuth } from "../../../auth/AuthContext";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import {
  getMatchedListingsByStoreId,
  getMatchedListingsSummary,
  manuallyMatchFigurineListing,
  type FigurineStoreMatched,
  type FigurineStoreMatchedSummary,
} from "../api/matchedListingsSummaryApi";

function extractHostName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getLineupLabel(lineup?: string | null): string {
  const normalized = lineup?.trim();
  return normalized && normalized.length > 0 ? normalized : "Unknown lineup";
}

function getSafeImage(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTokenSet(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token.length >= 3),
  );
}

function getNameSimilarityPercent(left: string, right: string): number {
  const leftTokens = toTokenSet(left);
  const rightTokens = toTokenSet(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  });

  const unionSize = new Set([...leftTokens, ...rightTokens]).size;
  return Math.round((overlap / Math.max(unionSize, 1)) * 100);
}

export default function FigurineMatchedStoreDetailPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { hasPermission } = useAuth();

  const [items, setItems] = useState<FigurineStoreMatched[]>([]);
  const [storeSummary, setStoreSummary] = useState<FigurineStoreMatchedSummary | null>(null);
  const [hideStoreLogo, setHideStoreLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualMatchTarget, setManualMatchTarget] = useState<FigurineStoreMatched | null>(null);
  const [savingManualMatch, setSavingManualMatch] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parsedStoreId = useMemo(() => {
    const parsed = Number(storeId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [storeId]);

  const loadDetails = async () => {
    if (parsedStoreId === null) {
      setLoading(false);
      setErrorMessage("Invalid store id.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getMatchedListingsByStoreId(parsedStoreId);
      setItems(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, { action: "load", resource: "matched store figurines" }));
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatchClick = (item: FigurineStoreMatched) => {
    setManualMatchTarget(item);
  };

  const handleConfirmManualMatch = async () => {
    if (!manualMatchTarget) {
      return;
    }

    setSavingManualMatch(true);
    try {
      await manuallyMatchFigurineListing(manualMatchTarget.id);
      await loadDetails();
      setSuccessMessage(`Marked "${manualMatchTarget.figurineDisplayableName}" for manual matching.`);
      setManualMatchTarget(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, { action: "update", resource: "manual figurine match" }));
    } finally {
      setSavingManualMatch(false);
    }
  };

  useEffect(() => {
    const loadStoreSummary = async () => {
      try {
        const summaries = await getMatchedListingsSummary();
        setStoreSummary(summaries.find((summary) => summary.storeId === parsedStoreId) ?? null);
      } catch {
        setStoreSummary(null);
      }
    };

    void loadDetails();
    void loadStoreSummary();
  }, [parsedStoreId]);

  const storeHost = useMemo(() => {
    const candidate = items[0]?.storeProductUrl;
    if (!candidate) {
      return storeSummary?.storeName ?? (parsedStoreId !== null ? `Store ${parsedStoreId}` : "Store");
    }

    return storeSummary?.storeName ?? extractHostName(candidate);
  }, [items, parsedStoreId, storeSummary?.storeName]);

  const storeLogo = storeSummary?.storeLogo?.trim() || null;

  useEffect(() => {
    setHideStoreLogo(false);
  }, [storeLogo]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#d4af37" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
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
        <Tooltip title="Back to Stores">
          <IconButton onClick={() => navigate("/figurine-matching/stores")} sx={{ mt: 0.5 }}>
            <ArrowBackOutlinedIcon />
          </IconButton>
        </Tooltip>

        <Box
          sx={{
            width: { xs: 44, md: 50 },
            height: { xs: 44, md: 50 },
            bgcolor: "#ffffff",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {storeLogo && !hideStoreLogo ? (
            <Box
              component="img"
              src={storeLogo}
              alt={storeHost}
              onError={() => setHideStoreLogo(true)}
              sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.4 }}
            />
          ) : (
            <CompareArrowsOutlinedIcon sx={{ color: "rgba(56,73,90,0.8)" }} />
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontSize: { xs: "1.2rem", md: "1.8rem" }, lineHeight: 1.2 }}>
            {`${storeHost} · Match Details`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            Compare each store listing against the matched catalog figurine side by side.
          </Typography>
        </Box>
      </Box>

      {!errorMessage && (
        <Card
          sx={{
            mb: 2,
            border: "1px solid rgba(212,175,55,0.2)",
            background: "linear-gradient(145deg, rgba(212,175,55,0.12) 0%, rgba(79,195,247,0.08) 100%)",
          }}
        >
          <CardContent>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap flexWrap="wrap">
              <Chip label={`${items.length} matched figurine${items.length === 1 ? "" : "s"}`} sx={{ fontWeight: 700 }} />
            </Stack>
          </CardContent>
        </Card>
      )}

      {!errorMessage && items.length === 0 && (
        <Box
          sx={{
            minHeight: "45vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography variant="h6">No matched figurines for this store</Typography>
          <Typography variant="body2" color="text.secondary">
            This store has no matched listing details yet.
          </Typography>
        </Box>
      )}

      <Stack spacing={1.5}>
        {items.map((item, index) => {
          const storeImage = getSafeImage(item.storeProductImageUrl);
          const figurineImage = getSafeImage(item.figurineOfficialImageUrl);
          const lineupLabel = getLineupLabel(item.figurineLineUp);
          const nameSimilarity = getNameSimilarityPercent(item.storeOriginalName, item.figurineDisplayableName);
          const similaritySeverity = nameSimilarity >= 60 ? "success" : nameSimilarity >= 35 ? "warning" : "default";

          return (
            <Card
              key={item.id}
              sx={{
                borderTop: "2px solid rgba(79,195,247,0.25)",
                opacity: 0,
                animation: `matchedDetailReveal 460ms cubic-bezier(0.2, 0.9, 0.2, 1) ${Math.min(90 + index * 24, 420)}ms forwards`,
                "@keyframes matchedDetailReveal": {
                  "0%": { opacity: 0, transform: "translateY(10px)" },
                  "100%": { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Typography variant="overline" sx={{ color: "#9fd7f4", letterSpacing: "0.09em" }}>
                      Store Listing
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5,
                        border: "1px solid rgba(79,195,247,0.2)",
                        borderRadius: 2,
                        overflow: "hidden",
                        bgcolor: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <Box sx={{ position: "relative", pt: "72%", bgcolor: "#0a0b14" }}>
                        {storeImage ? (
                          <Box
                            component="img"
                            src={storeImage}
                            alt={item.storeOriginalName}
                            sx={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              p: 0.75,
                              bgcolor: "#0b0c16",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "text.secondary",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <ImageNotSupportedOutlinedIcon sx={{ opacity: 0.4 }} />
                            <Typography variant="caption">No image</Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ p: 1.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.storeOriginalName}
                        </Typography>
                        {item.storeProductUrl && (
                          <Button
                            component={Link}
                            href={item.storeProductUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            startIcon={<OpenInNewOutlinedIcon />}
                            sx={{ mt: 0.5, px: 0.5 }}
                          >
                            Open Store Listing
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Stack alignItems="center" spacing={0.4}>
                        <CompareArrowsOutlinedIcon sx={{ color: "#d4af37" }} />
                        <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "0.08em" }}>
                          MATCHED
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 5 }}>
                    <Typography variant="overline" sx={{ color: "#d4af37", letterSpacing: "0.09em" }}>
                      Catalog Figurine
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5,
                        border: "1px solid rgba(212,175,55,0.22)",
                        borderRadius: 2,
                        overflow: "hidden",
                        bgcolor: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <Box sx={{ position: "relative", pt: "72%", bgcolor: "#0a0b14" }}>
                        {figurineImage ? (
                          <Box
                            component="img"
                            src={figurineImage}
                            alt={item.figurineDisplayableName}
                            sx={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              p: 0.75,
                              bgcolor: "#0b0c16",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "text.secondary",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <ImageNotSupportedOutlinedIcon sx={{ opacity: 0.4 }} />
                            <Typography variant="caption">No image</Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ p: 1.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.figurineDisplayableName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                          {lineupLabel}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.75 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/figurines/${item.figurineId}`)}
                          >
                            Open Figurine
                          </Button>
                          {item.figurineTamashiiUrl && (
                            <Button
                              size="small"
                              component={Link}
                              href={item.figurineTamashiiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              startIcon={<OpenInNewOutlinedIcon />}
                            >
                              Official
                            </Button>
                          )}
                          {hasPermission("figurines:stores:assign") && (
                            <Button
                              size="small"
                              variant="contained"
                              color="warning"
                              startIcon={<CompareArrowsOutlinedIcon />}
                              onClick={() => handleManualMatchClick(item)}
                            >
                              Manual Match
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.25, borderColor: "rgba(255,255,255,0.06)" }} />

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.1 }}>
                  <Chip
                    size="small"
                    color={similaritySeverity}
                    variant={similaritySeverity === "default" ? "outlined" : "filled"}
                    label={`Name Similarity ${nameSimilarity}%`}
                  />
                </Stack>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip size="small" variant="outlined" label={`Store item #${item.id}`} />
                  <Chip size="small" variant="outlined" label={`Catalog figurine #${item.figurineId}`} />
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Dialog
        open={Boolean(manualMatchTarget)}
        onClose={() => {
          if (!savingManualMatch) {
            setManualMatchTarget(null);
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirm manual match</DialogTitle>
        <DialogContent>
          {manualMatchTarget && (
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                This action will remove the current automatic match so it can be handled manually on the manual matching page.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Store Listing
                  </Typography>
                  <Box sx={{ mt: 0.5, p: 1, borderRadius: 1.5, border: "1px solid rgba(255,255,255,0.12)" }}>
                    {getSafeImage(manualMatchTarget.storeProductImageUrl) ? (
                      <Box
                        component="img"
                        src={getSafeImage(manualMatchTarget.storeProductImageUrl) ?? ""}
                        alt={manualMatchTarget.storeOriginalName}
                        sx={{ width: "100%", maxHeight: 190, objectFit: "contain", borderRadius: 1, mb: 1, bgcolor: "#0b0c16" }}
                      />
                    ) : null}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {manualMatchTarget.storeOriginalName}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Catalog Figurine
                  </Typography>
                  <Box sx={{ mt: 0.5, p: 1, borderRadius: 1.5, border: "1px solid rgba(255,255,255,0.12)" }}>
                    {getSafeImage(manualMatchTarget.figurineOfficialImageUrl) ? (
                      <Box
                        component="img"
                        src={getSafeImage(manualMatchTarget.figurineOfficialImageUrl) ?? ""}
                        alt={manualMatchTarget.figurineDisplayableName}
                        sx={{ width: "100%", maxHeight: 190, objectFit: "contain", borderRadius: 1, mb: 1, bgcolor: "#0b0c16" }}
                      />
                    ) : null}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {manualMatchTarget.figurineDisplayableName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getLineupLabel(manualMatchTarget.figurineLineUp)}
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              <Divider />

              <Typography variant="caption" color="text.secondary">
                After confirmation, this match will disappear from the list.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualMatchTarget(null)} disabled={savingManualMatch}>
            Cancel
          </Button>
          <Button variant="contained" color="warning" onClick={handleConfirmManualMatch} disabled={savingManualMatch}>
            Yes, send to manual matching
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3200}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

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
