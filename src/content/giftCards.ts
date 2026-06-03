export const giftCardsIntro =
  "Give the gift of rest, support, and care. Our eGift cards can be used toward birth doula support, postpartum care, lactation consulting, prenatal massage, and other maternal wellness services at The Nesting Place.";

export const giftCardPresetAmounts = [5, 50, 100, 150, 200, 250, 500] as const;

export const giftCardMinAmount = 5;
export const giftCardMaxAmount = 1000;

export const giftCardDesigns = [
  { id: "sage", label: "Sage", className: "from-nurture-sage/30 to-nurture-sage/10" },
  { id: "blush", label: "Blush", className: "from-nurture-blush/40 to-nurture-cream" },
  { id: "classic", label: "Classic", className: "from-nurture-charcoal/15 to-nurture-cream" },
] as const;

export type GiftCardDesignId = (typeof giftCardDesigns)[number]["id"];

export const giftCardHowItWorks = [
  {
    step: "01",
    title: "Choose an amount",
    description: "Select a preset value or enter a custom amount.",
  },
  {
    step: "02",
    title: "Personalize your gift",
    description: "Add recipient details and a heartfelt message.",
  },
  {
    step: "03",
    title: "Complete checkout",
    description: "Secure payment — your eGift card is delivered by email.",
  },
] as const;

export const giftCardFaqs = [
  {
    q: "How is the gift card delivered?",
    a: "We email the eGift card to your recipient (or to you, if you prefer to deliver it yourself). Scheduled delivery is available.",
  },
  {
    q: "What can it be used for?",
    a: "Gift cards apply toward eligible Maternal Wellness services at The Nesting Place — doula care, postpartum support, lactation, massage, and more.",
  },
  {
    q: "Do gift cards expire?",
    a: "Gift cards do not expire. If you have questions about redemption, contact our team and we'll help.",
  },
  {
    q: "Can I get a physical gift card?",
    a: "This form purchases digital eGift cards only. Contact us if you need a printed certificate for a special occasion.",
  },
] as const;
