import {
  giftCardDesigns,
  type GiftCardDesignId,
} from "@/content/giftCards";

export const getGiftCardDesign = (id: GiftCardDesignId) =>
  giftCardDesigns.find((design) => design.id === id) ?? giftCardDesigns[0];

/** Inline styles for email clients (Tailwind classes are not used in SES HTML). */
export const giftCardDesignEmailStyles: Record<
  GiftCardDesignId,
  { headerBackground: string; accentColor: string }
> = {
  sage: {
    headerBackground: "linear-gradient(135deg,#8fa99a,#6b8f7a)",
    accentColor: "#6b8f7a",
  },
  blush: {
    headerBackground: "linear-gradient(135deg,#e8c4b8,#f7f4f1)",
    accentColor: "#b89588",
  },
  classic: {
    headerBackground: "linear-gradient(135deg,#5a5a5a,#f7f4f1)",
    accentColor: "#5a5a5a",
  },
};
