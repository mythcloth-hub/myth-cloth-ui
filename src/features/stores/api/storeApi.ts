import httpClient from "../../../api/httpClient";
import type { Store, StoreInput } from "../types/store";

const BASE = "/stores";

export const getAllStores = async (): Promise<Store[]> => {
  const response = await httpClient.get<Store[]>(BASE);
  return response.data;
};

export const getStoreById = async (id: number): Promise<Store> => {
  const response = await httpClient.get<Store>(`${BASE}/${id}`);
  return response.data;
};

export const createStore = async (input: StoreInput): Promise<Store> => {
  const response = await httpClient.post<Store>(BASE, input);
  return response.data;
};

export const updateStore = async (id: number, input: StoreInput): Promise<Store> => {
  const response = await httpClient.put<Store>(`${BASE}/${id}`, input);
  return response.data;
};

export const deleteStore = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${id}`);
};
