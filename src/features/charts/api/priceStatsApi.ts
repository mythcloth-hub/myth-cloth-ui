import httpClient from "../../../api/httpClient";
import { toCurrencyParam, type SupportedCurrency } from "../../../currency/currency";

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

type PriceStatsRequestParams = {
  currency?: SupportedCurrency;
};

export const getReleaseYearPriceStats = async (
  params?: PriceStatsRequestParams,
): Promise<ReleaseYearPriceStats[]> => {
  const res = await httpClient.get(`${BASE}/years`, {
    params: toCurrencyParam(params?.currency),
    headers: {
      accept: "application/json",
    },
  });

  return res.data;
};
