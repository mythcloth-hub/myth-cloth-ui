export interface Collection {
  id: number;
  name: string;
  imageUrl?: string;
  description?: string;
  isFavorite?: boolean;
  collectedFigurines: number;
  totalFigurines: number;
  figurineIds: number[];
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  figurineIds?: number[];
}

export interface UpdateCollectionRequest {
  subCollection?: boolean;
  name: string;
  description?: string;
  imageUrl?: string;
  figurineIds?: number[];
}

export interface AddFigurineToCollectionRequest {
  figurineId: number;
}

export interface AssignFigurinesRequest {
  figurineIds: number[];
  collectionMode: "AUTO" | "CREATE" | "EXISTING";
  collectionIds?: number[];
  collection?: {
    subCollection: boolean;
    name: string;
    description?: string;
    imageUrl?: string;
  };
}

export interface CollectionFigurine {
  collectionFigurineId: number;
  figurineId: number;
  name: string;
  displayableName: string;
  releaseStatus: "ANNOUNCED" | "RELEASED" | "RUMORED" | "PROTOTYPE" | "UNRELEASED";
  year?: number;
  notes?: string;
  officialImageUrls: string[];
  isCollected: boolean;
  ownedQuantity: number;
}

export interface CollectionFigurinesPageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginatedCollectionFigurinesResponse {
  content: CollectionFigurine[];
  page: CollectionFigurinesPageInfo;
}

export interface CollectionCatalogSummary {
  totalFigurines: number;
  totalUpcoming: number;
  totalReleased: number;
}

export interface CollectionProgressSummary {
  preorderedCopies: number;
  ownedCopies: number;
  preorderedFigurines: number;
  ownedFigurines: number;
  missingReleasedFigurines: number;
}

export interface CollectionSummaryResponse {
  summary: CollectionCatalogSummary;
  collection: CollectionProgressSummary;
}

export interface LatestFavoriteCollectionFigurine {
  id: number;
  name: string;
  imageUrl?: string;
  ownedQuantity: number;
}
