import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import CompareOutlinedIcon from "@mui/icons-material/CompareOutlined";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import NewReleasesOutlinedIcon from "@mui/icons-material/NewReleasesOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";

import { useAuth } from "../../../auth/AuthContext";
import AppPageHeader from "../../../components/AppPageHeader";
import { getLatestFavoriteCollectionFigurines } from "../../collections/api/collectionApi";
import type { LatestFavoriteCollectionFigurine } from "../../collections/types/collection";

type HomeTranslationKey =
    | "eyebrow"
    | "title"
    | "subtitle"
    | "enterMythCloth"
    | "startHere"
    | "welcomeToCollection"
    | "collectionDescription"
    | "signedIn"
    | "browsingUnlockedAreas"
    | "quickDestinations"
    | "realTimePrices"
    | "signInTitle"
    | "signInDescription"
    | "currentAccount"
    | "profilePicture"
    | "role"
    | "featuredPlaces"
    | "recentAdditions.title"
    | "recentAdditions.empty"
    | "recentAdditions.browseFigurines"
    | "openSection"
    | "morePlaces"
    | "morePlacesDescription"
    | "links.mythCloth.label"
    | "links.mythCloth.description"
    | "links.collections.label"
    | "links.collections.description"
    | "links.charts.label"
    | "links.charts.description"
    | "links.releases.label"
    | "links.releases.description"
    | "links.storeMatching.label"
    | "links.storeMatching.description"
    | "links.manualMatching.label"
    | "links.manualMatching.description"
    | "links.anniversaries.label"
    | "links.anniversaries.description"
    | "links.distributors.label"
    | "links.distributors.description"
    | "links.permissions.label"
    | "links.permissions.description"
    | "startSteps.browseCatalog.title"
    | "startSteps.browseCatalog.description"
    | "startSteps.trackOwnership.title"
    | "startSteps.trackOwnership.description"
    | "startSteps.exploreTrends.title"
    | "startSteps.exploreTrends.description";

type HomeLink = {
  labelKey: Extract<HomeTranslationKey, `links.${string}.label`>;
  descriptionKey: Extract<
        HomeTranslationKey,
        `links.${string}.description`
  >;
  path: string;
  icon: React.ReactNode;
  permission?: string;
};

type StartStep = {
    titleKey: Extract<HomeTranslationKey, `startSteps.${string}.title`>;
    descriptionKey: Extract<
        HomeTranslationKey,
        `startSteps.${string}.description`
    >;
    icon: React.ReactNode;
};

const HOME_LINKS: HomeLink[] = [
  {
    labelKey: "links.mythCloth.label",
    descriptionKey: "links.mythCloth.description",
    path: "/figurines",
    icon: <WorkspacePremiumOutlinedIcon />,
  },
  {
    labelKey: "links.collections.label",
    descriptionKey: "links.collections.description",
    path: "/collections",
    icon: <Inventory2OutlinedIcon />,
    permission: "collections:read",
  },
  {
    labelKey: "links.charts.label",
    descriptionKey: "links.charts.description",
    path: "/charts",
    icon: <QueryStatsOutlinedIcon />,
    permission: "stats:read",
  },
  {
    labelKey: "links.releases.label",
    descriptionKey: "links.releases.description",
    path: "/releases",
    icon: <RocketLaunchOutlinedIcon />,
    permission: "stats:read",
  },
  {
    labelKey: "links.storeMatching.label",
    descriptionKey: "links.storeMatching.description",
    path: "/figurine-matching/stores",
    icon: <StoreOutlinedIcon />,
    permission: "figurines:stores:read",
  },
  {
    labelKey: "links.manualMatching.label",
    descriptionKey: "links.manualMatching.description",
    path: "/figurine-matching",
    icon: <CompareOutlinedIcon />,
    permission: "figurines:stores:read",
  },
  {
    labelKey: "links.anniversaries.label",
    descriptionKey: "links.anniversaries.description",
    path: "/anniversaries",
    icon: <CelebrationOutlinedIcon />,
    permission: "anniversaries:read",
  },
  {
    labelKey: "links.distributors.label",
    descriptionKey: "links.distributors.description",
    path: "/distributors",
    icon: <LocalShippingOutlinedIcon />,
    permission: "distributors:read",
  },
  {
    labelKey: "links.permissions.label",
    descriptionKey: "links.permissions.description",
    path: "/security/permissions",
    icon: <LockOutlinedIcon />,
    permission: "permissions:read",
  },
];

const FEATURED_PATHS = ["/figurines", "/collections", "/charts", "/releases"];

const START_STEPS: StartStep[] = [
  {
    titleKey: "startSteps.browseCatalog.title",
    descriptionKey: "startSteps.browseCatalog.description",
    icon: <WorkspacePremiumOutlinedIcon fontSize="small" />,
  },
  {
    titleKey: "startSteps.trackOwnership.title",
    descriptionKey: "startSteps.trackOwnership.description",
    icon: <Inventory2OutlinedIcon fontSize="small" />,
  },
  {
    titleKey: "startSteps.exploreTrends.title",
    descriptionKey: "startSteps.exploreTrends.description",
    icon: <ExploreOutlinedIcon fontSize="small" />,
  },
];

export default function HomePage() {
  const { t } = useTranslation("home");
  const navigate = useNavigate();
  const { isAuthenticated, session, hasPermission } = useAuth();
  const [latestFigurines, setLatestFigurines] = useState<LatestFavoriteCollectionFigurine[]>([]);
  const [latestLoading, setLatestLoading] = useState(false);
  const latestScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLatestFigurines([]);
      return;
    }

    let isActive = true;
    setLatestLoading(true);

    getLatestFavoriteCollectionFigurines()
      .then((items) => {
        if (isActive) setLatestFigurines(items);
      })
      .catch(() => {
        if (isActive) setLatestFigurines([]);
      })
      .finally(() => {
        if (isActive) setLatestLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  const scrollLatest = (direction: "left" | "right") => {
    const el = latestScrollRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.8, 480);
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  const visibleLinks = useMemo(
    () => HOME_LINKS.filter((link) => !link.permission || hasPermission(link.permission)),
    [hasPermission],
  );

  const featuredLinks = useMemo(
    () => visibleLinks.filter((link) => FEATURED_PATHS.includes(link.path)),
    [visibleLinks],
  );

  const secondaryLinks = useMemo(
    () => visibleLinks.filter((link) => !FEATURED_PATHS.includes(link.path)),
    [visibleLinks],
  );

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
        minHeight: "100%",
        background:
          "radial-gradient(circle at 0% 0%, rgba(212,175,55,0.08), transparent 26%), radial-gradient(circle at 100% 10%, rgba(79,195,247,0.08), transparent 24%)",
      }}
    >
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          compact
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, width: "100%" }}>
              <Button
                variant="contained"
                startIcon={<WorkspacePremiumOutlinedIcon />}
                onClick={() => navigate("/figurines")}
              >
                {t("enterMythCloth")}
              </Button>
            </Box>
          }
        />
      </Box>

      <Paper
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 2,
          borderRadius: 1.5,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at top left, rgba(212,175,55,0.1), transparent 30%), radial-gradient(circle at bottom right, rgba(79,195,247,0.09), transparent 28%)",
          }}
        />
        <Stack spacing={2} sx={{ position: "relative" }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2.5} alignItems={{ xs: "stretch", lg: "center" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: "rgba(212,175,55,0.9)", letterSpacing: 2 }}>
                {t("startHere")}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.12, mb: 0.75 }}>
                {t("welcomeToCollection")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                {t("collectionDescription")}
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={isAuthenticated ? t("signedIn") : t("browsingUnlockedAreas")} icon={<HomeOutlinedIcon />} />
              <Chip label={t("quickDestinations", {count: visibleLinks.length})} variant="outlined" />
              <Chip label={t("realTimePrices")} variant="outlined" />
            </Stack>
          </Stack>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

          {!isAuthenticated && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.25,
                border: "1px solid rgba(212,175,55,0.28)",
                background: "linear-gradient(180deg, rgba(212,175,55,0.12), rgba(212,175,55,0.05))",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", mb: 0.4 }}>
                {t("signInTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("signInDescription")}
              </Typography>
            </Box>
          )}

          {isAuthenticated && session && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.25,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                  {session.profilePictureUrl ? (
                    <Avatar
                      src={session.profilePictureUrl}
                      alt={session.displayName || t("profilePicture")}
                      sx={{ width: 42, height: 42, flexShrink: 0 }}
                    />
                  ) : (
                    <Avatar sx={{ width: 42, height: 42, flexShrink: 0, bgcolor: "primary.main", color: "primary.contrastText" }}>
                      {session.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </Avatar>
                  )}

                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="overline" sx={{ color: "rgba(212,175,55,0.9)", letterSpacing: 1.5 }}>
                      {t("currentAccount")}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {session.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                      {session.email}
                    </Typography>
                  </Box>
                </Stack>

                {session.role && ( <Chip label={t("role", {role: session.role })} color="primary" variant="outlined" />)}
              </Stack>
            </Box>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 1.25,
            }}
          >
            {START_STEPS.map((step) => (
              <Box
                key={step.titleKey}
                sx={{
                  p: 1.5,
                  borderRadius: 1.25,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                    color: "primary.main",
                    bgcolor: "rgba(255,255,255,0.06)",
                  }}
                >
                  {step.icon}
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.4 }}>
                  {t(step.titleKey)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(step.descriptionKey)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Stack>
      </Paper>

      {isAuthenticated && (
        <Paper
          sx={{
            p: { xs: 1.75, md: 2 },
            mb: 2,
            borderRadius: 1.5,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
            <NewReleasesOutlinedIcon sx={{ color: "primary.main", fontSize: 18 }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {t("recentAdditions.title")}
            </Typography>
          </Box>

          <Box sx={{ position: "relative" }}>
            {latestLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={26} />
              </Box>
            ) : latestFigurines.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 1,
                  py: 2.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t("recentAdditions.empty")}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<WorkspacePremiumOutlinedIcon />}
                  onClick={() => navigate("/figurines")}
                >
                  {t("recentAdditions.browseFigurines")}
                </Button>
              </Box>
            ) : (
              <>
                <IconButton
                  onClick={() => scrollLatest("left")}
                  size="small"
                  sx={{
                    position: "absolute",
                    left: -6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    bgcolor: "background.paper",
                    border: "1px solid rgba(212,175,55,0.25)",
                    "&:hover": { bgcolor: "rgba(212,175,55,0.12)" },
                  }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>

                <Box
                  ref={latestScrollRef}
                  sx={{
                    display: "flex",
                    gap: 1.25,
                    overflowX: "auto",
                    scrollSnapType: "x mandatory",
                    px: 3,
                    py: 0.5,
                    "&::-webkit-scrollbar": { display: "none" },
                    scrollbarWidth: "none",
                  }}
                >
                  {latestFigurines.map((figurine) => (
                    <Card
                      key={figurine.id}
                      onClick={() => navigate(`/figurines/${figurine.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/figurines/${figurine.id}`);
                        }
                      }}
                      sx={{
                        flex: "0 0 auto",
                        width: 140,
                        scrollSnapAlign: "start",
                        cursor: "pointer",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          boxShadow: "0 12px 40px rgba(212, 175, 55, 0.25)",
                        },
                      }}
                    >
                      <Box sx={{ position: "relative", paddingTop: "120%", bgcolor: "#0a0b14" }}>
                        {figurine.imageUrl ? (
                          <CardMedia
                            component="img"
                            image={figurine.imageUrl}
                            alt={figurine.name}
                            sx={{
                              position: "absolute",
                              top: 0, left: 0,
                              width: "100%", height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 0, left: 0,
                              width: "100%", height: "100%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "text.secondary",
                            }}
                          >
                            <ImageNotSupportedOutlinedIcon sx={{ fontSize: 32, opacity: 0.3 }} />
                          </Box>
                        )}

                        {figurine.ownedQuantity > 1 && (
                          <Chip
                            label={`x${figurine.ownedQuantity}`}
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 800,
                              bgcolor: "rgba(10,11,20,0.78)",
                              color: "primary.main",
                              border: "1px solid rgba(212,175,55,0.4)",
                            }}
                          />
                        )}

                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0, left: 0, right: 0,
                            height: "40%",
                            background: "linear-gradient(transparent, rgba(10, 11, 20, 0.92))",
                          }}
                        />
                      </Box>

                      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          noWrap
                          title={figurine.name}
                          sx={{ color: "text.primary", display: "block", fontSize: "0.72rem", lineHeight: 1.3 }}
                        >
                          {figurine.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>

                <IconButton
                  onClick={() => scrollLatest("right")}
                  size="small"
                  sx={{
                    position: "absolute",
                    right: -6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    bgcolor: "background.paper",
                    border: "1px solid rgba(212,175,55,0.25)",
                    "&:hover": { bgcolor: "rgba(212,175,55,0.12)" },
                  }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        </Paper>
      )}

      <Box sx={{ mb: 1.25, display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesomeOutlinedIcon sx={{ color: "primary.main", fontSize: 18 }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("featuredPlaces")}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 1.5,
          mb: 2,
        }}
      >
        {featuredLinks.map((link, index) => (
          <Paper
            key={link.path}
            onClick={() => navigate(link.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(link.path);
              }
            }}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                index % 2 === 0
                  ? "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.02))"
                  : "linear-gradient(135deg, rgba(79,195,247,0.08), rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.02))",
              cursor: "pointer",
              transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 12px 24px rgba(0,0,0,0.14)",
                borderColor: "rgba(212,175,55,0.22)",
              },
            }}
          >
            <Stack spacing={1.25}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 1.25,
                  bgcolor: "rgba(255,255,255,0.07)",
                  color: "primary.main",
                }}
              >
                {link.icon}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.35 }}>
                  {t(link.labelKey)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(link.descriptionKey)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "primary.main" }}>
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.3 }}>
                  {t("openSection")}
                </Typography>
                <ArrowForwardOutlinedIcon sx={{ fontSize: 16 }} />
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      {secondaryLinks.length > 0 && (
        <>
          <Box sx={{ mb: 1.25 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {t("morePlaces")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("morePlacesDescription")}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            {secondaryLinks.map((link) => (
              <Paper
                key={link.path}
                onClick={() => navigate(link.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(link.path);
                  }
                }}
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                  cursor: "pointer",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.14)",
                    borderColor: "rgba(212,175,55,0.22)",
                  },
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 1.25,
                      bgcolor: "rgba(255,255,255,0.06)",
                      color: "primary.main",
                      flexShrink: 0,
                    }}
                  >
                    {link.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.25 }}>
                      {t(link.labelKey)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(link.descriptionKey)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
