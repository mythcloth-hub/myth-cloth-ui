import httpClient from "../../../api/httpClient";
import { isSupportedCurrency, toCurrencyParam, type SupportedCurrency } from "../../../currency/currency";
import type {
  Figurine,
  FigurineEvent,
  FigurineEventReq,
  FigurineImportRecord,
  PaginatedFigurines,
  FigurineFilters,
  SelectableFigurineIdsResponse,
} from "../types/figurine";

const BASE = "/figurines";
const FIGURINE_STORES_BASE = "/figurine-stores";

type FigurineStorePricingResp = {
  realTimePrice?: number | string | null;
  currency?: string | null;
};

export type FigurineAverageRealtimePrice = {
  realTimePrice: number | null;
  currency: SupportedCurrency | null;
};

export type StoreSummary = {
  id: number;
  name: string;
  storeName: string;
  website?: string;
  logoUrl?: string;
  currency?: string;
  country?: string;
  active?: boolean;
};

export type FigurineHistoricalPricePoint = {
  storeName: string;
  storeLogoUrl?: string | null;
  storeProductUrl?: string | null;
  price: number;
  checkedAt: string;
};

export type FigurineHistoricalPricesResponse = {
  name?: string;
  currency: string;
  prices: FigurineHistoricalPricePoint[];
};

type FigurineStorePricingRequestParams = {
  currency?: SupportedCurrency;
};

type FigurineHistoricalPricingRequestParams = {
  currency?: SupportedCurrency;
  storeId?: number;
};

const buildFigurineQueryParams = (
  page?: number,
  size?: number,
  params?: FigurineFilters
): Record<string, any> => {
  const queryParams: Record<string, any> = {};

  if (typeof page === "number") queryParams.page = page;
  if (typeof size === "number") queryParams.size = size;
  if (params?.name) queryParams.name = params.name;
  if (params?.lineUpId) queryParams.lineUpId = params.lineUpId;
  if (params?.seriesId) queryParams.seriesId = params.seriesId;
  if (params?.groupId) queryParams.groupId = params.groupId;
  if (params?.distributionId) queryParams.distributionId = params.distributionId;
  if (params?.anniversaryId) queryParams.anniversaryId = params.anniversaryId;
  if (params?.releaseStatus) queryParams.releaseStatus = params.releaseStatus;
  if (params?.metalBody !== undefined) queryParams.metalBody = params.metalBody;
  if (params?.oce !== undefined) queryParams.oce = params.oce;
  if (params?.revival !== undefined) queryParams.revival = params.revival;
  if (params?.plainCloth !== undefined) queryParams.plainCloth = params.plainCloth;
  if (params?.broken !== undefined) queryParams.broken = params.broken;
  if (params?.golden !== undefined) queryParams.golden = params.golden;
  if (params?.gold !== undefined) queryParams.gold = params.gold;
  if (params?.manga !== undefined) queryParams.manga = params.manga;
  if (params?.set !== undefined) queryParams.set = params.set;
  if (params?.articulable !== undefined) queryParams.articulable = params.articulable;
  if (params?.restocks !== undefined) queryParams.restocks = params.restocks;
  if (params?.collectionId) queryParams.collectionId = params.collectionId;

  return queryParams;
};

// Figurine Events API
export const getFigurineEvents = async (figurineId: number): Promise<FigurineEvent[]> => {
  const res = await httpClient.get(`${BASE}/${figurineId}/events`);
  return res.data;
};

export const createFigurineEvent = async (figurineId: number, data: FigurineEventReq): Promise<FigurineEvent> => {
  const res = await httpClient.post(`${BASE}/${figurineId}/events`, data);
  return res.data;
};

export const updateFigurineEvent = async (figurineId: number, eventId: number, data: FigurineEventReq): Promise<FigurineEvent> => {
  const res = await httpClient.put(`${BASE}/${figurineId}/events/${eventId}`, data);
  return res.data;
};

export const deleteFigurineEvent = async (figurineId: number, eventId: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${figurineId}/events/${eventId}`);
};

// Accepts optional name param for filtering
export const getFigurines = async (
  page = 0,
  size = 12,
  params?: FigurineFilters
): Promise<PaginatedFigurines> => {
  const queryParams = buildFigurineQueryParams(page, size, params);
  const res = await httpClient.get(BASE, { params: queryParams });
  return res.data;
};

export const getSelectableFigurineIds = async (params?: FigurineFilters): Promise<number[]> => {
  const queryParams = buildFigurineQueryParams(undefined, undefined, params);
  const res = await httpClient.get<SelectableFigurineIdsResponse>(`${BASE}/selectable-ids`, {
    params: queryParams,
  });

  const data = res.data;
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.ids)) {
    return data.ids;
  }

  if (Array.isArray(data?.figurineIds)) {
    return data.figurineIds;
  }

  return [];
};

export const getFigurineById = async (id: number): Promise<Figurine> => {
  const res = await httpClient.get(`${BASE}/${id}`);
  return res.data;
};

export const getFigurineAverageRealtimePrice = async (
  figurineId: number,
  params?: FigurineStorePricingRequestParams,
): Promise<FigurineAverageRealtimePrice> => {
  const res = await httpClient.get<FigurineStorePricingResp>(
    `${FIGURINE_STORES_BASE}/figurines/${figurineId}/prices/current`,
    {
      params: toCurrencyParam(params?.currency),
      headers: {
        accept: "application/json",
      },
    },
  );

  const rawPrice = res.data?.realTimePrice;
  const rawCurrency = res.data?.currency?.trim().toUpperCase();
  const parsedCurrency = isSupportedCurrency(rawCurrency) ? rawCurrency : null;

  if (rawPrice === null || rawPrice === undefined || rawPrice === "") {
    return {
      realTimePrice: null,
      currency: parsedCurrency,
    };
  }

  const parsed = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
  return {
    realTimePrice: Number.isFinite(parsed) ? parsed : null,
    currency: parsedCurrency,
  };
};

export const getStores = async (): Promise<StoreSummary[]> => {
  const res = await httpClient.get<StoreSummary[]>("/stores", {
    headers: {
      accept: "application/json",
    },
  });

  return res.data;
};

export const getFigurineHistoricalPrices = async (
  figurineId: number,
  params?: FigurineHistoricalPricingRequestParams,
): Promise<FigurineHistoricalPricesResponse> => {
  const queryParams: Record<string, string | number> = {
    ...toCurrencyParam(params?.currency),
  };

  if (typeof params?.storeId === "number") {
    queryParams.storeId = params.storeId;
  }

  const res = await httpClient.get<FigurineHistoricalPricesResponse>(
    `${FIGURINE_STORES_BASE}/figurines/${figurineId}/prices/history`,
    {
      params: queryParams,
      headers: {
        accept: "application/json",
      },
    },
  );

  return res.data;
};

export const createFigurine = async (data: unknown): Promise<Figurine> => {
  const res = await httpClient.post(BASE, data);
  return res.data;
};

export const updateFigurine = async (id: number, data: unknown): Promise<Figurine> => {
  const res = await httpClient.put(`${BASE}/${id}`, data);
  return res.data;
};

export const deleteFigurine = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${id}`);
};

export const getFigurineImportRecords = async (): Promise<FigurineImportRecord[]> => {
  const res = await httpClient.get<FigurineImportRecord[]>(`${BASE}/imports`);
  return res.data;
};

export const loadAllFigurines = async (): Promise<number> => {
  const res = await httpClient.post(`${BASE}/load`);
  return res.status;
};
