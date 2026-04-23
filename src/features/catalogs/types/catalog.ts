export type Catalog = {
  id: number;
  description: string;
};

export type CatalogType = "distributions" | "groups" | "lineups" | "series";

export const CATALOG_META: Record<CatalogType, { plural: string; singular: string }> = {
  distributions: { plural: "Distributions", singular: "Distribution" },
  groups:        { plural: "Groups",        singular: "Group"        },
  lineups:       { plural: "Lineups",       singular: "Lineup"       },
  series:        { plural: "Series",        singular: "Series"       },
};
