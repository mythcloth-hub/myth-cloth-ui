import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeContextProvider } from './theme/ThemeContext.tsx';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _REMOVED_theme = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#d4af37',
      light: '#e8cb6a',
      dark: '#a08020',
      contrastText: '#060818',
    },
    secondary: {
      main: '#4fc3f7',
      light: '#81d4fa',
      dark: '#0288d1',
      contrastText: '#060818',
    },
    background: {
      default: '#060818',
      paper: 'rgba(10, 12, 32, 0.65)',
    },
    text: {
      primary: '#e8eaf6',
      secondary: '#90a4c8',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
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
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: [
            'radial-gradient(ellipse at 15% 40%, rgba(109, 40, 217, 0.18) 0%, transparent 55%)',
            'radial-gradient(ellipse at 85% 15%, rgba(79, 195, 247, 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse at 55% 90%, rgba(212, 175, 55, 0.08) 0%, transparent 55%)',
            'radial-gradient(ellipse at 0% 100%, rgba(30, 27, 75, 0.6) 0%, transparent 50%)',
            'linear-gradient(160deg, #060818 0%, #08091a 45%, #060d1c 100%)',
          ].join(','),
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #d4af37, #a08020)',
          boxShadow: '0 2px 16px rgba(212, 175, 55, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #e8cb6a, #c09030)',
            boxShadow: '0 4px 24px rgba(212, 175, 55, 0.6)',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(212, 175, 55, 0.45)',
          '&:hover': {
            borderColor: '#d4af37',
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
            boxShadow: '0 0 12px rgba(212, 175, 55, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(10, 12, 32, 0.65)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(8, 10, 28, 0.7)',
          backdropFilter: 'blur(16px) saturate(150%)',
          WebkitBackdropFilter: 'blur(16px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(6, 8, 24, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
          boxShadow: '0 1px 20px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(6, 8, 24, 0.8)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.07)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(8px)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(212, 175, 55, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#d4af37',
              boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.15)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          backgroundColor: 'rgba(8, 10, 28, 0.6)',
          backdropFilter: 'blur(16px)',
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: 'rgba(6, 8, 24, 0.8)',
            color: '#d4af37',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
          },
          '& .MuiDataGrid-columnSeparator': {
            color: 'rgba(255, 255, 255, 0.1)',
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
            borderColor: 'rgba(255, 255, 255, 0.05)',
            color: '#e8eaf6',
          },
          '& .MuiDataGrid-footerContainer': {
            borderColor: 'rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(6, 8, 24, 0.8)',
          },
        },
      },
    },
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeContextProvider>
      <App />
    </ThemeContextProvider>
  </StrictMode>
)