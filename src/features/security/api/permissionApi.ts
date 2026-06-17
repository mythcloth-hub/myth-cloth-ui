import httpClient from "../../../api/httpClient";
import type { Permission, PermissionUpsertInput } from "../types/permission";

const BASE = "/permissions";

type RawPermission = {
  id: number;
  description: string;
};

const toPermission = (raw: RawPermission): Permission => ({
  id: raw.id,
  description: raw.description,
});

const toPayload = (input: PermissionUpsertInput) => ({
  description: input.description.trim(),
});

export const getAllPermissions = async (): Promise<Permission[]> => {
  const res = await httpClient.get(BASE);
  return (res.data as RawPermission[]).map(toPermission);
};

export const getPermissionById = async (id: number): Promise<Permission> => {
  const res = await httpClient.get(`${BASE}/${id}`);
  return toPermission(res.data as RawPermission);
};

export const createPermission = async (input: PermissionUpsertInput): Promise<Permission> => {
  const res = await httpClient.post(BASE, toPayload(input));
  return toPermission(res.data as RawPermission);
};

export const updatePermission = async (id: number, input: PermissionUpsertInput): Promise<Permission> => {
  const res = await httpClient.put(`${BASE}/${id}`, toPayload(input));
  return toPermission(res.data as RawPermission);
};

export const deletePermission = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${id}`);
};