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
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";

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
      { label: "Distributors",  path: "/distributors",            icon: <LocalShippingOutlinedIcon /> },
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

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleClick = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid rgba(212, 175, 55, 0.2)" }}>
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
                        borderRadius: 1,
                        mb: 0.25,
                        color: active ? "primary.main" : "text.secondary",
                        backgroundColor: active
                          ? "rgba(212, 175, 55, 0.1)"
                          : "transparent",
                        "&:hover": {
                          backgroundColor: active
                            ? "rgba(212, 175, 55, 0.15)"
                            : "rgba(255,255,255,0.05)",
                          color: active ? "primary.main" : "text.primary",
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
              <Divider sx={{ borderColor: "rgba(212, 175, 55, 0.1)", mx: 2, mt: 1 }} />
            )}
          </Box>
        ))}
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
      backgroundColor: "background.paper",
      borderRight: "1px solid rgba(212, 175, 55, 0.12)",
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
          backgroundColor: "background.paper",
          borderBottom: "1px solid rgba(212, 175, 55, 0.15)",
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
