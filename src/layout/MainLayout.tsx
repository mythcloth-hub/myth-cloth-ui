import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import Button from "@mui/material/Button";
import FacebookIcon from "@mui/icons-material/Facebook";
import GoogleIcon from "@mui/icons-material/Google";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  AppBar,
  Box,
  Collapse,
  CircularProgress,
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
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import GroupWorkOutlinedIcon from "@mui/icons-material/GroupWorkOutlined";
import ViewTimelineOutlinedIcon from "@mui/icons-material/ViewTimelineOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import CompareOutlinedIcon from "@mui/icons-material/CompareOutlined";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SettingsSuggestOutlinedIcon from "@mui/icons-material/SettingsSuggestOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import ContactMailOutlinedIcon from "@mui/icons-material/ContactMailOutlined";
import KeyboardArrowUpOutlinedIcon from "@mui/icons-material/KeyboardArrowUpOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";
import { alpha, keyframes, useTheme } from "@mui/material/styles";

const DRAWER_WIDTH = 230;

const pulseAttention = keyframes`
  0%, 100% { opacity: 1; text-shadow: 0 0 0 rgba(212, 175, 55, 0); }
  50% { opacity: 0.55; text-shadow: 0 0 10px rgba(212, 175, 55, 0.9); }
`;

type NavItem = {
  label: string;
  path?: string;
  icon: React.ReactNode;
  permission?: string;
  children?: NavItem[];
  expandOnly?: boolean;
};

type NavSection = {
  heading: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    heading: "",
    items: [
      { label: "Home", path: "/", icon: <HomeOutlinedIcon /> },
    ],
  },
  {
    heading: "Collections",
    items: [
      { label: "Myth Cloth",     path: "/figurines",   icon: <WorkspacePremiumOutlinedIcon /> },
      { label: "My Collections", path: "/collections", icon: <Inventory2OutlinedIcon />, permission: "collections:read" },
      { label: "Purchases",      path: "/purchases",   icon: <ShoppingBagOutlinedIcon />,    permission: "purchases:read" }
    ],
  },
  {
    heading: "Explore",
    items: [
      { label: "Releases", path: "/releases", icon: <RocketLaunchOutlinedIcon />, permission: "stats:read" },
      { label: "Charts",   path: "/charts",   icon: <QueryStatsOutlinedIcon />,      permission: "stats:read" },
      { label: "Pricing",  path: "/pricing",  icon: <SellOutlinedIcon />,          permission: "stats:read" }
    ],
  },
  {
    heading: "Figurine Matching",
    items: [
      { label: "Manual Matching", path: "/figurine-matching",        icon: <CompareOutlinedIcon />, permission: "figurines:stores:read" },
      { label: "Store Matching",  path: "/figurine-matching/stores", icon: <StoreOutlinedIcon />,    permission: "figurines:stores:read" }
    ],
  },
  {
    heading: "Events & Partners",
    items: [
      { label: "Anniversaries", path: "/anniversaries", icon: <CelebrationOutlinedIcon />,     permission: "anniversaries:read" },
      { label: "Distributors",  path: "/distributors",  icon: <LocalShippingOutlinedIcon />,  permission: "distributors:read" }
    ],
  },
  {
    heading: "Administration",
    items: [
      {
        label: "Catalogs",
        icon: <LibraryBooksOutlinedIcon />,
        expandOnly: true,
        children: [
          { label: "Distributions", path: "/catalogs/distributions", icon: <HubOutlinedIcon />,         permission: "catalogs:read" },
          { label: "Groups",        path: "/catalogs/groups",        icon: <GroupWorkOutlinedIcon />,      permission: "catalogs:read" },
          { label: "Lineups",       path: "/catalogs/lineups",       icon: <ViewTimelineOutlinedIcon />,    permission: "catalogs:read" },
          { label: "Series",        path: "/catalogs/series",        icon: <AutoStoriesOutlinedIcon />, permission: "catalogs:read" }
        ]
      },
      { label: "Stores", path: "/stores", icon: <StoreOutlinedIcon />, permission: "stores:create" },
      { 
        label: "Security",
        icon: <SecurityOutlinedIcon />,
        expandOnly: true,
        children: [
          { label: "Roles",            path: "/security/roles",            icon: <BadgeOutlinedIcon />, permission: "roles:read" },
          { label: "Permissions",      path: "/security/permissions",      icon: <KeyOutlinedIcon />,               permission: "permissions:read" },
          { label: "Role Permissions", path: "/security/role-permissions", icon: <VpnKeyOutlinedIcon />,               permission: "roles:permissions:read" }
        ]
      },
      { label: "Figurine Import", path: "/figurines/import", icon: <UploadFileOutlinedIcon />, permission: "figurines:import" }
    ]
  },
  {
    heading: "Settings",
    items: [
      {
        label: "Personal",
        icon: <SettingsSuggestOutlinedIcon />,
        expandOnly: true,
        children: [
          { label: "Your Account", path: "/account", icon: <ManageAccountsOutlinedIcon /> },
          { label: "Preferences", path: "/settings/preferences", icon: <TuneOutlinedIcon /> }
        ]
      },
      {
        label: "Information",
        icon: <InfoOutlinedIcon />,
        expandOnly: true,
        children: [
          { label: "Terms & Conditions", path: "/terms", icon: <GavelOutlinedIcon /> },
          { label: "Contact", path: "/contact", icon: <ContactMailOutlinedIcon /> },
          { label: "About", path: "/about", icon: <InfoOutlinedIcon /> }
        ]
      }
    ]
  }
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
  const { isAuthenticated, session, hasPermission, loginWithFacebook, loginWithGoogle, loginWithDemo, facebookEnabled, googleEnabled, demoEnabled, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [isDemoSigningIn, setIsDemoSigningIn] = useState(false);
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollUpHint, setShowScrollUpHint] = useState(false);
  const [showScrollDownHint, setShowScrollDownHint] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

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

  const isActive = (path?: string) => {
    if (!path) {
      return false;
    }

    if (path === "/") {
      return location.pathname === "/";
    }

    if (path === "/figurine-matching") {
      return location.pathname === "/figurine-matching";
    }

    if (path === "/figurine-matching/stores") {
      return location.pathname.startsWith("/figurine-matching/stores");
    }

    return location.pathname.startsWith(path);
  };

  const filterVisibleNavItem = useCallback(
    (item: NavItem): NavItem | null => {
      const visibleChildren = item.children?.map(filterVisibleNavItem).filter((child): child is NavItem => child !== null);
      const hasAccess = !item.permission || hasPermission(item.permission);
      const hasVisibleChildren = Boolean(visibleChildren && visibleChildren.length > 0);

      if (item.path) {
        if (!hasAccess) {
          return hasVisibleChildren ? { ...item, children: visibleChildren } : null;
        }
        return hasVisibleChildren ? { ...item, children: visibleChildren } : item;
      }

      if (hasVisibleChildren) {
        return { ...item, children: visibleChildren };
      }

      return null;
    },
    [hasPermission],
  );

  const visibleSections = useMemo(
    () =>
      NAV_SECTIONS
        .map((section) => ({
          ...section,
          items: section.items
            .map(filterVisibleNavItem)
            .filter((item): item is NavItem => item !== null),
        }))
        .filter((section) => section.items.length > 0),
    [filterVisibleNavItem],
  );

  const hasActiveDescendant = useCallback(
    (item: NavItem): boolean =>
      Boolean(
        item.children?.some((child) => {
          const childActive = isActive(child.path);
          return childActive || hasActiveDescendant(child);
        }),
      ),
    [location.pathname],
  );

  const updateScrollHint = useCallback(() => {
    const el = navScrollRef.current;
    if (!el) {
      setShowScrollUpHint(false);
      setShowScrollDownHint(false);
      return;
    }

    const hasOverflow = el.scrollHeight > el.clientHeight + 1;
    const canScrollUp = el.scrollTop > 1;
    const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1;

    setShowScrollUpHint(hasOverflow && canScrollUp);
    setShowScrollDownHint(hasOverflow && canScrollDown);
  }, []);

  useEffect(() => {
    updateScrollHint();
    const handleResize = () => updateScrollHint();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollHint, visibleSections.length, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsDemoSigningIn(false);
    }
  }, [isAuthenticated]);

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

  const toggleExpanded = (key: string) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }));
  };

  const renderNavItem = (item: NavItem, level: number, parentKey: string) => {
    const itemKey = `${parentKey}/${item.path ?? item.label}`;
    const hasChildren = Boolean(item.children?.length);
    const canNavigate = Boolean(item.path) && !(hasChildren && item.expandOnly);
    const active = isActive(item.path);
    const activeDescendant = hasActiveDescendant(item);
    const expanded = activeDescendant ? true : (expandedItems[itemKey] ?? false);
    const collapseTimeout = {
      enter: 180 + Math.min(level, 4) * 45,
      exit: 120 + Math.min(level, 4) * 25,
    };
    const shouldDrawAttention = item.label === "Myth Cloth" && !isAuthenticated;

    return (
      <Box key={itemKey}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (hasChildren && (!canNavigate || !item.path)) {
                toggleExpanded(itemKey);
                return;
              }
              if (canNavigate && item.path) {
                handleClick(item.path);
              }
            }}
            sx={{
              mx: 1,
              pl: 1 + level * 1.5,
              borderRadius: 1.5,
              mb: 0.25,
              color: active ? "primary.main" : "text.secondary",
              backgroundColor: active ? "rgba(212, 175, 55, 0.12)" : "transparent",
              borderLeft: active ? "2px solid #d4af37" : "2px solid transparent",
              boxShadow: active ? "0 0 12px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
              backdropFilter: active ? "blur(8px)" : "none",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: active ? "rgba(212, 175, 55, 0.18)" : "rgba(255,255,255,0.05)",
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
                  sx: {
                    fontSize: "0.875rem",
                    fontWeight: active || activeDescendant || shouldDrawAttention ? 600 : 400,
                    ...(shouldDrawAttention && {
                      color: "#d4af37",
                      animation: `${pulseAttention} 1.6s ease-in-out infinite`,
                    }),
                  },
                },
              }}
            />
            {hasChildren && (
              expanded
                ? <KeyboardArrowDownOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                : <KeyboardArrowRightOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            )}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={expanded} timeout={collapseTimeout} unmountOnExit>
            <List dense disablePadding>
              {item.children!.map((child) => renderNavItem(child, level + 1, itemKey))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const handleLogout = () => {
    setIsDemoSigningIn(false);
    logout();
    navigate("/");
    onNavigate?.();
  };

  const handleDemoLogin = async () => {
    if (isDemoSigningIn) {
      return;
    }

    setIsDemoSigningIn(true);
    try {
      await Promise.resolve(loginWithDemo());
    } finally {
      setIsDemoSigningIn(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Brand */}
      <Box
        onClick={() => handleClick("/")}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick("/");
          }
        }}
        sx={{ px: 3, py: 2.5, borderBottom: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.45 }}>
          <Box
            component="img"
            src="/logo-mark.svg"
            alt="Saint Collections logo"
            sx={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }}
          />
          <Typography
            variant="h6"
            sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 1, lineHeight: 1.2 }}
          >
            Saint Collections
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Every collection tells a story. Track yours.
        </Typography>
      </Box>

      {/* Nav sections */}
      <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
        <Box
          ref={navScrollRef}
          onScroll={updateScrollHint}
          sx={{
            height: "100%",
            overflowY: "auto",
            pt: 1,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
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
              {section.items.map((item) => renderNavItem(item, 0, section.heading || "main"))}
            </List>
            {section.heading === "" && (
              <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", mx: 2, mt: 1 }} />
            )}
            </Box>
          ))}
        </Box>

        {showScrollUpHint && (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 40,
              pointerEvents: "none",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              pt: 0.2,
              background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.88)} 0%, ${alpha(theme.palette.background.default, 0)} 100%)`,
            }}
          >
            <KeyboardArrowUpOutlinedIcon
              sx={{
                color: "text.secondary",
                fontSize: 20,
                animation: "mythSidebarScrollHintUp 1.4s ease-in-out infinite",
                "@keyframes mythSidebarScrollHintUp": {
                  "0%, 100%": { transform: "translateY(0)", opacity: 0.65 },
                  "50%": { transform: "translateY(-3px)", opacity: 1 },
                },
              }}
            />
          </Box>
        )}

        {showScrollDownHint && (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 44,
              pointerEvents: "none",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              pb: 0.4,
              background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0)} 0%, ${alpha(theme.palette.background.default, 0.88)} 74%)`,
            }}
          >
            <KeyboardArrowDownOutlinedIcon
              sx={{
                color: "text.secondary",
                fontSize: 20,
                animation: "mythSidebarScrollHintDown 1.4s ease-in-out infinite",
                "@keyframes mythSidebarScrollHintDown": {
                  "0%, 100%": { transform: "translateY(0)", opacity: 0.65 },
                  "50%": { transform: "translateY(3px)", opacity: 1 },
                },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Auth section: Facebook (and Google in future) */}
      <Box
        sx={{
          px: 2,
          pb: 3,
          pt: 1.5,
          mt: 1.5,
        }}
      >
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
          Current account
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
            
            <Button
              onClick={handleLogout}
              startIcon={<LogoutOutlinedIcon />}
              variant="text"
              sx={{
                mt: 0.75,
                px: 0.5,
                py: 0.35,
                minHeight: 0,
                width: "auto",
                alignSelf: "flex-start",
                justifyContent: "flex-start",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.78rem",
                color: "text.secondary",
                "&:hover": {
                  color: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
                },
              }}
            >
              Log out
            </Button>
          </Box>
        ) : (
          <Box sx={authCardSx}>
            {!facebookEnabled && !googleEnabled && !demoEnabled && (
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
                Facebook
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
                Google
              </Button>
            )}
            {demoEnabled && (
              <Button
                onClick={handleDemoLogin}
                disabled={isDemoSigningIn}
                startIcon={
                  isDemoSigningIn
                    ? <CircularProgress size={18} color="inherit" />
                    : <PersonOutlineOutlinedIcon sx={{ fontSize: 20, color: "inherit" }} />
                }
                variant="outlined"
                sx={{
                  ...authButtonBaseSx,
                  mt: 1,
                  color: theme.palette.info.main,
                  borderColor: alpha(theme.palette.info.main, 0.45),
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  "&:hover": {
                    borderColor: alpha(theme.palette.info.main, 0.8),
                    backgroundColor: alpha(theme.palette.info.main, 0.2),
                  },
                }}
              >
                {isDemoSigningIn ? "Signing in..." : "Demo"}
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
  const navigate = useNavigate();
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
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", textAlign: "left" }}>
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
          <Box
            onClick={() => navigate("/")}
            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
          >
            <Box
              component="img"
              src="/logo-mark.svg"
              alt="Saint Collections logo"
              sx={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0 }}
            />
            <Typography
              variant="h6"
              sx={{ color: "primary.main", fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.1 }}
            >
              Saint Collections
            </Typography>
          </Box>
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
          overflowY: "auto",
          mt: { xs: 6, md: 0 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
