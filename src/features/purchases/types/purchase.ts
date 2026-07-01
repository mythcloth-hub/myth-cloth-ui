export type PurchaseType = "PREORDER" | "RETAIL" | "SECOND_HAND" | "GIFT";
export type ShippingStatus = "ORDERED" | "SHIPPED" | "READY_TO_PICKUP" | "DELIVERED";

export type PurchaseLineDraft = {
  figurineId: string;
  quantity: string;
  pricePaid: string;
  purchaseType: PurchaseType;
};

export type PurchaseDraft = {
  orderDate: string;
  store: string;
  orderNumber: string;
  currency: string;
  totalAmount: string;
  shippingStatus: ShippingStatus;
  trackingNumber: string;
  carrier: string;
  lines: PurchaseLineDraft[];
};

export type PurchaseRecordLine = {
  figurineId: number;
  figurineName: string;
  quantity: number;
  pricePaid: number;
  purchaseType: PurchaseType;
};

export type PurchaseRecord = {
  id: string;
  purchaseId?: number;
  orderDate: string;
  store: string;
  orderNumber: string;
  currency: string;
  totalAmount: number;
  totalFigurines: number;
  shippingStatus: ShippingStatus;
  trackingNumber?: string;
  carrier?: string;
  shippedDate?: string;
  deliveredDate?: string;
  lines: PurchaseRecordLine[];
};

export type PurchaseRecordInput = Omit<PurchaseRecord, "id">;

export const PURCHASE_CURRENCIES = ["JPY", "USD", "EUR", "MXN", "CAD", "CNY"];

export const emptyPurchaseLine = (): PurchaseLineDraft => ({
  figurineId: "",
  quantity: "1",
  pricePaid: "",
  purchaseType: "RETAIL",
});

export const emptyPurchaseDraft = (): PurchaseDraft => ({
  orderDate: "",
  store: "",
  orderNumber: "",
  currency: "JPY",
  totalAmount: "",
  shippingStatus: "ORDERED",
  trackingNumber: "",
  carrier: "",
  lines: [emptyPurchaseLine()],
});

export const createPurchaseRecordId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};
