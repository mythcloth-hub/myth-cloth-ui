import httpClient from "../../../api/httpClient";
import type { CreatePurchaseRequest, CreatePurchaseResponse, PurchaseRecord } from "../types/purchase";

const API_BASE = "/collectors/purchases/collections";

export async function createPurchase(
  collectionId: number,
  request: CreatePurchaseRequest,
): Promise<CreatePurchaseResponse> {
  const response = await httpClient.post<CreatePurchaseResponse>(
    `${API_BASE}/${collectionId}`,
    request,
  );

  if (response.status !== 201) {
    throw new Error(`Purchase creation returned unexpected status ${response.status}.`);
  }

  return response.data;
}

export async function getPurchases(): Promise<PurchaseRecord[]> {
  const response = await httpClient.get<PurchaseRecord[]>("/collectors/purchases");
  return response.data;
}

export async function updatePurchase(
  purchaseId: number,
  request: CreatePurchaseRequest,
): Promise<PurchaseRecord> {
  const response = await httpClient.put<PurchaseRecord>(
    `/collectors/purchases/${purchaseId}`,
    request,
  );
  return response.data;
}

export async function deletePurchase(purchaseId: number): Promise<void> {
  await httpClient.delete(`/collectors/purchases/${purchaseId}`);
}
