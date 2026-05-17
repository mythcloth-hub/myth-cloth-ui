import httpClient from "../../../api/httpClient";

export type StatsResponse = {
  totalFigurines: number;
  countByLineUp: Record<string, number>;
  countBySeries: Record<string, number>;
  countByGroup: Record<string, number>;
  countByAnniversary: Record<string, number>;
  totalByReleaseStatus: Record<string, number>;
};

export const getStats = async (): Promise<StatsResponse> => {
  const res = await httpClient.get("/stats", {
    headers: {
      accept: "application/json",
    },
  });

  return res.data;
};
