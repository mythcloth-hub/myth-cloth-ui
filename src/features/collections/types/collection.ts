export interface Collection {
  id: number;
  name: string;
  description?: string;
  figurineIds: number[];
  totalFigurines: number;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  figurineIds?: number[];
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
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
