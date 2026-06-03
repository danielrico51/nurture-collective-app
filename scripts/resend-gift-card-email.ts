/**
 * Resend SES gift card emails for a paid order (e.g. after fixing IAM).
 *
 *   ORDER_ID=<uuid> npm run resend:gift-card-email
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { notifyGiftCardFulfillment } from "../src/lib/giftCards/notify";
import { readGiftCardOrder } from "../src/lib/giftCards/storage";

const loadEnvFile = (filename: string) => {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
};

loadEnvFile(".env.local");
loadEnvFile(".env");

const main = async () => {
  const orderId = process.env.ORDER_ID?.trim();
  if (!orderId) {
    console.error("Set ORDER_ID to the gift card order uuid.");
    process.exit(1);
  }

  const order = await readGiftCardOrder(orderId);
  if (!order) {
    console.error(`Order not found: ${orderId}`);
    process.exit(1);
  }
  if (order.status !== "paid") {
    console.error(`Order status is ${order.status}, not paid.`);
    process.exit(1);
  }

  const updated = await notifyGiftCardFulfillment({
    ...order,
    emailDelivery: undefined,
  });
  console.log("Resent. emailDelivery:", updated.emailDelivery);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
