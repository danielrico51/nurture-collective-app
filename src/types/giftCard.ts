import type { GiftCardDesignId } from "@/content/giftCards";

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
  /** @deprecated Legacy orders only; new orders are always emailed immediately. */
  deliveryTiming?: "immediate" | "scheduled";
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
  /** Set after SES fulfillment attempt(s). */
  emailDelivery?: {
    lastAttemptAt: string;
    recipient?: boolean;
    fulfillment?: boolean;
    purchaserCopy?: boolean;
    errors?: string[];
  };
}

export interface GiftCardCheckoutRequest {
  amountCents: number;
  designId: GiftCardDesignId;
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
