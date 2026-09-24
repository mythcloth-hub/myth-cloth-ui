export type PurchaseChannel = "ONLINE" | "PHYSICAL_STORE";
export type ShippingStatus = "NOT_SHIPPED" | "SHIPPED" | "DELIVERED";
export type PurchaseType = "RETAIL" | "PREORDER" | "SECOND_HAND";

export type PurchaseFigurineInput = {
  collectionFigurineId: number;
  quantity: number;
  pricePaid: number;
  purchaseType: PurchaseType;
};

export type CreatePurchaseRequest = {
  purchaseDate: string;
  seller: string;
  orderNumber?: string;
  currency: string;
  purchaseChannel: PurchaseChannel;
  shippingStatus?: ShippingStatus;
  trackingNumber?: string;
  carrier?: string;
  figurines: PurchaseFigurineInput[];
};

export type CreatePurchaseResponse = {
  purchaseId: number;
  purchaseDate: string;
  seller: string;
  orderNumber?: string;
  currency: string;
  totalAmount: number;
  purchaseChannel: PurchaseChannel;
  shippingStatus?: ShippingStatus;
  trackingNumber?: string;
  trackingUrl?: string | null;
  carrier?: string;
  shippedDate?: string;
  figurines: Array<PurchaseFigurineInput & { id: number }>;
};

export type PurchaseRecord = {
  purchaseId: number;
  purchaseDate: string;
  seller: string;
  orderNumber?: string;
  currency: string;
  totalAmount: number;
  purchaseChannel: PurchaseChannel;
  shippingStatus?: ShippingStatus;
  trackingNumber?: string;
  trackingUrl?: string | null;
  carrier?: string;
  shippedDate?: string;
  deliveredDate?: string;
  figurines: Array<PurchaseFigurineInput & { id: number }>;
};

export type PurchaseSummary = {
  currency: string;
  totalAmount: number;
};

export type PurchasesResponse = {
  summary: PurchaseSummary;
  // Backend omits this field entirely when there are no purchases.
  purchases?: PurchaseRecord[];
};

export const PURCHASE_CURRENCIES = ["JPY", "USD", "EUR", "MXN", "CAD", "CNY"] as const;
