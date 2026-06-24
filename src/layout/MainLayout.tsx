import { useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import Button from "@mui/material/Button";
import FacebookIcon from "@mui/icons-material/Facebook";
import GoogleIcon from "@mui/icons-material/Google";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useAppTheme } from "../theme/ThemeContext";
import { THEME_META, type ThemeId } from "../theme/themes";
import { alpha, useTheme } from "@mui/material/styles";

const DRAWER_WIDTH = 230;

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

type NavSection = {
  heading: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    heading: "",
    items: [
      { label: "Collection",    path: "/figurines",      icon: <CollectionsOutlinedIcon /> },
      { label: "My Collections", path: "/collections",   icon: <FavoriteBorderOutlinedIcon /> },
      { label: "Charts",        path: "/charts",         icon: <InsightsOutlinedIcon /> },
      { label: "Releases",      path: "/releases",       icon: <CalendarMonthOutlinedIcon /> },
      { label: "Pricing",       path: "/pricing",        icon: <PaidOutlinedIcon /> },
      { label: "Distributors",  path: "/distributors",   icon: <LocalShippingOutlinedIcon /> },
      { label: "Anniversaries", path: "/anniversaries",  icon: <CakeOutlinedIcon /> },
    ],
  },
  {
    heading: "Catalogs",
    items: [
      { label: "Distributions", path: "/catalogs/distributions", icon: <HubOutlinedIcon /> },
      { label: "Groups",        path: "/catalogs/groups",        icon: <GroupsOutlinedIcon /> },
      { label: "Lineups",       path: "/catalogs/lineups",       icon: <ViewListOutlinedIcon /> },
      { label: "Series",        path: "/catalogs/series",        icon: <AutoStoriesOutlinedIcon /> },
    ],
  },
  {
    heading: "Security",
    items: [
      { label: "Roles", path: "/security/roles", icon: <AdminPanelSettingsOutlinedIcon /> },
      { label: "Permissions", path: "/security/permissions", icon: <LockOutlinedIcon /> },
      { label: "Role Permissions", path: "/security/role-permissions", icon: <LinkOutlinedIcon /> },
    ],
  },
];

function useFacebookSDK() {
  useEffect(() => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId) return;

    if (document.getElementById('facebook-jssdk')) return;
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.onload = () => {
      window.FB && window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
    };
    document.body.appendChild(script);
  }, []);
}

function useGoogleSDK() {
  useEffect(() => {
    if (document.getElementById("google-identity-service")) return;

    const script = document.createElement("script");
    script.id = "google-identity-service";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { isAuthenticated, session, hasPermission, loginWithFacebook, loginWithGoogle, facebookEnabled, googleEnabled, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { themeId, setThemeId } = useAppTheme();
  const theme = useTheme();

  const authCardSx = {
    px: 1.25,
    py: 1.1,
    borderRadius: 2,
    border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
    background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.55)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
  };

  const authButtonBaseSx = {
    width: "100%",
    py: 1,
    fontWeight: 700,
    fontSize: "0.9rem",
    letterSpacing: "0.01em",
    textTransform: "none",
    borderRadius: 1.5,
    borderWidth: 1.5,
    justifyContent: "flex-start",
    transition: "all 0.18s ease",
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const visibleSections = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.path === "/collections") {
          return hasPermission("collections:read");
        }
        if (item.path === "/charts") {
          return hasPermission("stats:read");
        }
        if (item.path === "/releases") {
          return hasPermission("stats:read");
        }
        if (item.path === "/pricing") {
          return hasPermission("stats:read");
        }
        if (item.path === "/anniversaries") {
          return hasPermission("anniversaries:read");
        }
        if (item.path === "/distributors") {
          return hasPermission("distributors:read");
        }
        if (item.path === "/catalogs/distributions") {
          return hasPermission("catalogs:read");
        }
        if (item.path === "/catalogs/groups") {
          return hasPermission("catalogs:read");
        }
        if (item.path === "/catalogs/lineups") {
          return hasPermission("catalogs:read");
        }
        if (item.path === "/catalogs/series") {
          return hasPermission("catalogs:read");
        }
        if (item.path === "/security/roles") {
          return hasPermission("roles:read");
        }
        if (item.path === "/security/permissions") {
          return hasPermission("permissions:read");
        }
        if (item.path === "/security/role-permissions") {
          return hasPermission("roles:read");
        }
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  const handleClick = (path: string) => {
    if (path === "/figurines") {
      // Remove page param from sessionStorage so Collection always goes to page 1
      const saved = sessionStorage.getItem("figurineCollectionSearch");
      if (saved) {
        const params = new URLSearchParams(saved);
        params.set("page", "1");
        sessionStorage.setItem("figurineCollectionSearch", params.toString());
        navigate(`${path}?${params.toString()}`);
      } else {
        navigate(path);
      }
    } else {
      navigate(path);
    }
    onNavigate?.();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    onNavigate?.();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Typography
          variant="h6"
          sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 1, lineHeight: 1.2 }}
        >
          MythCloth
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Management Console
        </Typography>
      </Box>

      {/* Nav sections */}
      <Box sx={{ flex: 1, overflowY: "auto", pt: 1 }}>
        {visibleSections.map((section) => (
          <Box key={section.heading || "main"}>
            {section.heading && (
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  px: 3,
                  pt: 2,
                  pb: 0.5,
                  color: "text.secondary",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                }}
              >
                {section.heading}
              </Typography>
            )}
            <List dense disablePadding>
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      onClick={() => handleClick(item.path)}
                      sx={{
                        mx: 1,
                        borderRadius: 1.5,
                        mb: 0.25,
                        color: active ? "primary.main" : "text.secondary",
                        backgroundColor: active
                          ? "rgba(212, 175, 55, 0.12)"
                          : "transparent",
                        borderLeft: active ? "2px solid #d4af37" : "2px solid transparent",
                        boxShadow: active ? "0 0 12px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                        backdropFilter: active ? "blur(8px)" : "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: active
                            ? "rgba(212, 175, 55, 0.18)"
                            : "rgba(255,255,255,0.05)",
                          color: active ? "primary.main" : "text.primary",
                          boxShadow: "0 0 8px rgba(212, 175, 55, 0.1)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: active ? "primary.main" : "text.secondary",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        slotProps={{
                          primary: {
                            sx: { fontSize: "0.875rem", fontWeight: active ? 600 : 400 },
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
            {section.heading === "" && (
              <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", mx: 2, mt: 1 }} />
            )}
          </Box>
        ))}
      </Box>

      {/* Theme switcher */}
      <Box sx={{ px: 2, pb: 2, pt: 1, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <Typography
          variant="overline"
          sx={{
            display: "block",
            px: 1,
            pb: 1,
            color: "text.secondary",
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
          }}
        >
          Theme
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {(Object.keys(THEME_META) as ThemeId[]).map((id) => {
            const meta = THEME_META[id];
            const active = themeId === id;
            return (
              <Tooltip key={id} title={meta.description} placement="right" arrow>
                <Box
                  onClick={() => setThemeId(id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 1.25,
                    py: 0.6,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    backgroundColor: active ? "rgba(255,255,255,0.08)" : "transparent",
                    border: active ? "1px solid" : "1px solid transparent",
                    borderColor: active ? "primary.main" : "transparent",
                    transition: "all 0.18s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.06)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: meta.preview,
                      border: "2px solid",
                      borderColor: active ? "primary.main" : "rgba(255,255,255,0.25)",
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: active ? "primary.main" : "text.secondary",
                      fontWeight: active ? 600 : 400,
                      fontSize: "0.78rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {meta.label}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Auth section: Facebook (and Google in future) */}
      <Box sx={{ px: 2, pb: 3, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.7)}`, mt: 2 }}>
        <Typography
          variant="overline"
          sx={{
            display: "block",
            px: 1,
            pb: 1,
            color: "text.secondary",
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
            fontWeight: 700,
          }}
        >
          Account
        </Typography>

        {isAuthenticated ? (
          <Box sx={authCardSx}>
            <Typography
              sx={{
                fontWeight: 700,
                color: theme.palette.success.main,
                fontSize: "0.84rem",
                letterSpacing: "0.03em",
              }}
            >
              Signed in
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              {session?.profilePictureUrl && (
                <Avatar
                  src={session.profilePictureUrl}
                  alt={session.displayName || "Profile picture"}
                  sx={{ width: 34, height: 34, flexShrink: 0 }}
                />
              )}
              {session?.displayName && (
                <Typography sx={{ color: "text.primary", fontSize: "0.9rem", fontWeight: 600 }}>
                  {session.displayName}
                </Typography>
              )}
            </Box>
            {session?.email && (
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.77rem",
                  mt: 0.5,
                  mb: 1.1,
                  maxWidth: "100%",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {session.email}
              </Typography>
            )}
            <Button
              onClick={handleLogout}
              startIcon={<LogoutOutlinedIcon />}
              variant="outlined"
              sx={{
                ...authButtonBaseSx,
                color: theme.palette.error.main,
                borderColor: alpha(theme.palette.error.main, 0.55),
                backgroundColor: alpha(theme.palette.error.main, 0.08),
                "&:hover": {
                  borderColor: alpha(theme.palette.error.main, 0.9),
                  backgroundColor: alpha(theme.palette.error.main, 0.16),
                },
              }}
            >
              Log out
            </Button>
          </Box>
        ) : (
          <Box sx={authCardSx}>
            {(!facebookEnabled || !googleEnabled) && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 0.9,
                  py: 0.35,
                  mb: 0.9,
                  borderRadius: 99,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.45)}`,
                  backgroundColor: alpha(theme.palette.warning.main, 0.14),
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: theme.palette.warning.main,
                    textTransform: "uppercase",
                    lineHeight: 1,
                  }}
                >
                  Setup required
                </Typography>
              </Box>
            )}
            {facebookEnabled && (
              <Button
                onClick={loginWithFacebook}
                startIcon={<FacebookIcon sx={{ fontSize: 20, color: "inherit" }} />}
                variant="outlined"
                sx={{
                  ...authButtonBaseSx,
                  color: theme.palette.primary.main,
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.95),
                    backgroundColor: alpha(theme.palette.primary.main, 0.16),
                  },
                }}
              >
                Continue with Facebook
              </Button>
            )}
            {!facebookEnabled && (
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.76rem",
                  px: 0.5,
                  mb: googleEnabled ? 0.8 : 0,
                }}
              >
                Facebook login unavailable: missing VITE_FACEBOOK_APP_ID.
              </Typography>
            )}
            {googleEnabled && (
              <Button
                onClick={loginWithGoogle}
                startIcon={<GoogleIcon sx={{ fontSize: 20, color: "inherit" }} />}
                variant="outlined"
                sx={{
                  ...authButtonBaseSx,
                  mt: 1,
                  color: theme.palette.text.primary,
                  borderColor: alpha(theme.palette.text.primary, 0.35),
                  backgroundColor: alpha(theme.palette.text.primary, 0.06),
                  "&:hover": {
                    borderColor: alpha(theme.palette.text.primary, 0.7),
                    backgroundColor: alpha(theme.palette.text.primary, 0.12),
                  },
                }}
              >
                Continue with Google
              </Button>
            )}
            {!googleEnabled && (
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.76rem",
                  px: 0.5,
                  mt: facebookEnabled ? 0.8 : 0,
                }}
              >
                Google login unavailable: missing VITE_GOOGLE_CLIENT_ID.
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function MainLayout() {
  useFacebookSDK();
  useGoogleSDK();
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerSx = {
    width: DRAWER_WIDTH,
    flexShrink: 0,
    "& .MuiDrawer-paper": {
      width: DRAWER_WIDTH,
      boxSizing: "border-box",
    },
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", textAlign: "left" }}>
      {/* Mobile AppBar */}
      <AppBar
        position="fixed"
        sx={{
          display: { md: "none" },
          width: "100%",
          boxShadow: "none",
        }}
      >
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ color: "primary.main", mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700 }}>
            MythCloth
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar nav */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Mobile temporary drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, ...drawerSx }}
        >
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </Drawer>

        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{ display: { xs: "none", md: "block" }, ...drawerSx }}
          open
        >
          <SidebarContent />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          mt: { xs: 6, md: 0 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
