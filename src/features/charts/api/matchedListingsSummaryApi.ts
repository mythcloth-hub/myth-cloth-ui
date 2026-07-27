import httpClient from "../../../api/httpClient";

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
  storeOriginalName: string;
  storeProductImageUrl?: string | null;
  storeProductUrl?: string | null;
};

const BASE = "/figurine-stores/matched-listings";
const MANUAL_MATCH_BASE = "/figurine-stores/matched-listings/figurine-store";

export const getMatchedListingsSummary = async (): Promise<FigurineStoreMatchedSummary[]> => {
  const response = await httpClient.get<FigurineStoreMatchedSummary[]>(`${BASE}/summary`, {
    headers: {
      accept: "application/json",
    },
  });

  return response.data;
};

export const getMatchedListingsByStoreId = async (storeId: number): Promise<FigurineStoreMatched[]> => {
  const response = await httpClient.get<FigurineStoreMatched[]>(`${BASE}/stores/${storeId}`, {
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
