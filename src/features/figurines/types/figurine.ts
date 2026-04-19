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
  preorderOpensAt?: string;
  releaseDate?: string;
  releaseDateConfirmed: boolean;
};

export type FigurineEvent = {
  id: number;
  date: string;
  dateConfirmed: boolean;
  type: string;
  region: string;
  description: string;
};

export type Figurine = {
  id: number;
  name: string;
  displayableName: string;
  tamashiiUrl?: string;
  releaseStatus: ReleaseStatus;
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
