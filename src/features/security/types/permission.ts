export type Permission = {
  id: number;
  description: string;
};

export type PermissionUpsertInput = {
  description: string;
};