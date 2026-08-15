import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
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

import { useAuth } from "../../../auth/AuthContext";
import AppPageHeader from "../../../components/AppPageHeader";

type HomeLink = {
  label: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
};

const HOME_LINKS: HomeLink[] = [
  {
    label: "Myth Cloth",
    description: "Browse the full figurine catalog and jump back into your main collection view.",
    path: "/figurines",
    icon: <WorkspacePremiumOutlinedIcon />,
  },
  {
    label: "My Collections",
    description: "Open your saved collections, compare progress, and manage grouped figurines.",
    path: "/collections",
    icon: <Inventory2OutlinedIcon />,
    permission: "collections:read",
  },
  {
    label: "Charts",
    description: "See fast collection summaries, proportions, and visual breakdowns.",
    path: "/charts",
    icon: <QueryStatsOutlinedIcon />,
    permission: "stats:read",
  },
  {
    label: "Releases",
    description: "Explore release history by year and drill into the timeline details.",
    path: "/releases",
    icon: <RocketLaunchOutlinedIcon />,
    permission: "stats:read",
  },
  {
    label: "Store Matching",
    description: "Review matched store sources and compare them against your figurine catalog.",
    path: "/figurine-matching/stores",
    icon: <StoreOutlinedIcon />,
    permission: "figurines:stores:read",
  },
  {
    label: "Manual Matching",
    description: "Resolve unmatched listings and connect them to the right catalog entries.",
    path: "/figurine-matching",
    icon: <CompareOutlinedIcon />,
    permission: "stats:read",
  },
  {
    label: "Anniversaries",
    description: "Track commemorative moments and milestone events tied to the collection.",
    path: "/anniversaries",
    icon: <CelebrationOutlinedIcon />,
    permission: "anniversaries:read",
  },
  {
    label: "Distributors",
    description: "Keep partner and distributor data organized in one place.",
    path: "/distributors",
    icon: <LocalShippingOutlinedIcon />,
    permission: "distributors:read",
  },
  {
    label: "Permissions",
    description: "Manage role access and security controls when working on administration flows.",
    path: "/security/permissions",
    icon: <LockOutlinedIcon />,
    permission: "permissions:read",
  },
];

const FEATURED_PATHS = ["/figurines", "/collections", "/charts", "/releases"];

const START_STEPS = [
  {
    title: "Browse your catalog",
    description: "Start with Myth Cloth to review your figurines, filters, and collection search state.",
    icon: <WorkspacePremiumOutlinedIcon fontSize="small" />,
  },
  {
    title: "Track ownership",
    description: "Move into collections and purchases when you want to organize what you own and what is still pending.",
    icon: <Inventory2OutlinedIcon fontSize="small" />,
  },
  {
    title: "Explore trends",
    description: "Open charts, releases, and pricing when you want context instead of raw lists.",
    icon: <ExploreOutlinedIcon fontSize="small" />,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, session, hasPermission } = useAuth();

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
          eyebrow="Home"
          title="Welcome to Saint Collections"
          subtitle="Keep track of your Myth Cloth, discover what's new, follow prices, and stay on top of your collection journey."
          actions={
            <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, width: "100%" }}>
              <Button
                variant="contained"
                startIcon={<WorkspacePremiumOutlinedIcon />}
                onClick={() => navigate("/figurines")}
              >
                Enter Myth Cloth
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
                START HERE
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.12, mb: 0.75 }}>
                Welcome to your collection
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                Explore what you own, discover what’s new, follow the market, and keep your collection moving forward.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={isAuthenticated ? "Signed in" : "Browsing unlocked areas"} icon={<HomeOutlinedIcon />} />
              <Chip label={`${visibleLinks.length} quick destinations`} variant="outlined" />
              <Chip label="Home is now the default start page" variant="outlined" />
            </Stack>
          </Stack>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

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
                      alt={session.displayName || "Profile picture"}
                      sx={{ width: 42, height: 42, flexShrink: 0 }}
                    />
                  ) : (
                    <Avatar sx={{ width: 42, height: 42, flexShrink: 0, bgcolor: "primary.main", color: "primary.contrastText" }}>
                      {session.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </Avatar>
                  )}

                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="overline" sx={{ color: "rgba(212,175,55,0.9)", letterSpacing: 1.5 }}>
                      CURRENT ACCOUNT
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {session.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                      {session.email}
                    </Typography>
                  </Box>
                </Stack>

                {session.role && <Chip label={`Role: ${session.role}`} color="primary" variant="outlined" />}
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
                key={step.title}
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
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Stack>
      </Paper>

      <Box sx={{ mb: 1.25, display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesomeOutlinedIcon sx={{ color: "primary.main", fontSize: 18 }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Featured places to start
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
                  {link.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {link.description}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "primary.main" }}>
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.3 }}>
                  Open section
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
              More places in the app
            </Typography>
            <Typography variant="body2" color="text.secondary">
              These areas are available based on your current access and can help you go deeper once you are ready.
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
                      {link.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {link.description}
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