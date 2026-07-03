import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { THEMES, type ThemeId } from "./themes";

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

  return (
    <ThemeCtx.Provider value={{ themeId, setThemeId }}>
      <ThemeProvider theme={THEMES[themeId]}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}
