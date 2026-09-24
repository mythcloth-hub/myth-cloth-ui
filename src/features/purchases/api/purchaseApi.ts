import httpClient from "../../../api/httpClient";
import { toCurrencyParam, type SupportedCurrency } from "../../../currency/currency";
import type { CreatePurchaseRequest, CreatePurchaseResponse, PurchaseRecord, PurchasesResponse, ShippingStatus } from "../types/purchase";

const API_BASE = "/collectors/purchases/collections";

type GetPurchasesParams = {
  currency?: SupportedCurrency;
};

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

export async function getPurchases(params?: GetPurchasesParams): Promise<PurchasesResponse> {
  const response = await httpClient.get<PurchasesResponse>("/collectors/purchases", {
    params: toCurrencyParam(params?.currency),
  });
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

export async function updatePurchaseShippingStatus(
  purchaseId: number,
  shippingStatus: ShippingStatus,
): Promise<void> {
  await httpClient.patch(`/collectors/purchases/${purchaseId}/shipping-status`, {
    shippingStatus,
  });
}
