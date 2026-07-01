import httpClient from "../../../api/httpClient";
import type { PurchaseRecord, PurchaseRecordInput } from "../types/purchase";

export type PurchaseSummaryLineItemsRequest = {
  orderDate: string;
  store: string;
  orderNumber: string | null;
  currency: string;
  totalAmount: number;
  totalFigurines: number;
  shippingStatus: string;
  trackingNumber: string | null;
  carrier: string | null;
  shippedDate: string | null;
  deliveredDate: string | null;
  lineItems: Array<{
    figurineId: number;
    quantity: number;
    pricePaid: number;
    purchaseType: string;
  }>;
};

export type PurchaseSummaryLineItemsResponse = {
  purchaseId: number;
  orderDate: string;
  store: string;
  orderNumber: string | null;
  currency: string;
  totalAmount: number;
  totalFigurines: number;
  shippingStatus: string;
  trackingNumber: string | null;
  carrier: string | null;
  shippedDate?: string | null;
  deliveredDate?: string | null;
  lineItems: Array<{
    lineItemId: number;
    figurineId: number;
    quantity: number;
    pricePaid: number;
    purchaseType: string;
  }>;
};

type FigurineNameById = Record<number, string>;

const API_BASE = "/purchases";

const toFigurineNameById = (figurineNameById?: FigurineNameById): FigurineNameById =>
  figurineNameById ?? {};

function toSummaryLineItemsRequest(input: PurchaseRecordInput): PurchaseSummaryLineItemsRequest {
  return {
    orderDate: input.orderDate,
    store: input.store,
    orderNumber: input.orderNumber.length > 0 ? input.orderNumber : null,
    currency: input.currency,
    totalAmount: input.totalAmount,
    totalFigurines: input.totalFigurines,
    shippingStatus: input.shippingStatus,
    trackingNumber: input.trackingNumber?.trim() ? input.trackingNumber.trim() : null,
    carrier: input.carrier?.trim() ? input.carrier.trim() : null,
    shippedDate: null,
    deliveredDate: null,
    lineItems: input.lines.map((line) => ({
      figurineId: line.figurineId,
      quantity: line.quantity,
      pricePaid: line.pricePaid,
      purchaseType: line.purchaseType,
    })),
  };
}

export function toPurchaseRecordFromSummaryResponse(
  response: PurchaseSummaryLineItemsResponse,
  figurineNameById?: FigurineNameById
): PurchaseRecord {
  const names = toFigurineNameById(figurineNameById);

  return {
    id: String(response.purchaseId),
    purchaseId: response.purchaseId,
    orderDate: response.orderDate,
    store: response.store,
    orderNumber: response.orderNumber ?? "",
    currency: response.currency,
    totalAmount: response.totalAmount,
    totalFigurines: response.totalFigurines,
    shippingStatus: response.shippingStatus as PurchaseRecord["shippingStatus"],
    trackingNumber: response.trackingNumber ?? undefined,
    carrier: response.carrier ?? undefined,
    lines: response.lineItems.map((lineItem) => ({
      figurineId: lineItem.figurineId,
      figurineName: names[lineItem.figurineId] ?? `Figurine ${lineItem.figurineId}`,
      quantity: lineItem.quantity,
      pricePaid: lineItem.pricePaid,
      purchaseType: lineItem.purchaseType as PurchaseRecord["lines"][number]["purchaseType"],
    })),
  };
}

export async function getPurchaseSummaryLineItems(): Promise<PurchaseSummaryLineItemsResponse[]> {
  const response = await httpClient.get<PurchaseSummaryLineItemsResponse[]>(API_BASE);
  return response.data;
}

export async function getPurchaseSummaryLineItemsById(
  purchaseId: number
): Promise<PurchaseSummaryLineItemsResponse> {
  const response = await httpClient.get<PurchaseSummaryLineItemsResponse>(`${API_BASE}/${purchaseId}`);
  return response.data;
}

export async function createPurchaseSummaryLineItems(
  input: PurchaseRecordInput
): Promise<PurchaseSummaryLineItemsResponse> {
  const payload = toSummaryLineItemsRequest(input);
  const response = await httpClient.post<PurchaseSummaryLineItemsResponse>(
    `${API_BASE}/summary-line-items`,
    payload
  );
  return response.data;
}

export async function updatePurchaseSummaryLineItems(
  purchaseId: number,
  input: PurchaseRecordInput
): Promise<PurchaseSummaryLineItemsResponse> {
  const payload = toSummaryLineItemsRequest(input);
  const response = await httpClient.put<PurchaseSummaryLineItemsResponse>(
    `${API_BASE}/summary-line-items/${purchaseId}`,
    payload
  );
  return response.data;
}
