/**
 * List recent gift card orders (purchaser email filter).
 *   PURCHASER_EMAIL=danielrico51@gmail.com npx tsx scripts/find-gift-card-orders.ts
 */

import { listGiftCardOrdersForMember } from "../src/lib/giftCards/listOrders";

const main = async () => {
  const email = process.env.PURCHASER_EMAIL?.trim() || "danielrico51@gmail.com";
  const orders = await listGiftCardOrdersForMember({ email });
  for (const order of orders.slice(0, 10)) {
    console.log(
      order.id,
      order.status,
      `$${(order.amountCents / 100).toFixed(2)}`,
      order.recipient.email,
      order.emailDelivery ? JSON.stringify(order.emailDelivery) : "no-emailDelivery"
    );
  }
  if (orders.length === 0) console.log("No orders found for", email);
};

main().catch(console.error);
