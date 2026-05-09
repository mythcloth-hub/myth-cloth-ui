export type ReleaseStatus = "ANNOUNCED" | "RELEASED" | "RUMORED" | "PROTOTYPE" | "UNRELEASED";

export type CatalogRef = {
  id: number;
  description: string;
};

export type FigurineDistributor = {
  distributor: {
    id: number;
    name: string;
    description: string;
    countryCode: string;
    website?: string;
  };
  currency: string;
  price?: number;
  priceWithTax?: number;
  announcedAt?: string;
  preorderOpensAt?: string;
  releaseDate?: string;
  releaseDateConfirmed: boolean;
};


export type FigurineEvent = {
  id: number;
  date: string;
  dateConfirmed: boolean;
  type: FigurineEventType;
  region: FigurineEventRegion;
  description: string;
};

export type FigurineEventReq = {
  description: string;
  date: string;
  dateConfirmed: boolean;
  region: FigurineEventRegion;
  type: FigurineEventType;
  figurineId: number;
};

export type FigurineEventType =
  | "ANNOUNCEMENT"
  | "PREORDER_OPEN"
  | "PREORDER_CLOSE"
  | "RELEASE"
  | "RESTOCK"
  | "LOCAL_CONFIRMATION"
  | "LOCAL_RELEASE";

export type FigurineEventRegion = "JP" | "MX" | "ES" | "US" | "CN";

export type Figurine = {
  id: number;
  name: string;
  displayableName: string;
  tamashiiUrl?: string;
  releaseStatus: ReleaseStatus;
  anniversary?: {
    id: number;
    description: string;
    year: number;
  };
  distributors: FigurineDistributor[];
  distribution?: CatalogRef;
  lineUp: CatalogRef;
  series: CatalogRef;
  group?: CatalogRef;
  isMetalBody: boolean;
  isOriginalColorEdition: boolean;
  isRevival: boolean;
  isPlainCloth: boolean;
  isBattleDamaged: boolean;
  isGoldenArmor: boolean;
  isGold24kEdition: boolean;
  isMangaVersion: boolean;
  isMultiPack: boolean;
  isArticulable: boolean;
  notes?: string;
  officialImageUrls: string[];
  events?: FigurineEvent[];
  createdAt: string;
  updatedAt: string;
};

export type PaginatedFigurines = {
  content: Figurine[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
