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
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";

import AppPageHeader from "../../../components/AppPageHeader";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import {
  getMatchedListingsByStoreId,
  type FigurineStoreMatched,
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

function isLineupMentionedInStoreName(storeName: string, lineupLabel: string): boolean {
  const normalizedStoreName = normalizeText(storeName);
  const lineupTokens = Array.from(toTokenSet(lineupLabel));

  if (lineupTokens.length === 0) {
    return false;
  }

  return lineupTokens.some((token) => normalizedStoreName.includes(token));
}

export default function FigurineMatchedStoreDetailPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();

  const [items, setItems] = useState<FigurineStoreMatched[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedStoreId = useMemo(() => {
    const parsed = Number(storeId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [storeId]);

  useEffect(() => {
    if (parsedStoreId === null) {
      setLoading(false);
      setErrorMessage("Invalid store id.");
      return;
    }

    const loadDetails = async () => {
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

    void loadDetails();
  }, [parsedStoreId]);

  const storeHost = useMemo(() => {
    const candidate = items[0]?.storeProductUrl;
    if (!candidate) {
      return parsedStoreId !== null ? `Store ${parsedStoreId}` : "Store";
    }

    return extractHostName(candidate);
  }, [items, parsedStoreId]);

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
        <AppPageHeader
          eyebrow="Figurine Matching"
          title={`${storeHost} · Match Details`}
          subtitle="Compare each store listing against the matched catalog figurine side by side."
          compact
          actions={
            <Button
              variant="outlined"
              startIcon={<ArrowBackOutlinedIcon />}
              onClick={() => navigate("/figurine-matching/stores")}
            >
              Back to Stores
            </Button>
          }
        />
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

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
              {parsedStoreId !== null && <Chip label={`Store id: ${parsedStoreId}`} variant="outlined" />}
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
          const lineupMentioned = isLineupMentionedInStoreName(item.storeOriginalName, lineupLabel);
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
                            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
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
                            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
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
                  <Chip
                    size="small"
                    color={lineupMentioned ? "success" : "default"}
                    variant={lineupMentioned ? "filled" : "outlined"}
                    label={lineupMentioned ? "Lineup Mentioned" : "Lineup Not Mentioned"}
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
    </Box>
  );
}
