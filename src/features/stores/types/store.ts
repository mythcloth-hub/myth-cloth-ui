export type StoreCurrency = "JPY" | "MXN" | "EUR" | "USD" | "CNY" | "CAD";

export type StoreName =
  | "LOGAN_STORE"
  | "LUNA_PARK"
  | "MANDARAKE"
  | "MY_KOMBINI"
  | "MYTH_FACTORY"
  | "MYTH_SUPPLIES"
  | "NIN_NIN_GAME";

export type Store = {
  id: number;
  name: string;
  storeName: StoreName;
  website: string;
  logoUrl: string;
  currency: StoreCurrency;
  country: string;
  active: boolean;
};

export type StoreInput = {
  name: string;
  storeName: StoreName;
  website: string;
  logoUrl: string;
  currency: StoreCurrency;
  country: string;
  active: boolean;
};
