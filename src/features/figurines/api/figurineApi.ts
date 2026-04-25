import httpClient from "../../../api/httpClient";
import type { Figurine, PaginatedFigurines } from "../types/figurine";

const BASE = "/figurines";

// Accepts optional name param for filtering
export const getFigurines = async (
  page = 0,
  size = 12,
  params?: { name?: string; lineUpId?: string; seriesId?: string; groupId?: string; releaseStatus?: string; metalBody?: boolean; oce?: boolean; revival?: boolean; plainCloth?: boolean; broken?: boolean; golden?: boolean; gold?: boolean; manga?: boolean; set?: boolean; articulable?: boolean }
): Promise<PaginatedFigurines> => {
  const queryParams: Record<string, any> = { page, size };
  if (params?.name) queryParams.name = params.name;
  if (params?.lineUpId) queryParams.lineUpId = params.lineUpId;
  if (params?.seriesId) queryParams.seriesId = params.seriesId;
  if (params?.groupId) queryParams.groupId = params.groupId;
  if (params?.releaseStatus) queryParams.releaseStatus = params.releaseStatus;
  if (params?.metalBody) queryParams.metalBody = params.metalBody;
  if (params?.oce) queryParams.oce = params.oce;
  if (params?.revival) queryParams.revival = params.revival;
  if (params?.plainCloth) queryParams.plainCloth = params.plainCloth;
  if (params?.broken) queryParams.broken = params.broken;
  if (params?.golden) queryParams.golden = params.golden;
  if (params?.gold) queryParams.gold = params.gold;
  if (params?.manga) queryParams.manga = params.manga;
  if (params?.set) queryParams.set = params.set;
  if (params?.articulable) queryParams.articulable = params.articulable;

  const res = await httpClient.get(BASE, { params: queryParams });
  return res.data;
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
