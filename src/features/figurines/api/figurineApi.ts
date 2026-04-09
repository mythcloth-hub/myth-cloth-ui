import httpClient from "../../../api/httpClient";
import type { Figurine, PaginatedFigurines } from "../types/figurine";

const BASE = "/figurines";

export const getFigurines = async (page = 0, size = 12): Promise<PaginatedFigurines> => {
  const res = await httpClient.get(BASE, { params: { page, size } });
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
