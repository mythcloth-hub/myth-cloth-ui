import httpClient from "../../../api/httpClient";
import type { Catalog, CatalogType } from "../types/catalog";

const BASE = "/catalogs";

// URL conventions (Spring Boot CatalogController):
//   GET    /catalogs/{type}        – list all
//   POST   /catalogs/{type}        – create       body: { description }
//   GET    /catalogs/{type}/{id}   – get by id
//   PUT    /catalogs/{type}/{id}   – update       body: { description }
//   DELETE /catalogs/{type}/{id}   – delete

const createCatalogApi = (type: CatalogType) => ({
  getAll: async (): Promise<Catalog[]> => {
    const res = await httpClient.get(`${BASE}/${type}`);
    return res.data;
  },

  getById: async (id: number): Promise<Catalog> => {
    const res = await httpClient.get(`${BASE}/${type}/${id}`);
    return res.data;
  },

  create: async (description: string): Promise<Catalog> => {
    const res = await httpClient.post(`${BASE}/${type}`, { description });
    return res.data;
  },

  update: async (id: number, description: string): Promise<Catalog> => {
    const res = await httpClient.put(`${BASE}/${type}/${id}`, { description });
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    await httpClient.delete(`${BASE}/${type}/${id}`);
  },
});

export const distributionsApi = createCatalogApi("distributions");
export const groupsApi        = createCatalogApi("groups");
export const lineupsApi       = createCatalogApi("lineups");
export const seriesApi        = createCatalogApi("series");

export const catalogApiMap = {
  distributions: distributionsApi,
  groups:        groupsApi,
  lineups:       lineupsApi,
  series:        seriesApi,
};
