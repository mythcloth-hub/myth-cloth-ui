import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
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
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
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
    </Box>
  );
}

export default function MainLayout() {
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
