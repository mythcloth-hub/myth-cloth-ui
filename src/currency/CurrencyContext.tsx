import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { getBrowserPreferredCurrency, isSupportedCurrency, type SupportedCurrency } from "./currency";

const LS_KEY = "mythClothDisplayCurrency";

type CurrencyContextValue = {
  selectedCurrency: SupportedCurrency | null;
  setSelectedCurrency: (currency: SupportedCurrency | null) => void;
};

const CurrencyCtx = createContext<CurrencyContextValue>({
  selectedCurrency: null,
  setSelectedCurrency: () => {},
});

export const useDisplayCurrency = () => useContext(CurrencyCtx);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrencyState, setSelectedCurrencyState] = useState<SupportedCurrency | null>(() => {
    if (typeof localStorage === "undefined") {
      return getBrowserPreferredCurrency();
    }

    const stored = localStorage.getItem(LS_KEY);
    if (isSupportedCurrency(stored)) {
      return stored;
    }

    return getBrowserPreferredCurrency();
  });

  const setSelectedCurrency = (currency: SupportedCurrency | null) => {
    setSelectedCurrencyState(currency);

    if (currency) {
      localStorage.setItem(LS_KEY, currency);
      return;
    }

    localStorage.removeItem(LS_KEY);
  };

  const value = useMemo(
    () => ({ selectedCurrency: selectedCurrencyState, setSelectedCurrency }),
    [selectedCurrencyState],
  );

  return <CurrencyCtx.Provider value={value}>{children}</CurrencyCtx.Provider>;
}
