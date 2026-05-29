import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
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
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import GoogleIcon from "@mui/icons-material/Google";
import MenuIcon from "@mui/icons-material/Menu";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useAuth } from "../auth/AuthContext";
import { useAppTheme } from "../theme/ThemeContext";
import { THEME_META, type ThemeId } from "../theme/themes";

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
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { themeId, setThemeId } = useAppTheme();
  const { user, isAuthenticated, facebookEnabled, loginWithGoogle, loginWithFacebook, logout } = useAuth();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = (response: CredentialResponse) => {
    void loginWithGoogle(response);
  };

  const handleFacebookLogin = () => {
    void loginWithFacebook().catch((error) => {
      console.error("[AUTH] Facebook sign-in failed", error);
    });
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

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
        {NAV_SECTIONS.map((section) => (
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

      {/* Google auth */}
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
          Account
        </Typography>

        {isAuthenticated && user ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              px: 1,
              py: 1,
              borderRadius: 1.5,
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar src={user.picture} alt={user.name} sx={{ width: 30, height: 30 }}>
                {user.name.charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 600 }} noWrap>
                  {user.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }} noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<LogoutOutlinedIcon />}
              onClick={logout}
            >
              Logout
            </Button>
          </Box>
        ) : googleClientId || facebookEnabled ? (
          <Box
            sx={{
              px: 1,
              py: 1.25,
              borderRadius: 2,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
              <Box>
                <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 700 }}>
                  Choose a sign-in method
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
                  Connect with either provider below.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                {googleClientId ? (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(234,67,53,0.12)",
                      border: "1px solid rgba(234,67,53,0.28)",
                    }}
                  >
                    <GoogleIcon sx={{ color: "#ea4335", fontSize: 17 }} />
                  </Box>
                ) : null}
                {facebookEnabled ? (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(24,119,242,0.12)",
                      border: "1px solid rgba(24,119,242,0.28)",
                    }}
                  >
                    <FacebookRoundedIcon sx={{ color: "#1877f2", fontSize: 17 }} />
                  </Box>
                ) : null}
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {googleClientId ? (
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.9 }}>
                    <GoogleIcon sx={{ color: "#ea4335", fontSize: 18 }} />
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Continue with Google
                    </Typography>
                  </Box>
                  <Box sx={{ "& > div": { width: "100%" } }}>
                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => {}} text="continue_with" />
                  </Box>
                </Box>
              ) : null}

              {facebookEnabled ? (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FacebookRoundedIcon />}
                  onClick={handleFacebookLogin}
                  sx={{
                    justifyContent: "flex-start",
                    px: 1.25,
                    py: 1,
                    borderRadius: 1.5,
                    borderColor: "rgba(24,119,242,0.38)",
                    color: "#dce7ff",
                    background: "linear-gradient(180deg, rgba(24,119,242,0.18) 0%, rgba(24,119,242,0.1) 100%)",
                    "&:hover": {
                      borderColor: "#1877f2",
                      background: "linear-gradient(180deg, rgba(24,119,242,0.26) 0%, rgba(24,119,242,0.14) 100%)",
                    },
                  }}
                >
                  Continue with Facebook
                </Button>
              ) : null}
            </Box>
          </Box>
        ) : (
          <Typography variant="caption" sx={{ px: 1, color: "error.main", display: "block" }}>
            Auth provider configuration is missing.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

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
          <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700, flexGrow: 1 }}>
            MythCloth
          </Typography>
          {isAuthenticated && user ? (
            <Avatar src={user.picture || undefined} alt={user.name} sx={{ width: 30, height: 30 }}>
              {user.name.charAt(0)}
            </Avatar>
          ) : null}
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
