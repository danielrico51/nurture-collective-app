import type { GiftCardDesignId } from "@/content/giftCards";

export type GiftCardDeliveryTiming = "immediate" | "scheduled";

export type GiftCardOrderStatus =
  | "pending_payment"
  | "paid"
  | "delivered"
  | "cancelled";

export type QuickBooksSyncStatus = "pending" | "synced" | "failed";

export interface GiftCardOrderQuickBooksRef {
  customerId?: string;
  salesReceiptId?: string;
  salesReceiptNumber?: string;
  syncStatus: QuickBooksSyncStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface GiftCardOrder {
  id: string;
  status: GiftCardOrderStatus;
  amountCents: number;
  currency: "USD";
  designId: GiftCardDesignId;
  deliveryTiming: GiftCardDeliveryTiming;
  deliverOn?: string;
  purchaser: {
    name: string;
    email: string;
    phone?: string;
  };
  recipient: {
    name: string;
    email: string;
  };
  message?: string;
  sendCopyToPurchaser: boolean;
  /** Cognito sub when checkout started while signed in */
  purchaserUserId?: string;
  createdAt: string;
  updatedAt?: string;
  paymentProvider?: string;
  paymentReference?: string;
  paidAt?: string;
  quickbooks?: GiftCardOrderQuickBooksRef;
}

export interface GiftCardCheckoutRequest {
  amountCents: number;
  designId: GiftCardDesignId;
  deliveryTiming: GiftCardDeliveryTiming;
  deliverOn?: string;
  purchaser: {
    name: string;
    email: string;
    phone?: string;
  };
  recipient: {
    name: string;
    email: string;
  };
  message?: string;
  sendCopyToPurchaser?: boolean;
  successUrl: string;
  cancelUrl: string;
}

export interface GiftCardCheckoutResponse {
  ok: true;
  orderId: string;
  status: GiftCardOrderStatus;
  provider: string;
  checkoutUrl?: string;
  clientSecret?: string;
  message?: string;
}
