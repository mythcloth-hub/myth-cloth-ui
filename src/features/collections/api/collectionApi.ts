import httpClient from "../../../api/httpClient";
import type {
  AssignFigurinesRequest,
  Collection,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from "../types/collection";

const API_BASE = "/collections";

function normalizeCollection(collection: Partial<Collection>): Collection {
  return {
    id: collection.id ?? 0,
    name: collection.name ?? "",
    description: collection.description,
    figurineIds: Array.isArray(collection.figurineIds) ? collection.figurineIds : [],
    totalFigurines:
      typeof collection.totalFigurines === "number"
        ? collection.totalFigurines
        : Array.isArray(collection.figurineIds)
          ? collection.figurineIds.length
          : 0,
    isPublic: collection.isPublic,
    createdAt: collection.createdAt ?? "",
    updatedAt: collection.updatedAt ?? "",
  };
}

export async function getCollections(): Promise<Collection[]> {
  const response = await httpClient.get<Collection[]>(API_BASE);
  return response.data.map(normalizeCollection);
}

export async function getCollectionById(id: number): Promise<Collection> {
  const response = await httpClient.get<Collection>(`${API_BASE}/${id}`);
  return normalizeCollection(response.data);
}

export async function createCollection(data: CreateCollectionRequest): Promise<Collection> {
  const response = await httpClient.post<Collection>(API_BASE, data);
  return normalizeCollection(response.data);
}

export async function updateCollection(id: number, data: UpdateCollectionRequest): Promise<Collection> {
  const response = await httpClient.put<Collection>(`${API_BASE}/${id}`, data);
  return normalizeCollection(response.data);
}

export async function deleteCollection(id: number): Promise<void> {
  await httpClient.delete(`${API_BASE}/${id}`);
}

export async function addFigurineToCollection(collectionId: number, figurineId: number): Promise<Collection> {
  const response = await httpClient.post<Collection>(
    `${API_BASE}/${collectionId}/figurines`,
    { figurineId }
  );
  return normalizeCollection(response.data);
}

export async function removeFigurineFromCollection(collectionId: number, figurineId: number): Promise<Collection> {
  const response = await httpClient.delete<Collection>(
    `${API_BASE}/${collectionId}/figurines/${figurineId}`
  );
  return normalizeCollection(response.data);
}

export async function assignFigurinesToCollections(data: AssignFigurinesRequest): Promise<void> {
  await httpClient.post(`${API_BASE}/assign-figurines`, data);
}
