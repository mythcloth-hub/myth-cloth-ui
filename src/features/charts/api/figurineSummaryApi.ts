import httpClient from "../../../api/httpClient";

export type FigurineSummary = {
  id: number;
  displayableName: string;
  lineUp?: {
    id: number;
    description: string;
  } | null;
  officialImageUrl?: string | null;
};

const BASE = "/figurines/summary";

export const getFigurineSummary = async (): Promise<FigurineSummary[]> => {
  const response = await httpClient.get<FigurineSummary[]>(BASE, {
    headers: {
      accept: "application/json",
    },
  });

  return response.data;
};
