import httpClient from "../../../api/httpClient";
import type { Distributor } from "../types/distributor";

const BASE = "/distributors";

export const getAllDistributors = async (): Promise<Distributor[]> => {
  const res = await httpClient.get(BASE);
  return res.data;
};

export const getDistributorById = async (id: number): Promise<Distributor> => {
  const res = await httpClient.get(`${BASE}/${id}`);
  return res.data;
};

export const createDistributor = async (data: Distributor): Promise<Distributor> => {
  const res = await httpClient.post(BASE, data);
  return res.data;
};

export const updateDistributor = async (id: number, data: Distributor): Promise<Distributor> => {
  const res = await httpClient.put(`${BASE}/${id}`, data);
  return res.data;
};

export const deleteDistributor = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${id}`);
};