import { describe, expect, it } from "vitest";
import { nestingPlaceContactEmail } from "@/config/integrations";
import { createSampleGiftCardOrder } from "@/lib/giftCards/sampleOrder";
import {
  buildGiftCardPurchaserCopyEmail,
  buildGiftCardRecipientEmail,
  buildGiftCardRecipientHtml,
} from "@/lib/giftCards/emailContent";

const CONTACT = "info@nesting-place.com";

describe("gift card email content contact address", () => {
  it("uses the Nesting Place inbox constant", () => {
    expect(nestingPlaceContactEmail).toBe(CONTACT);
  });

  it("includes contact email in recipient plain-text body", () => {
    const order = createSampleGiftCardOrder();
    const { text } = buildGiftCardRecipientEmail(order);

    expect(text).toContain(CONTACT);
    expect(text).not.toContain("hello@nurturecollective.com");
    expect(text).not.toMatch(/@gmail\.com/);
  });

  it("includes contact email in recipient HTML body", () => {
    const order = createSampleGiftCardOrder();
    const { html } = buildGiftCardRecipientEmail(order);

    expect(html).toContain(`mailto:${CONTACT}`);
    expect(html).toContain(CONTACT);
    expect(html).not.toContain("hello@nurturecollective.com");
  });

  it("includes contact email in purchaser copy email", () => {
    const order = createSampleGiftCardOrder();
    const { text, html } = buildGiftCardPurchaserCopyEmail(order);

    expect(text).toContain(CONTACT);
    expect(html).toContain(`mailto:${CONTACT}`);
    expect(html).toContain(CONTACT);
  });

  it("includes contact email in standalone recipient HTML template", () => {
    const html = buildGiftCardRecipientHtml({
      recipientName: "Jordan",
      fromName: "Alex",
      amount: "$50.00",
      personalMessage: "Enjoy!",
      orderId: "order-123",
      paidAt: "2026-05-24T12:00:00.000Z",
      designLabel: "Sage",
      designId: "sage",
    });

    expect(html).toContain(`mailto:${CONTACT}`);
    expect(html).toContain(CONTACT);
  });
});
