import httpClient from "../../../api/httpClient";

export type ReleaseYearLineup = {
  line: string;
  count: number;
};

export type ReleaseYearSummary = {
  year: number;
  lineUp: ReleaseYearLineup[];
};

export type ReleaseFigurine = {
  id: number;
  name: string;
  url?: string;
};

export type ReleaseMonthLineup = {
  line: string;
  figurines: ReleaseFigurine[];
};

export type ReleaseYearMonthDetail = {
  month: number;
  name: string;
  lineUp: ReleaseMonthLineup[];
};

const BASE = "/stats/releases";

export const getReleaseYearsSummary = async (): Promise<ReleaseYearSummary[]> => {
  const res = await httpClient.get(`${BASE}/years`, {
    headers: {
      accept: "application/json",
    },
  });

  return res.data;
};

export const getReleaseYearDetail = async (year: number): Promise<ReleaseYearMonthDetail[]> => {
  const res = await httpClient.get(`${BASE}/years/${year}`, {
    headers: {
      accept: "application/json",
    },
  });

  return res.data;
};
