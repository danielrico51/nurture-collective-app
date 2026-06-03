export const buildGiftCardOrderKey = (orderId: string): string =>
  `gift-cards/orders/order_id=${orderId}/order.json`;
