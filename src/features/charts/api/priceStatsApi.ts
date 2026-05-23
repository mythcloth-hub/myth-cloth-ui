import httpClient from "../../../api/httpClient";

export type PriceExtremumFigurine = {
  id: number;
  name: string;
  url?: string;
};

export type ReleaseYearPriceStats = {
  year: number;
  averageReleasePrice: number;
  highestReleasePrice: number;
  lowestReleasePrice: number;
  highestPriceFigurines?: PriceExtremumFigurine | null;
  lowestPriceFigurines?: PriceExtremumFigurine | null;
  releaseCount: number;
};

const BASE = "/stats/prices/releases";

export const getReleaseYearPriceStats = async (): Promise<ReleaseYearPriceStats[]> => {
  const res = await httpClient.get(`${BASE}/years`, {
    headers: {
      accept: "application/json",
    },
  });

  return res.data;
};
