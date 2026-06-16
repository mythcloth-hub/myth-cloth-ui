import httpClient from "../../../api/httpClient";
import type { Role, RoleUpsertInput } from "../types/role";

const BASE = "/roles";

type RawRole = {
  id: number;
  description: string;
};

const toRole = (raw: RawRole): Role => ({
  id: raw.id,
  description: raw.description,
});

const toPayload = (input: RoleUpsertInput) => ({
  description: input.description.trim(),
});

export const getAllRoles = async (): Promise<Role[]> => {
  const res = await httpClient.get(BASE);
  return (res.data as RawRole[]).map(toRole);
};

export const getRoleById = async (id: number): Promise<Role> => {
  const res = await httpClient.get(`${BASE}/${id}`);
  return toRole(res.data as RawRole);
};

export const createRole = async (input: RoleUpsertInput): Promise<Role> => {
  const res = await httpClient.post(BASE, toPayload(input));
  return toRole(res.data as RawRole);
};

export const updateRole = async (id: number, input: RoleUpsertInput): Promise<Role> => {
  const res = await httpClient.put(`${BASE}/${id}`, toPayload(input));
  return toRole(res.data as RawRole);
};

export const deleteRole = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${id}`);
};