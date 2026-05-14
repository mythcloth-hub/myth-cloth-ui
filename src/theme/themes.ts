import { createTheme, type Theme } from "@mui/material";
import type { CSSObject } from "@mui/system";
import type {} from "@mui/x-data-grid/themeAugmentation";

declare module "@mui/material/styles" {
  interface Theme {
    custom: {
      magazineNotes: {
        label: CSSObject;
        container: CSSObject;
        body: CSSObject;
      };
    };
  }

  interface ThemeOptions {
    custom?: {
      magazineNotes?: {
        label?: CSSObject;
        container?: CSSObject;
        body?: CSSObject;
      };
    };
  }
}

export type ThemeId =
  | "cosmicGlass"
  | "darkCosmos"
  | "ancientBronze"
  | "mangaInk"
  | "minimalLight";

export const THEME_META: Record<ThemeId, { label: string; description: string; preview: string }> = {
  cosmicGlass:  { label: "Cosmic Glass",   description: "Glassmorphism over a nebula background", preview: "#060818" },
  darkCosmos:   { label: "Dark Cosmos",    description: "Star atlas with constellation accents",   preview: "#04050f" },
  ancientBronze:{ label: "Ancient Bronze", description: "Museum-grade bronze and copper tones",    preview: "#120d07" },
  mangaInk:     { label: "Manga Ink",      description: "High-contrast ink panels with red flare", preview: "#0a0a0a" },
  minimalLight: { label: "Minimal Light",  description: "Editorial ivory catalog, clean gold",     preview: "#f5f0e8" },
};

// ── Shared overrides across dark themes ─────────────────────────────────────

function dataGridOverrides(columnBg: string, accent: string) {
  return {
    root: {
      borderRadius: 8,
      "& .MuiDataGrid-columnHeader": {
        backgroundColor: columnBg,
        color: accent,
        fontWeight: 700,
        letterSpacing: "0.5px",
        textTransform: "uppercase" as const,
        fontSize: "0.75rem",
      },
      "& .MuiDataGrid-columnSeparator": { color: "rgba(255,255,255,0.1)" },
      "& .MuiDataGrid-row": {
        "&:hover": { backgroundColor: `${accent}0f` },
        "&.Mui-selected": { backgroundColor: `${accent}1a` },
      },
      "& .MuiDataGrid-cell": { borderColor: "rgba(255,255,255,0.05)" },
      "& .MuiDataGrid-footerContainer": { backgroundColor: columnBg },
    },
  };
}

function magazineNotesStyles(mode: "light" | "dark", accent: string) {
  if (mode === "light") {
    return {
      label: {
        color: "text.secondary",
        fontSize: "0.65rem",
        letterSpacing: "0.14em",
      } satisfies CSSObject,
      container: {
        mt: 0.8,
        mb: 2,
        px: "12px",
        py: "11px",
        borderRadius: "12px",
        border: `1px solid ${accent}33`,
        background: "linear-gradient(180deg, rgba(253,248,235,0.92) 0%, rgba(250,242,226,0.72) 100%)",
      } satisfies CSSObject,
      body: {
        color: "rgba(35, 30, 25, 0.92)",
        fontFamily: '"Cormorant Garamond", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif',
        fontSize: "1.05rem",
        lineHeight: 1.86,
        letterSpacing: "0.01em",
        maxWidth: "100%",
        textWrap: "pretty",
        "&::first-letter": {
          float: "left",
          fontSize: "3.05em",
          lineHeight: 0.82,
          paddingRight: "0.09em",
          marginTop: "0.04em",
          fontWeight: 700,
          color: accent,
        },
      } satisfies CSSObject,
    };
  }

  return {
    label: {
      color: "text.secondary",
      fontSize: "0.65rem",
      letterSpacing: "0.14em",
    } satisfies CSSObject,
    container: {
      mt: 0.8,
      mb: 2,
      px: "12px",
      py: "11px",
      borderRadius: "12px",
      border: `1px solid ${accent}38`,
      background: "linear-gradient(180deg, rgba(250,245,230,0.08) 0%, rgba(250,245,230,0.03) 100%)",
    } satisfies CSSObject,
    body: {
      color: "rgba(250, 244, 226, 0.9)",
      fontFamily: '"Cormorant Garamond", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif',
      fontSize: "1.05rem",
      lineHeight: 1.9,
      letterSpacing: "0.01em",
      maxWidth: "100%",
      textWrap: "pretty",
      "&::first-letter": {
        float: "left",
        fontSize: "3.05em",
        lineHeight: 0.82,
        paddingRight: "0.09em",
        marginTop: "0.04em",
        fontWeight: 700,
        color: accent,
      },
    } satisfies CSSObject,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. COSMIC GLASS
// ─────────────────────────────────────────────────────────────────────────────
export const cosmicGlassTheme: Theme = createTheme({
  palette: {
    mode: "dark",
    primary:    { main: "#d4af37", light: "#e8cb6a", dark: "#a08020", contrastText: "#060818" },
    secondary:  { main: "#4fc3f7", light: "#81d4fa", dark: "#0288d1", contrastText: "#060818" },
    background: { default: "#060818", paper: "rgba(10,12,32,0.65)" },
    text:       { primary: "#e8eaf6", secondary: "#90a4c8" },
    divider:    "rgba(255,255,255,0.08)",
    error:      { main: "#f87171" },
  },
  typography: {
    fontFamily: `'Segoe UI', system-ui, Roboto, sans-serif`,
    h4: { fontWeight: 700, letterSpacing: "-0.5px", color: "#d4af37" },
    h6: { fontWeight: 600, color: "#d4af37" },
  },
  shape: { borderRadius: 12 },
  custom: {
    magazineNotes: magazineNotesStyles("dark", "#d4af37"),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: [
            "radial-gradient(ellipse at 15% 40%, rgba(109,40,217,0.18) 0%, transparent 55%)",
            "radial-gradient(ellipse at 85% 15%, rgba(79,195,247,0.10) 0%, transparent 50%)",
            "radial-gradient(ellipse at 55% 90%, rgba(212,175,55,0.08) 0%, transparent 55%)",
            "linear-gradient(160deg, #060818 0%, #08091a 45%, #060d1c 100%)",
          ].join(","),
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
        containedPrimary: {
          background: "linear-gradient(135deg, #d4af37, #a08020)",
          boxShadow: "0 2px 16px rgba(212,175,55,0.4)",
          "&:hover": { background: "linear-gradient(135deg, #e8cb6a, #c09030)", boxShadow: "0 4px 24px rgba(212,175,55,0.6)" },
        },
        outlinedPrimary: {
          borderColor: "rgba(212,175,55,0.45)",
          "&:hover": { borderColor: "#d4af37", backgroundColor: "rgba(212,175,55,0.08)", boxShadow: "0 0 12px rgba(212,175,55,0.2)" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(10,12,32,0.65)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(8,10,28,0.70)",
          backdropFilter: "blur(16px) saturate(150%)",
          WebkitBackdropFilter: "blur(16px) saturate(150%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(6,8,24,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(212,175,55,0.15)",
          boxShadow: "0 1px 20px rgba(0,0,0,0.4)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "rgba(6,8,24,0.80)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          border: "none",
          boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(255,255,255,0.04)",
            "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
            "&:hover fieldset": { borderColor: "rgba(212,175,55,0.4)" },
            "&.Mui-focused fieldset": { borderColor: "#d4af37", boxShadow: "0 0 0 2px rgba(212,175,55,0.15)" },
          },
        },
      },
    },
    MuiSelect: { styleOverrides: { root: { backgroundColor: "rgba(255,255,255,0.04)" } } },
    MuiDivider: { styleOverrides: { root: { borderColor: "rgba(255,255,255,0.08)" } } },
    MuiDataGrid: { styleOverrides: dataGridOverrides("rgba(6,8,24,0.80)", "#d4af37") },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. DARK COSMOS / STAR ATLAS
// ─────────────────────────────────────────────────────────────────────────────
export const darkCosmosTheme: Theme = createTheme({
  palette: {
    mode: "dark",
    primary:    { main: "#c8b8e8", light: "#ddd0f5", dark: "#9a87c4", contrastText: "#04050f" },
    secondary:  { main: "#7ecfeb", contrastText: "#04050f" },
    background: { default: "#04050f", paper: "#0b0e1f" },
    text:       { primary: "#d8dff5", secondary: "#7a88b0" },
    divider:    "rgba(200,184,232,0.12)",
    error:      { main: "#f87171" },
  },
  typography: {
    fontFamily: `Georgia, 'Times New Roman', serif`,
    h4: { fontWeight: 700, letterSpacing: "0.5px", color: "#c8b8e8" },
    h6: { fontWeight: 600, color: "#c8b8e8" },
    body1: { fontFamily: `'Segoe UI', system-ui, sans-serif` },
    body2: { fontFamily: `'Segoe UI', system-ui, sans-serif` },
    caption: { fontFamily: `'Segoe UI', system-ui, sans-serif` },
    button: { fontFamily: `'Segoe UI', system-ui, sans-serif` },
    overline: { fontFamily: `'Segoe UI', system-ui, sans-serif` },
    subtitle1: { fontFamily: `'Segoe UI', system-ui, sans-serif` },
    subtitle2: { fontFamily: `'Segoe UI', system-ui, sans-serif` },
  },
  shape: { borderRadius: 8 },
  custom: {
    magazineNotes: magazineNotesStyles("dark", "#c8b8e8"),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: [
            "radial-gradient(ellipse at 20% 20%, rgba(100,80,180,0.25) 0%, transparent 50%)",
            "radial-gradient(ellipse at 80% 70%, rgba(60,100,200,0.15) 0%, transparent 50%)",
            "radial-gradient(ellipse at 50% 50%, rgba(10,8,35,0.8) 0%, transparent 80%)",
            "linear-gradient(180deg, #04050f 0%, #060920 50%, #04050f 100%)",
          ].join(","),
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        },
        // Subtle star dots via CSS
        "#root::before": {
          content: '""',
          position: "fixed",
          inset: 0,
          backgroundImage: [
            "radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.5) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 30% 45%, rgba(255,255,255,0.3) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 55% 25%, rgba(255,255,255,0.4) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 75% 60%, rgba(255,255,255,0.35) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 90% 10%, rgba(255,255,255,0.45) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 45% 80%, rgba(255,255,255,0.3) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 65% 90%, rgba(255,255,255,0.25) 0%, transparent 100%)",
            "radial-gradient(1px 1px at 15% 70%, rgba(255,255,255,0.4) 0%, transparent 100%)",
          ].join(","),
          pointerEvents: "none",
          zIndex: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, fontFamily: `'Segoe UI', system-ui, sans-serif`, borderRadius: 6 },
        containedPrimary: {
          background: "linear-gradient(135deg, #9a87c4, #6a50a8)",
          boxShadow: "0 2px 16px rgba(154,135,196,0.45)",
          "&:hover": { background: "linear-gradient(135deg, #b8a8dc, #8a70c4)", boxShadow: "0 4px 24px rgba(154,135,196,0.65)" },
        },
        outlinedPrimary: {
          borderColor: "rgba(200,184,232,0.4)",
          "&:hover": { borderColor: "#c8b8e8", backgroundColor: "rgba(200,184,232,0.08)" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#0b0e1f",
          border: "1px solid rgba(200,184,232,0.1)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(100,80,180,0.08)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#080b1a",
          border: "1px solid rgba(200,184,232,0.08)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#07091a",
          borderBottom: "1px solid rgba(200,184,232,0.12)",
          boxShadow: "0 1px 16px rgba(0,0,0,0.5)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#07091a",
          border: "none",
          boxShadow: "4px 0 20px rgba(0,0,0,0.5)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "rgba(200,184,232,0.15)" },
            "&:hover fieldset": { borderColor: "rgba(200,184,232,0.4)" },
            "&.Mui-focused fieldset": { borderColor: "#c8b8e8" },
          },
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: "rgba(200,184,232,0.1)" } } },
    MuiDataGrid: { styleOverrides: dataGridOverrides("#07091a", "#c8b8e8") },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ANCIENT BRONZE
// ─────────────────────────────────────────────────────────────────────────────
export const ancientBronzeTheme: Theme = createTheme({
  palette: {
    mode: "dark",
    primary:    { main: "#b87333", light: "#d4945a", dark: "#8c5520", contrastText: "#120d07" },
    secondary:  { main: "#c9a84c", light: "#e0c070", dark: "#9a7830", contrastText: "#120d07" },
    background: { default: "#120d07", paper: "#1c1409" },
    text:       { primary: "#e8dcc8", secondary: "#a08060" },
    divider:    "rgba(184,115,51,0.18)",
    error:      { main: "#f87171" },
  },
  typography: {
    fontFamily: `'Segoe UI', system-ui, Roboto, sans-serif`,
    h4: { fontWeight: 700, letterSpacing: "0.3px", color: "#c9a84c" },
    h6: { fontWeight: 600, color: "#c9a84c" },
  },
  shape: { borderRadius: 6 },
  custom: {
    magazineNotes: magazineNotesStyles("dark", "#c9a84c"),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: [
            "radial-gradient(ellipse at 20% 30%, rgba(140,85,32,0.2) 0%, transparent 55%)",
            "radial-gradient(ellipse at 80% 70%, rgba(100,60,20,0.15) 0%, transparent 55%)",
            "linear-gradient(160deg, #120d07 0%, #1a1008 50%, #100c06 100%)",
          ].join(","),
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 4 },
        containedPrimary: {
          background: "linear-gradient(135deg, #b87333, #8c5520)",
          boxShadow: "0 2px 12px rgba(184,115,51,0.4)",
          "&:hover": { background: "linear-gradient(135deg, #d4945a, #a86830)", boxShadow: "0 4px 20px rgba(184,115,51,0.6)" },
        },
        outlinedPrimary: {
          borderColor: "rgba(184,115,51,0.4)",
          "&:hover": { borderColor: "#b87333", backgroundColor: "rgba(184,115,51,0.08)" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#1c1409",
          border: "1px solid rgba(184,115,51,0.15)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(184,115,51,0.06)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#160f06",
          border: "1px solid rgba(184,115,51,0.12)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#100c06",
          borderBottom: "1px solid rgba(184,115,51,0.2)",
          boxShadow: "0 1px 16px rgba(0,0,0,0.5)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#100c06",
          border: "none",
          boxShadow: "4px 0 20px rgba(0,0,0,0.5)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "rgba(184,115,51,0.2)" },
            "&:hover fieldset": { borderColor: "rgba(184,115,51,0.45)" },
            "&.Mui-focused fieldset": { borderColor: "#b87333" },
          },
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: "rgba(184,115,51,0.15)" } } },
    MuiDataGrid: { styleOverrides: dataGridOverrides("#100c06", "#c9a84c") },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. MANGA INK
// ─────────────────────────────────────────────────────────────────────────────
export const mangaInkTheme: Theme = createTheme({
  palette: {
    mode: "dark",
    primary:    { main: "#e03030", light: "#ff5555", dark: "#a01818", contrastText: "#ffffff" },
    secondary:  { main: "#e8e8e8", contrastText: "#0a0a0a" },
    background: { default: "#0a0a0a", paper: "#141414" },
    text:       { primary: "#f0f0f0", secondary: "#888888" },
    divider:    "rgba(255,255,255,0.10)",
    error:      { main: "#ff5555" },
  },
  typography: {
    fontFamily: `'Segoe UI', system-ui, Roboto, sans-serif`,
    h4: { fontWeight: 900, letterSpacing: "1px", color: "#f0f0f0", textTransform: "uppercase" as const },
    h6: { fontWeight: 800, color: "#f0f0f0", letterSpacing: "0.5px" },
  },
  shape: { borderRadius: 4 },
  custom: {
    magazineNotes: magazineNotesStyles("dark", "#e03030"),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "#0a0a0a",
          backgroundImage: [
            "radial-gradient(ellipse at 85% 10%, rgba(200,0,0,0.12) 0%, transparent 45%)",
            "radial-gradient(ellipse at 15% 85%, rgba(180,0,0,0.08) 0%, transparent 45%)",
          ].join(","),
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "uppercase", fontWeight: 800, borderRadius: 2, letterSpacing: "1px" },
        containedPrimary: {
          background: "#e03030",
          boxShadow: "0 2px 12px rgba(224,48,48,0.45)",
          "&:hover": { background: "#ff4040", boxShadow: "0 4px 20px rgba(224,48,48,0.7)" },
        },
        outlinedPrimary: {
          borderColor: "rgba(224,48,48,0.5)",
          borderWidth: 2,
          "&:hover": { borderColor: "#e03030", backgroundColor: "rgba(224,48,48,0.08)", borderWidth: 2 },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#141414",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "4px 4px 0 rgba(224,48,48,0.15), 0 4px 20px rgba(0,0,0,0.6)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#111111",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "3px 3px 0 rgba(224,48,48,0.2), 0 4px 20px rgba(0,0,0,0.7)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#080808",
          borderBottom: "2px solid rgba(224,48,48,0.5)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.8)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#080808",
          border: "none",
          borderRight: "2px solid rgba(224,48,48,0.2)",
          boxShadow: "4px 0 20px rgba(0,0,0,0.8)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "rgba(255,255,255,0.15)", borderRadius: 2 },
            "&:hover fieldset": { borderColor: "rgba(224,48,48,0.5)" },
            "&.Mui-focused fieldset": { borderColor: "#e03030" },
          },
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: "rgba(255,255,255,0.10)" } } },
    MuiDataGrid: { styleOverrides: dataGridOverrides("#080808", "#e03030") },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. MINIMAL LIGHT
// ─────────────────────────────────────────────────────────────────────────────
export const minimalLightTheme: Theme = createTheme({
  palette: {
    mode: "light",
    primary:    { main: "#b8860b", light: "#d4a820", dark: "#8a6208", contrastText: "#ffffff" },
    secondary:  { main: "#607d8b", contrastText: "#ffffff" },
    background: { default: "#f7f2ea", paper: "#ffffff" },
    text:       { primary: "#1a1a2e", secondary: "#6b6b7a" },
    divider:    "rgba(184,134,11,0.15)",
    error:      { main: "#c62828" },
  },
  typography: {
    fontFamily: `'Segoe UI', system-ui, Roboto, sans-serif`,
    h4: { fontWeight: 700, letterSpacing: "-0.5px", color: "#1a1a2e" },
    h6: { fontWeight: 600, color: "#1a1a2e" },
  },
  shape: { borderRadius: 8 },
  custom: {
    magazineNotes: magazineNotesStyles("light", "#b8860b"),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: [
            "radial-gradient(ellipse at 10% 0%, rgba(184,134,11,0.06) 0%, transparent 50%)",
            "radial-gradient(ellipse at 90% 100%, rgba(184,134,11,0.04) 0%, transparent 50%)",
            "#f7f2ea",
          ].join(","),
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 6 },
        containedPrimary: {
          background: "linear-gradient(135deg, #d4a820, #8a6208)",
          boxShadow: "0 2px 10px rgba(184,134,11,0.3)",
          color: "#ffffff",
          "&:hover": { background: "linear-gradient(135deg, #e8c040, #b07818)", boxShadow: "0 4px 16px rgba(184,134,11,0.5)" },
        },
        outlinedPrimary: {
          borderColor: "rgba(184,134,11,0.5)",
          "&:hover": { borderColor: "#b8860b", backgroundColor: "rgba(184,134,11,0.06)" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#ffffff",
          border: "1px solid rgba(184,134,11,0.12)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(184,134,11,0.15)",
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          color: "#1a1a2e",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "#ffffff",
          border: "none",
          borderRight: "1px solid rgba(184,134,11,0.12)",
          boxShadow: "2px 0 16px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#faf8f4",
            "& fieldset": { borderColor: "rgba(0,0,0,0.15)" },
            "&:hover fieldset": { borderColor: "rgba(184,134,11,0.5)" },
            "&.Mui-focused fieldset": { borderColor: "#b8860b" },
          },
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: "rgba(184,134,11,0.12)" } } },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: "#faf8f4",
            color: "#b8860b",
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase" as const,
            fontSize: "0.75rem",
          },
          "& .MuiDataGrid-columnSeparator": { color: "rgba(0,0,0,0.1)" },
          "& .MuiDataGrid-row": {
            "&:hover": { backgroundColor: "rgba(184,134,11,0.05)" },
            "&.Mui-selected": { backgroundColor: "rgba(184,134,11,0.1)" },
          },
          "& .MuiDataGrid-cell": { borderColor: "rgba(0,0,0,0.06)", color: "#1a1a2e" },
          "& .MuiDataGrid-footerContainer": { backgroundColor: "#faf8f4" },
        },
      },
    },
  },
});

export const THEMES: Record<ThemeId, Theme> = {
  cosmicGlass:   cosmicGlassTheme,
  darkCosmos:    darkCosmosTheme,
  ancientBronze: ancientBronzeTheme,
  mangaInk:      mangaInkTheme,
  minimalLight:  minimalLightTheme,
};
