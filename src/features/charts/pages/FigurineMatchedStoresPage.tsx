import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";

import AppPageHeader from "../../../components/AppPageHeader";
import { useDisplayCurrency } from "../../../currency/CurrencyContext";
import { getApiErrorMessage } from "../../../utils/apiErrorMessage";
import { countryCodeToFlag } from "../../../utils/countryFlag";
import {
  getMatchedListingsSummary,
  type FigurineStoreMatchedSummary,
} from "../api/matchedListingsSummaryApi";

export default function FigurineMatchedStoresPage() {
  const navigate = useNavigate();
  const { selectedCurrency } = useDisplayCurrency();
  const [items, setItems] = useState<FigurineStoreMatchedSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hiddenLogos, setHiddenLogos] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const data = await getMatchedListingsSummary({ currency: selectedCurrency ?? undefined });
        setItems(data);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, { action: "load", resource: "matched stores summary" }));
      } finally {
        setLoading(false);
      }
    };

    void loadSummary();
  }, [selectedCurrency]);

  const totalMatchedAcrossStores = useMemo(
    () => items.reduce((sum, item) => sum + item.matchedFigurineCount, 0),
    [items],
  );

  const storesWithMatchesCount = useMemo(
    () => items.filter((item) => item.matchedFigurineCount > 0).length,
    [items],
  );

  const currenciesCount = useMemo(
    () => new Set(items.map((item) => item.currency)).size,
    [items],
  );

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
          animation: "matchedStoresHeaderReveal 420ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
          "@keyframes matchedStoresHeaderReveal": {
            "0%": { opacity: 0, transform: "translateY(-10px)" },
            "100%": { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <Box sx={{ mt: 1.5, mb: 1.5 }}>
          <AppPageHeader
            eyebrow="Figurine Matching"
            title="Matching by Stores"
            subtitle="Choose a store to compare its listings against your catalog figurines. Each card shows identity, market, and current match progress."
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
            borderRadius: 1,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <CardContent>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap flexWrap="wrap">
              <Chip
                label={`${items.length} store${items.length === 1 ? "" : "s"}`}
                sx={{ fontWeight: 700, borderRadius: 1 }}
              />
              <Chip
                label={`${totalMatchedAcrossStores.toLocaleString()} matched figurine${totalMatchedAcrossStores === 1 ? "" : "s"}`}
                sx={{ borderRadius: 1, bgcolor: "rgba(255,255,255,0.12)" }}
              />
              <Chip
                label={`${storesWithMatchesCount} store${storesWithMatchesCount === 1 ? "" : "s"} with matches`}
                color={storesWithMatchesCount > 0 ? "success" : "default"}
                variant="filled"
                sx={{ borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                {currenciesCount} currenc{currenciesCount === 1 ? "y" : "ies"}
              </Typography>
              {selectedCurrency && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Converted to ${selectedCurrency}`}
                  sx={{ borderColor: "rgba(79,195,247,0.45)", color: "#9fd7f4", fontWeight: 700 }}
                />
              )}
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
          <Typography variant="h6">No matched stores yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Start matching store listings to catalog figurines, then stores will appear here.
          </Typography>
        </Box>
      )}

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {items.map((item, itemIndex) => {
          return (
            <Grid
              key={item.storeId}
              size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
              sx={{
                opacity: 0,
                animation: `storeCardReveal 560ms cubic-bezier(0.2, 0.9, 0.2, 1) ${Math.min(130 + itemIndex * 35, 620)}ms forwards`,
                "@keyframes storeCardReveal": {
                  "0%": { opacity: 0, transform: "translateY(14px) scale(0.988)" },
                  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
                },
              }}
            >
              <Card
                onClick={() => navigate(`/figurine-matching/stores/${item.storeId}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/figurine-matching/stores/${item.storeId}`);
                  }
                }}
                sx={{
                  height: "100%",
                  borderRadius: 1,
                  background: "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 12px 36px rgba(79,195,247,0.16)",
                  },
                }}
              >
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.25, height: "100%" }}>
                  <Box
                    sx={{
                      width: "100%",
                      minHeight: 110,
                      bgcolor: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {item.storeLogo && !hiddenLogos[item.storeId] ? (
                      <Box
                        component="img"
                        src={item.storeLogo}
                        alt={item.storeName}
                        onError={() => {
                          setHiddenLogos((current) => ({ ...current, [item.storeId]: true }));
                        }}
                        sx={{ width: "100%", maxHeight: 110, objectFit: "contain" }}
                      />
                    ) : (
                      <StorefrontOutlinedIcon sx={{ color: "#40617a", fontSize: 36 }} />
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap title={item.storeName}>
                    {item.storeName}
                  </Typography>

                  <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap" alignItems="center">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PublicOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">
                        {`${item.country ? countryCodeToFlag(item.country) : ""} ${item.country ?? "N/A"}`.trim()}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Currency: {item.currency}
                    </Typography>
                  </Stack>

                  <Link
                    href={item.storeWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    color="inherit"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                    }}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.6,
                      width: "fit-content",
                      fontSize: 12,
                      color: "#9fd7f4",
                    }}
                  >
                    Visit Store
                    <OpenInNewOutlinedIcon sx={{ fontSize: 14 }} />
                  </Link>

                  <Box
                    sx={{
                      mt: 0.25,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "rgba(79,195,247,0.06)",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Match Count
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#d4af37", lineHeight: 1.15 }}>
                      {item.matchedFigurineCount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {item.matchedFigurineCount > 0
                        ? "Ready to review matched pairs"
                        : "Awaiting first confirmed matches"}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                    <Typography
                      variant="caption"
                      sx={{
                        alignSelf: "center",
                        color: item.matchedFigurineCount > 0 ? "success.main" : "text.secondary",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      {item.matchedFigurineCount > 0 ? <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16 }} /> : <PendingOutlinedIcon sx={{ fontSize: 16 }} />}
                      {item.matchedFigurineCount > 0 ? "Active" : "Pending"}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<OpenInNewOutlinedIcon />}
                      label="Open Store Matches"
                      sx={{ ml: "auto", borderRadius: 1 }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
