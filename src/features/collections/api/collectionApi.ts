import httpClient from "../../../api/httpClient";
import type {
  AssignFigurinesRequest,
  Collection,
  CollectionFigurine,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from "../types/collection";

const API_BASE = "/collections";

type CollectionFigurineApiResponse = Partial<CollectionFigurine> & {
  imageUrl?: string | null;
  year?: number | string | null;
};

type CollectionFigurineDetailApiResponse = {
  displayableName?: string;
  distributors?: Array<{
    currency?: string;
    priceWithTax?: number;
    releaseDate?: string;
    releaseDateConfirmed?: boolean;
  }>;
  tamashiiUrl?: string;
  lineUpUrl?: string;
};

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

function normalizeCollectionFigurine(figurine: CollectionFigurineApiResponse): CollectionFigurine {
  const rawYear: unknown = figurine.year;
  const parsedYear =
    typeof rawYear === "number"
      ? rawYear
      : typeof rawYear === "string" && rawYear.trim().length > 0
        ? Number(rawYear)
        : undefined;

  const normalizedImageUrls = Array.isArray(figurine.officialImageUrls)
    ? figurine.officialImageUrls.filter((url): url is string => typeof url === "string" && url.length > 0)
    : [];

  if (normalizedImageUrls.length === 0 && typeof figurine.imageUrl === "string" && figurine.imageUrl.length > 0) {
    normalizedImageUrls.push(figurine.imageUrl);
  }

  return {
    id: figurine.id ?? 0,
    name: figurine.name ?? "",
    displayableName: figurine.displayableName ?? figurine.name ?? "",
    releaseStatus: figurine.releaseStatus ?? "ANNOUNCED",
    year: typeof parsedYear === "number" && Number.isFinite(parsedYear) ? parsedYear : undefined,
    notes: figurine.notes,
    officialImageUrls: normalizedImageUrls,
    isCollected: figurine.isCollected ?? false,
    ownedQuantity: typeof figurine.ownedQuantity === "number" ? figurine.ownedQuantity : 0,
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

export async function getCollectionFigurines(collectionId: number): Promise<CollectionFigurine[]> {
  const response = await httpClient.get<CollectionFigurineApiResponse[]>(`${API_BASE}/${collectionId}/figurines`);
  return response.data.map(normalizeCollectionFigurine);
}

export async function getCollectionFigurine(
  collectionId: number,
  figurineId: number
): Promise<CollectionFigurineDetailApiResponse> {
  const response = await httpClient.get<CollectionFigurineDetailApiResponse>(
    `${API_BASE}/${collectionId}/figurines/${figurineId}`
  );
  return response.data;
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

export async function removeFigurineFromCollection(collectionId: number, figurineId: number): Promise<void> {
  await httpClient.delete(`${API_BASE}/${collectionId}/figurines/${figurineId}`);
}

export async function assignFigurinesToCollections(data: AssignFigurinesRequest): Promise<void> {
  await httpClient.post(`${API_BASE}/assign-figurines`, data);
}
