import httpClient from "../../../api/httpClient";
import { toCurrencyParam, type SupportedCurrency } from "../../../currency/currency";

type CurrencyRequestParams = {
  currency?: SupportedCurrency;
};

export type FigurineStoreMatchedSummary = {
  storeId: number;
  storeName: string;
  storeWebsite: string;
  storeLogo?: string | null;
  currency: string;
  country?: string | null;
  matchedFigurineCount: number;
};

export type FigurineStoreMatched = {
  id: number;
  figurineId: number;
  figurineDisplayableName: string;
  figurineLineUp?: string | null;
  figurineOfficialImageUrl?: string | null;
  figurineTamashiiUrl?: string | null;
  storeId: number;
  storeCurrency?: string | null;
  storeOriginalName: string;
  storeProductImageUrl?: string | null;
  storeProductUrl?: string | null;
  storeStatus?: string | null;
  storePrices?: FigurineStoreMatchedPrice[] | null;
};

export type FigurineStoreMatchedPrice = {
  currency?: string | null;
  realTimePrice?: number | null;
  discount?: number | null;
  discountedPrice?: number | null;
  lastUpdated?: string | null;
};

const BASE = "/figurine-stores/matched-listings";
const MANUAL_MATCH_BASE = "/figurine-stores/matched-listings/figurine-store";

export const getMatchedListingsSummary = async (
  params?: CurrencyRequestParams,
): Promise<FigurineStoreMatchedSummary[]> => {
  const response = await httpClient.get<FigurineStoreMatchedSummary[]>(`${BASE}/summary`, {
    params: toCurrencyParam(params?.currency),
    headers: {
      accept: "application/json",
    },
  });

  return response.data;
};

export const getMatchedListingsByStoreId = async (
  storeId: number,
  params?: CurrencyRequestParams,
): Promise<FigurineStoreMatched[]> => {
  const response = await httpClient.get<FigurineStoreMatched[]>(`${BASE}/stores/${storeId}`, {
    params: toCurrencyParam(params?.currency),
    headers: {
      accept: "application/json",
    },
  });

  return response.data;
};

export const manuallyMatchFigurineListing = async (figurineStoreId: number): Promise<void> => {
  await httpClient.post(`${MANUAL_MATCH_BASE}/${figurineStoreId}`, undefined, {
    headers: {
      accept: "application/json",
    },
  });
};
