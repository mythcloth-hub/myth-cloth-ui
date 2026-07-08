import httpClient from "../../../api/httpClient";
import type {
  Figurine,
  FigurineEvent,
  FigurineEventReq,
  PaginatedFigurines,
  FigurineFilters,
  SelectableFigurineIdsResponse,
} from "../types/figurine";

const BASE = "/figurines";

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

export const loadAllFigurines = async (): Promise<number> => {
  const res = await httpClient.post(`${BASE}/load`);
  return res.status;
};
