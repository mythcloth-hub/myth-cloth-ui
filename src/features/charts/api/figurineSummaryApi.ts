import axios from "axios";

export type FigurineSummary = {
  id: number;
  displayableName: string;
  lineUp: {
    id: number;
    description: string;
  };
  officialImageUrl?: string | null;
};

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const apiBaseUrl = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/+$/, "")
  : "http://localhost:9090/api/v1";

export const getFigurineSummary = async (): Promise<FigurineSummary[]> => {
  const response = await axios.get<FigurineSummary[]>(`${apiBaseUrl}/figurines/summary`, {
    headers: {
      accept: "application/json",
    },
  });

  return response.data;
};
