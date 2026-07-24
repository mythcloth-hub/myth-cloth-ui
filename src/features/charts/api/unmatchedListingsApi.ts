import httpClient from "../../../api/httpClient";

export type UnmatchedStoreListing = {
  id: number;
  storeId: number;
  storeWebsite: string;
  originalName: string;
  imageUrl?: string | null;
  productUrl: string;
};

const BASE = "/figurine-stores/unmatched-listings";

export const getUnmatchedStoreListings = async (): Promise<UnmatchedStoreListing[]> => {
  const response = await httpClient.get(BASE, {
    headers: {
      accept: "application/json",
    },
  });

  return response.data;
};

export const matchUnmatchedStoreListing = async (
  listingId: number,
  figurineId: number,
): Promise<void> => {
  await httpClient.post(
    `${BASE}/${listingId}/figurines/${figurineId}/match`,
    undefined,
    {
      headers: {
        accept: "application/json",
      },
    },
  );
};
