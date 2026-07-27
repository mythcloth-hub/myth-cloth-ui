import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Link,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";

import AppPageHeader from "../../../components/AppPageHeader";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import {
  getUnmatchedStoreListings,
  matchUnmatchedStoreListing,
  type UnmatchedStoreListing,
} from "../api/unmatchedListingsApi";
import { getFigurineSummary, type FigurineSummary } from "../api/figurineSummaryApi";

function extractHostName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFigurineImage(figurine?: FigurineSummary | null): string | null {
  if (!figurine?.officialImageUrl) {
    return null;
  }

  const trimmed = figurine.officialImageUrl.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getLineUpLabel(figurine?: FigurineSummary | null): string {
  const label = figurine?.lineUp?.description?.trim();
  return label && label.length > 0 ? label : "Unknown lineup";
}

export default function FigurineMatchingPage() {
  const [items, setItems] = useState<UnmatchedStoreListing[]>([]);
  const [figurineOptions, setFigurineOptions] = useState<FigurineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectionByListingId, setSelectionByListingId] = useState<Record<number, FigurineSummary | null>>({});
  const [confirmDialogItem, setConfirmDialogItem] = useState<UnmatchedStoreListing | null>(null);
  const [savingMatch, setSavingMatch] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hiddenLogos, setHiddenLogos] = useState<Record<number, boolean>>({});

  const loadUnmatchedListings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const unmatchedData = await getUnmatchedStoreListings();
      setItems(unmatchedData);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, { action: "load", resource: "unmatched store listings" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const [unmatchedData, figurineSummaryData] = await Promise.all([
          getUnmatchedStoreListings(),
          getFigurineSummary(),
        ]);

        setItems(unmatchedData);
        setFigurineOptions(figurineSummaryData);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, { action: "load", resource: "figurine matching data" }));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const groupedListings = useMemo(() => {
    const groups = new Map<number, {
      storeId: number;
      storeHost: string;
      storeWebsite: string;
      storeLogo?: string | null;
      items: UnmatchedStoreListing[];
    }>();

    items.forEach((item) => {
      const existingGroup = groups.get(item.storeId);
      if (existingGroup) {
        existingGroup.items.push(item);
        return;
      }

      groups.set(item.storeId, {
        storeId: item.storeId,
        storeHost: extractHostName(item.storeWebsite),
        storeWebsite: item.storeWebsite,
        storeLogo: item.storeLogo,
        items: [item],
      });
    });

    return [...groups.values()].sort((left, right) => right.items.length - left.items.length);
  }, [items]);

  const storeSummary = useMemo(() => {
    return groupedListings.map((group) => [group.storeHost, group.items.length] as const);
  }, [groupedListings]);

  const handleSelectFigurine = (listingId: number, figurine: FigurineSummary | null) => {
    setSelectionByListingId((currentSelection) => ({
      ...currentSelection,
      [listingId]: figurine,
    }));
  };

  const handleConfirmSelection = async () => {
    if (!confirmDialogItem) {
      return;
    }

    const selectedFigurine = selectionByListingId[confirmDialogItem.id];
    if (!selectedFigurine) {
      return;
    }

    setSavingMatch(true);
    setErrorMessage(null);

    try {
      await matchUnmatchedStoreListing(confirmDialogItem.id, selectedFigurine.id);
      await loadUnmatchedListings();
      setSelectionByListingId((currentSelection) => {
        const nextSelection = { ...currentSelection };
        delete nextSelection[confirmDialogItem.id];
        return nextSelection;
      });

      setMatchedCount((currentCount) => currentCount + 1);
      setSuccessMessage(`Matched \"${confirmDialogItem.originalName}\" to \"${selectedFigurine.displayableName}\".`);
      setConfirmDialogItem(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, { action: "update", resource: "figurine match" }));
    } finally {
      setSavingMatch(false);
    }
  };

  const selectedMatchesCount = Object.values(selectionByListingId).filter(Boolean).length;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#d4af37" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
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
          borderBottom: "1px solid rgba(212,175,55,0.08)",
          animation: "manualMatchingHeaderReveal 420ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
          "@keyframes manualMatchingHeaderReveal": {
            "0%": { opacity: 0, transform: "translateY(-10px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <Box sx={{ mt: 1.5, mb: 1.5 }}>
          <AppPageHeader
            eyebrow="Figurine Matching"
            title="Manual Matching"
            subtitle="Select exactly one catalog figurine for each unmatched store listing, compare both images, and confirm the match."
            compact
          />
        </Box>
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
            background: "linear-gradient(140deg, rgba(212,175,55,0.12) 0%, rgba(79,195,247,0.08) 100%)",
          }}
        >
          <CardContent>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap flexWrap="wrap" sx={{ mb: 1.25 }}>
              <Chip label={`${items.length} unmatched listing${items.length === 1 ? "" : "s"}`} sx={{ fontWeight: 700 }} />
              <Chip label={`${storeSummary.length} store${storeSummary.length === 1 ? "" : "s"}`} variant="outlined" />
              <Chip label={`${figurineOptions.length} catalog candidates`} variant="outlined" />
              <Chip
                label={`${selectedMatchesCount} selected match${selectedMatchesCount === 1 ? "" : "es"}`}
                color={selectedMatchesCount > 0 ? "info" : "default"}
                variant={selectedMatchesCount > 0 ? "filled" : "outlined"}
              />
              <Chip label={`${matchedCount} persisted`} color={matchedCount > 0 ? "success" : "default"} variant="outlined" />
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {storeSummary.map(([store, count]) => (
                <Chip key={store} label={`${store} · ${count}`} size="small" variant="outlined" />
              ))}
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
          <Typography variant="h6">No unmatched listings</Typography>
          <Typography variant="body2" color="text.secondary">
            All collected store figurines currently have a catalog match.
          </Typography>
        </Box>
      )}

      <Stack spacing={2.25}>
        {groupedListings.map((group, groupIndex) => (
          <Card
            key={group.storeId}
            sx={{
              border: "1px solid rgba(79,195,247,0.18)",
              borderRadius: 1.5,
              background: "linear-gradient(180deg, rgba(79,195,247,0.07) 0%, rgba(255,255,255,0.02) 34%)",
              overflow: "hidden",
              opacity: 0,
              animation: `storeGroupReveal 440ms cubic-bezier(0.2, 0.9, 0.2, 1) ${Math.min(120 + groupIndex * 55, 500)}ms forwards`,
              "@keyframes storeGroupReveal": {
                "0%": { opacity: 0, transform: "translateY(8px)" },
                "100%": { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            <Box
              sx={{
                p: { xs: 1.4, sm: 1.75 },
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
                background: "linear-gradient(90deg, rgba(79,195,247,0.16) 0%, rgba(79,195,247,0.06) 60%, rgba(255,255,255,0) 100%)",
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    width: { xs: 42, sm: 52 },
                    height: { xs: 42, sm: 52 },
                    borderRadius: 1,
                    bgcolor: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                      {group.storeLogo && !hiddenLogos[group.storeId] ? (
                    <Box
                      component="img"
                      src={group.storeLogo}
                      alt={group.storeHost}
                      onError={() => {
                        setHiddenLogos((current) => ({ ...current, [group.storeId]: true }));
                      }}
                          sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.4 }}
                    />
                  ) : (
                        <StorefrontOutlinedIcon sx={{ fontSize: 28, color: "rgba(56,73,90,0.8)" }} />
                  )}
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 900,
                      fontSize: { xs: "1rem", sm: "1.18rem" },
                      lineHeight: 1.1,
                    }}
                    noWrap
                    title={group.storeHost}
                  >
                    {group.storeHost}
                  </Typography>
                  <Link
                    href={group.storeWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.2 }}
                  >
                    Visit Store
                    <OpenInNewOutlinedIcon sx={{ fontSize: 13 }} />
                  </Link>
                </Box>
              </Stack>

              <Chip
                size="medium"
                label={`${group.items.length} unmatched listing${group.items.length === 1 ? "" : "s"}`}
                sx={{ fontWeight: 800 }}
              />
            </Box>

            <CardContent sx={{ p: 1.2 }}>
              <Grid container spacing={{ xs: 1.25, sm: 1.5 }}>
                {group.items.map((item, itemIndex) => (
                  <Grid
                    key={item.id}
                    size={{ xs: 6, sm: 4, md: 3, lg: 2 }}
                    sx={{
                      opacity: 0,
                      animation: `figurineCardReveal 620ms cubic-bezier(0.2, 0.9, 0.2, 1) ${Math.min(170 + itemIndex * 30, 660)}ms forwards`,
                      "@keyframes figurineCardReveal": {
                        "0%": { opacity: 0, transform: "translateY(18px) scale(0.985)" },
                        "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
                      },
                    }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderTop: "2px solid rgba(79,195,247,0.25)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          boxShadow: "0 12px 36px rgba(79,195,247,0.16)",
                        },
                      }}
                    >
                <Box sx={{ position: "relative", pt: "72%", bgcolor: "#0a0b14" }}>
                  {item.imageUrl ? (
                    <CardMedia
                      component="img"
                      image={item.imageUrl}
                      alt={item.originalName}
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

                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.25, flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      noWrap
                      title={item.originalName}
                      sx={{ color: "text.primary", lineHeight: 1.3, minWidth: 0, flex: 1 }}
                    >
                      {item.originalName}
                    </Typography>
                  </Box>

                  <Autocomplete
                    options={figurineOptions}
                    value={selectionByListingId[item.id] ?? null}
                    onChange={(_, value) => handleSelectFigurine(item.id, value)}
                    size="small"
                    fullWidth
                    getOptionLabel={(option) => option.displayableName ?? ""}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    filterOptions={(options, state) => {
                      const query = state.inputValue.trim().toLowerCase();
                      if (!query) {
                        return options.slice(0, 40);
                      }

                      return options
                        .filter((option) => {
                          const label = (option.displayableName ?? "").toLowerCase();
                          const lineup = getLineUpLabel(option).toLowerCase();
                          const id = String(option.id);
                          return label.includes(query) || lineup.includes(query) || id.includes(query);
                        })
                        .slice(0, 60);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select catalog figurine"
                        placeholder="Search by name, lineup, or id"
                      />
                    )}
                    renderOption={(props, option) => {
                      const thumbnailUrl = getFigurineImage(option);
                      return (
                        <Box component="li" {...props} key={option.id}>
                          <Tooltip
                            arrow
                            placement="right"
                            enterDelay={180}
                            title={(
                              <Stack spacing={0.8} sx={{ p: 0.2, minWidth: 240 }}>
                                {thumbnailUrl ? (
                                  <Box
                                    component="img"
                                    src={thumbnailUrl}
                                    alt={option.displayableName}
                                    sx={{
                                      width: 240,
                                      height: 240,
                                      objectFit: "contain",
                                      borderRadius: 1,
                                      bgcolor: "common.black",
                                      p: 0.75,
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      width: 240,
                                      height: 240,
                                      borderRadius: 1,
                                      bgcolor: "action.hover",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "text.secondary",
                                      fontWeight: 700,
                                      fontSize: 12,
                                    }}
                                  >
                                    No image available
                                  </Box>
                                )}
                                <Typography variant="caption" sx={{ color: "common.white" }}>
                                  {option.displayableName} · {getLineUpLabel(option)} · #{option.id}
                                </Typography>
                              </Stack>
                            )}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, width: "100%" }}>
                              {thumbnailUrl ? (
                                <Box
                                  component="img"
                                  src={thumbnailUrl}
                                  alt={option.displayableName}
                                  sx={{ width: 34, height: 34, objectFit: "cover", borderRadius: 1, flexShrink: 0 }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 1,
                                    bgcolor: "action.hover",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 11,
                                    color: "text.secondary",
                                    flexShrink: 0,
                                  }}
                                >
                                  N/A
                                </Box>
                              )}
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="body2" noWrap title={option.displayableName}>
                                  {option.displayableName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {getLineUpLabel(option)} · #{option.id}
                                </Typography>
                              </Box>
                            </Stack>
                          </Tooltip>
                        </Box>
                      );
                    }}
                  />

                  {selectionByListingId[item.id] && (
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: "rgba(79,195,247,0.08)",
                        border: "1px solid rgba(79,195,247,0.2)",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        {getFigurineImage(selectionByListingId[item.id]) ? (
                          <Box
                            component="img"
                            src={getFigurineImage(selectionByListingId[item.id]) ?? ""}
                            alt={selectionByListingId[item.id]?.displayableName ?? "Selected figurine"}
                            sx={{ width: 42, height: 42, objectFit: "cover", borderRadius: 1, flexShrink: 0 }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: 1,
                              bgcolor: "action.hover",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "text.secondary",
                              fontSize: 11,
                              flexShrink: 0,
                            }}
                          >
                            N/A
                          </Box>
                        )}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {selectionByListingId[item.id]?.displayableName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getLineUpLabel(selectionByListingId[item.id])}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}

                  <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      disabled={!selectionByListingId[item.id] || savingMatch}
                      onClick={() => setConfirmDialogItem(item)}
                    >
                      Confirm Match
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      component={Link}
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<OpenInNewOutlinedIcon />}
                    >
                      Listing
                    </Button>
                  </Stack>
                </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog
        open={Boolean(confirmDialogItem)}
        onClose={() => {
          if (!savingMatch) {
            setConfirmDialogItem(null);
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirm Figurine Match</DialogTitle>
        <DialogContent>
          {confirmDialogItem && selectionByListingId[confirmDialogItem.id] && (
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Confirm this manual match is correct before continuing.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Store Listing
                  </Typography>
                  <Box sx={{ mt: 0.5, p: 1, borderRadius: 1.5, border: "1px solid rgba(255,255,255,0.12)" }}>
                    {confirmDialogItem.imageUrl ? (
                      <Box
                        component="img"
                        src={confirmDialogItem.imageUrl}
                        alt={confirmDialogItem.originalName}
                        sx={{ width: "100%", maxHeight: 190, objectFit: "contain", borderRadius: 1, mb: 1, bgcolor: "#0b0c16" }}
                      />
                    ) : null}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {confirmDialogItem.originalName}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Catalog Figurine
                  </Typography>
                  <Box sx={{ mt: 0.5, p: 1, borderRadius: 1.5, border: "1px solid rgba(255,255,255,0.12)" }}>
                    {getFigurineImage(selectionByListingId[confirmDialogItem.id]) ? (
                      <Box
                        component="img"
                        src={getFigurineImage(selectionByListingId[confirmDialogItem.id]) ?? ""}
                        alt={selectionByListingId[confirmDialogItem.id]?.displayableName ?? "Selected figurine"}
                        sx={{ width: "100%", maxHeight: 190, objectFit: "contain", borderRadius: 1, mb: 1, bgcolor: "#0b0c16" }}
                      />
                    ) : null}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectionByListingId[confirmDialogItem.id]?.displayableName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getLineUpLabel(selectionByListingId[confirmDialogItem.id])}
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              <Divider />

              <Typography variant="caption" color="text.secondary">
                When you confirm, this match is saved and this item disappears from the list.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogItem(null)} disabled={savingMatch}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleConfirmSelection} disabled={savingMatch}>
            Yes, confirm
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
    </Box>
  );
}
