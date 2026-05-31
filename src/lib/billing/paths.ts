export const buildBillingOrderKey = (orderId: string): string =>
  `billing/orders/order_id=${orderId}/order.json`;

export const buildBillingOrderListPrefix = (): string => "billing/orders/";

export const parseBillingOrderIdFromKey = (key: string): string | null => {
  const match = key.match(/order_id=([^/]+)\/order\.json$/);
  return match?.[1] ?? null;
};
