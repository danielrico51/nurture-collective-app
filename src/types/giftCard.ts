import type { GiftCardDesignId } from "@/content/giftCards";

export type GiftCardDeliveryTiming = "immediate" | "scheduled";

export type GiftCardOrderStatus =
  | "pending_payment"
  | "paid"
  | "delivered"
  | "cancelled";

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
  createdAt: string;
  paymentProvider?: string;
  paymentReference?: string;
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
