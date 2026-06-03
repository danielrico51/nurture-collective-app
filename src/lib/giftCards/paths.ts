export const buildGiftCardOrderKey = (orderId: string): string =>
  `gift-cards/orders/order_id=${orderId}/order.json`;

export const buildGiftCardOrderListPrefix = (): string => "gift-cards/orders/";

export const parseGiftCardOrderIdFromKey = (key: string): string | null => {
  const match = key.match(/gift-cards\/orders\/order_id=([^/]+)\/order\.json$/);
  return match?.[1] ?? null;
};
