import httpClient from "../../../api/httpClient";
import type {
  AssignFigurinesRequest,
  Collection,
  CollectionFigurine,
  CollectionFigurinesPageInfo,
  CollectionSummaryResponse,
  CreateCollectionRequest,
  LatestFavoriteCollectionFigurine,
  PaginatedCollectionFigurinesResponse,
  UpdateCollectionRequest,
} from "../types/collection";

const API_BASE = "/collections";

type CollectionFigurineApiResponse = Partial<CollectionFigurine> & {
  imageUrl?: string | null;
  year?: number | string | null;
};

type PaginatedCollectionFigurinesApiResponse = {
  content?: CollectionFigurineApiResponse[];
  page?: Partial<CollectionFigurinesPageInfo>;
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

type CollectionSummaryApiResponse = Partial<CollectionSummaryResponse> & {
  summary?: Partial<CollectionSummaryResponse["summary"]>;
  collection?: Partial<CollectionSummaryResponse["collection"]>;
};

type JsonObject = Record<string, unknown>;

const toSafeNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toObject = (value: unknown): JsonObject | null =>
  typeof value === "object" && value !== null ? (value as JsonObject) : null;

const pickNumber = (source: JsonObject | null, keys: string[]): number => {
  if (!source) return 0;

  for (const key of keys) {
    if (key in source) {
      const next = toSafeNumber(source[key]);
      if (next > 0 || source[key] === 0 || source[key] === "0") {
        return next;
      }
    }
  }

  return 0;
};

const extractSummaryPayload = (raw: unknown): CollectionSummaryApiResponse | undefined => {
  const direct = toObject(raw);
  if (!direct) return undefined;

  if (toObject(direct.summary) || toObject(direct.collection)) {
    return direct as CollectionSummaryApiResponse;
  }

  const dataLevel = toObject(direct.data);
  if (dataLevel && (toObject(dataLevel.summary) || toObject(dataLevel.collection))) {
    return dataLevel as CollectionSummaryApiResponse;
  }

  const nestedDataLevel = toObject(dataLevel?.data);
  if (nestedDataLevel && (toObject(nestedDataLevel.summary) || toObject(nestedDataLevel.collection))) {
    return nestedDataLevel as CollectionSummaryApiResponse;
  }

  const payloadLevel = toObject(direct.payload);
  if (payloadLevel && (toObject(payloadLevel.summary) || toObject(payloadLevel.collection))) {
    return payloadLevel as CollectionSummaryApiResponse;
  }

  const resultLevel = toObject(direct.result);
  if (resultLevel && (toObject(resultLevel.summary) || toObject(resultLevel.collection))) {
    return resultLevel as CollectionSummaryApiResponse;
  }

  return direct as CollectionSummaryApiResponse;
};

function normalizeCollection(collection: Partial<Collection>): Collection {
  return {
    id: collection.id ?? 0,
    name: collection.name ?? "",
    imageUrl: typeof collection.imageUrl === "string" ? collection.imageUrl : undefined,
    description: collection.description,
    figurineIds: Array.isArray(collection.figurineIds) ? collection.figurineIds : [],
    totalFigurines:
      typeof collection.totalFigurines === "number"
        ? collection.totalFigurines
        : Array.isArray(collection.figurineIds)
          ? collection.figurineIds.length
          : 0,
    isPublic: collection.isPublic,
    isFavorite: collection.isFavorite ?? false,
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

function normalizeCollectionFigurinesPageInfo(
  page: Partial<CollectionFigurinesPageInfo> | undefined,
  fallbackSize: number,
  fallbackNumber: number,
  fallbackElements: number
): CollectionFigurinesPageInfo {
  return {
    size: Math.max(1, toSafeNumber(page?.size) || fallbackSize),
    number: Math.max(0, toSafeNumber(page?.number) || fallbackNumber),
    totalElements: Math.max(0, toSafeNumber(page?.totalElements) || fallbackElements),
    totalPages: Math.max(1, toSafeNumber(page?.totalPages) || 1),
  };
}

function normalizePaginatedCollectionFigurinesResponse(
  response: unknown,
  page?: number,
  size?: number
): PaginatedCollectionFigurinesResponse {
  if (Array.isArray(response)) {
    const content = response.map(normalizeCollectionFigurine);
    const fallbackSize = size ?? (content.length || 1);
    return {
      content,
      page: normalizeCollectionFigurinesPageInfo(undefined, fallbackSize, page ?? 0, content.length),
    };
  }

  const candidate = toObject(response) as PaginatedCollectionFigurinesApiResponse | null;
  const content = Array.isArray(candidate?.content)
    ? candidate.content.map(normalizeCollectionFigurine)
    : [];
  const fallbackSize = size ?? (content.length || 1);

  return {
    content,
    page: normalizeCollectionFigurinesPageInfo(candidate?.page, fallbackSize, page ?? 0, content.length),
  };
}

function normalizeCollectionSummary(
  response: unknown
): CollectionSummaryResponse {
  const summary = extractSummaryPayload(response);
  const summarySection = toObject(summary?.summary);
  const collectionSection = toObject(summary?.collection);

  return {
    summary: {
      totalFigurines: pickNumber(summarySection, ["totalFigurines", "total_figurines"]),
      totalUpcoming: pickNumber(summarySection, ["totalUpcoming", "total_upcoming"]),
      totalReleased: pickNumber(summarySection, ["totalReleased", "total_released"]),
    },
    collection: {
      preorderedCopies: pickNumber(collectionSection, ["preorderedCopies", "preordered_copies"]),
      ownedCopies: pickNumber(collectionSection, ["ownedCopies", "owned_copies"]),
      preorderedFigurines: pickNumber(collectionSection, ["preorderedFigurines", "preordered_figurines"]),
      ownedFigurines: pickNumber(collectionSection, ["ownedFigurines", "owned_figurines"]),
      missingReleasedFigurines: pickNumber(collectionSection, [
        "missingReleasedFigurines",
        "missing_released_figurines",
      ]),
    },
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
  const response = await httpClient.get<CollectionFigurineApiResponse[] | PaginatedCollectionFigurinesApiResponse>(
    `${API_BASE}/${collectionId}/figurines`
  );
  const normalized = normalizePaginatedCollectionFigurinesResponse(response.data);
  return normalized.content;
}

export async function getCollectionFigurinesPaginated(
  collectionId: number,
  params?: { page?: number; size?: number; includeRestocks?: boolean }
): Promise<PaginatedCollectionFigurinesResponse> {
  const queryParams = {
    ...(typeof params?.page === "number" ? { page: params.page } : {}),
    ...(typeof params?.size === "number" ? { size: params.size } : {}),
    ...(typeof params?.includeRestocks === "boolean" ? { includeRestocks: params.includeRestocks } : {}),
  };

  const response = await httpClient.get<CollectionFigurineApiResponse[] | PaginatedCollectionFigurinesApiResponse>(
    `${API_BASE}/${collectionId}/figurines`,
    {
      params: queryParams,
    }
  );

  return normalizePaginatedCollectionFigurinesResponse(response.data, params?.page, params?.size);
}

export async function getCollectionSummary(
  collectionId: number,
  params?: { includeRestocks?: boolean }
): Promise<CollectionSummaryResponse> {
  const response = await httpClient.get<CollectionSummaryApiResponse>(`${API_BASE}/${collectionId}/summary`, {
    params: {
      ...(typeof params?.includeRestocks === "boolean" ? { includeRestocks: params.includeRestocks } : {}),
    },
  });
  return normalizeCollectionSummary(response.data);
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

export async function duplicateCollection(id: number): Promise<void> {
  await httpClient.post(`${API_BASE}/${id}/duplicate`);
}

export async function setCollectionFavorite(id: number): Promise<void> {
  await httpClient.patch(`${API_BASE}/${id}/favorite`);
}

export async function getLatestFavoriteCollectionFigurines(): Promise<LatestFavoriteCollectionFigurine[]> {
  const response = await httpClient.get<LatestFavoriteCollectionFigurine[]>(`${API_BASE}/favorite/figurines/latest`);
  return response.data;
}

// Backend endpoint is still pending; the path is the expected contract.
export async function addFigurineToFavoriteCollection(figurineId: number): Promise<void> {
  await httpClient.post(`${API_BASE}/favorite/figurines/${figurineId}`);
}

export async function deleteCollection(id: number): Promise<void> {
  await httpClient.delete(`${API_BASE}/${id}`);
}

export async function addFigurineToCollection(collectionId: number, figurineId: number): Promise<void> {
  await httpClient.post(`${API_BASE}/${collectionId}/figurines/${figurineId}`);
}

export async function removeFigurineFromCollection(collectionId: number, figurineId: number): Promise<void> {
  await httpClient.delete(`${API_BASE}/${collectionId}/figurines/${figurineId}`);
}

export async function assignFigurinesToCollections(data: AssignFigurinesRequest): Promise<void> {
  await httpClient.post(`${API_BASE}/assign-figurines`, data);
}
