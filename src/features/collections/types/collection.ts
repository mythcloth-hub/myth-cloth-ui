export interface Collection {
  id: number;
  name: string;
  imageUrl?: string;
  description?: string;
  figurineIds: number[];
  totalFigurines: number;
  isPublic?: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  figurineIds?: number[];
}

export interface UpdateCollectionRequest {
  name?: string;
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
    name: string;
    description?: string;
    imageUrl?: string;
  };
}

export interface CollectionFigurine {
  id: number;
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
