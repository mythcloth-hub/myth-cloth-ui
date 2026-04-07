import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import type {} from "@mui/x-data-grid/themeAugmentation";

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#d4af37',
      light: '#e8cb6a',
      dark: '#a08020',
      contrastText: '#0a0b14',
    },
    secondary: {
      main: '#4fc3f7',
      contrastText: '#0a0b14',
    },
    background: {
      default: '#0a0b14',
      paper: '#111827',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
    },
    divider: 'rgba(212, 175, 55, 0.15)',
    error: {
      main: '#f87171',
    },
  },
  typography: {
    fontFamily: `'Segoe UI', system-ui, Roboto, sans-serif`,
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
      color: '#d4af37',
    },
    h6: {
      fontWeight: 600,
      color: '#d4af37',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0a0b14 0%, #0f111e 50%, #0a0d1a 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 6,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #d4af37, #a08020)',
          boxShadow: '0 2px 12px rgba(212, 175, 55, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #e8cb6a, #c09030)',
            boxShadow: '0 4px 20px rgba(212, 175, 55, 0.5)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(212, 175, 55, 0.12)',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(212, 175, 55, 0.15)',
          borderRadius: 8,
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: '#0f1420',
            color: '#d4af37',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
          },
          '& .MuiDataGrid-columnSeparator': {
            color: 'rgba(212, 175, 55, 0.2)',
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: 'rgba(212, 175, 55, 0.06)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
            },
          },
          '& .MuiDataGrid-cell': {
            borderColor: 'rgba(212, 175, 55, 0.08)',
            color: '#e2e8f0',
          },
          '& .MuiDataGrid-footerContainer': {
            borderColor: 'rgba(212, 175, 55, 0.15)',
            backgroundColor: '#0f1420',
          },
        },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
)