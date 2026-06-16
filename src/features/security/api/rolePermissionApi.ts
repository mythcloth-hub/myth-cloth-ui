import httpClient from "../../../api/httpClient";
import type { Permission } from "../types/permission";

const BASE = "/roles";

type RawPermission = {
  id: number;
  description: string;
};

const toPermission = (raw: RawPermission): Permission => ({
  id: raw.id,
  description: raw.description,
});

export const getPermissionsByRoleId = async (roleId: number): Promise<Permission[]> => {
  const res = await httpClient.get(`${BASE}/${roleId}/permissions`);
  return (res.data as RawPermission[]).map(toPermission);
};

export const addPermissionToRole = async (roleId: number, permissionId: number): Promise<void> => {
  await httpClient.post(`${BASE}/${roleId}/permissions`, {
    permissionId: String(permissionId),
  });
};

export const syncRolePermissions = async (roleId: number, permissionIds: number[]): Promise<void> => {
  await httpClient.put(`${BASE}/${roleId}/permissions`, {
    permissionIds,
  });
};