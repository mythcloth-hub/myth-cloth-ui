import httpClient from "../../../api/httpClient";
import type { Anniversary } from "../types/anniversary";

const BASE = "/anniversaries";

export const getAllAnniversaries = async (): Promise<Anniversary[]> => {
  const res = await httpClient.get(BASE);
  return res.data;
};

export const getAnniversaryById = async (id: number): Promise<Anniversary> => {
  const res = await httpClient.get(`${BASE}/${id}`);
  return res.data;
};

export const createAnniversary = async (data: Omit<Anniversary, "id">): Promise<Anniversary> => {
  const res = await httpClient.post(BASE, data);
  return res.data;
};

export const updateAnniversary = async (id: number, data: Omit<Anniversary, "id">): Promise<Anniversary> => {
  const res = await httpClient.put(`${BASE}/${id}`, data);
  return res.data;
};

export const deleteAnniversary = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${id}`);
};
