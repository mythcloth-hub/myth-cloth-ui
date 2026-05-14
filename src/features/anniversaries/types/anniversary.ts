export type AnniversaryType =
  | "TAMASHII_NATIONS_WORLD_TOUR"
  | "SAINT_CLOTH_MYTH"
  | "SAINT_SEIYA";

export type Anniversary = {
  id: number;
  description: string;
  year: number;
  type?: AnniversaryType;
};
