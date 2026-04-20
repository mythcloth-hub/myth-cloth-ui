import httpClient from "../../../api/httpClient";
import type { Figurine, PaginatedFigurines } from "../types/figurine";

const BASE = "/figurines";

// Accepts optional name param for filtering
export const getFigurines = async (page = 0, size = 12, params?: { name?: string }): Promise<PaginatedFigurines> => {
  const queryParams: Record<string, any> = { page, size };
  if (params?.name) queryParams.name = params.name;
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
