import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { esES as coreEsES } from "@mui/material/locale";
import { esES as dataGridEsES } from "@mui/x-data-grid/locales";
import { esES as pickersEsES } from "@mui/x-date-pickers/locales";
import { THEMES, type ThemeId } from "./themes";
import { useLanguage } from "../i18n/useLanguage";

const LS_KEY = "mythClothTheme";

type ThemeContextValue = {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
};

const ThemeCtx = createContext<ThemeContextValue>({
  themeId: "cosmicGlass",
  setThemeId: () => {},
});

export const useAppTheme = () => useContext(ThemeCtx);

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [themeId, setThemeIdState] = useState<ThemeId>(
    () => (localStorage.getItem(LS_KEY) as ThemeId | null) ?? "cosmicGlass"
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", themeId);
  }, [themeId]);

  const setThemeId = (id: ThemeId) => {
    setThemeIdState(id);
    localStorage.setItem(LS_KEY, id);
  };

  // MUI's own strings (DataGrid toolbar, pickers, pagination) ship as theme locale bundles.
  const theme = useMemo(() => {
    const base = THEMES[themeId];
    if (language === "es") {
      return createTheme(base, coreEsES, dataGridEsES, pickersEsES);
    }
    return base;
  }, [themeId, language]);

  return (
    <ThemeCtx.Provider value={{ themeId, setThemeId }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}
