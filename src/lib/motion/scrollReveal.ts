export type ScrollRevealVariant =
  | "default"
  | "soft"
  | "emphasis"
  | "quick"
  | "gentle";

export interface ScrollRevealConfig {
  opacity: number;
  y: number;
  duration: number;
  stagger: number;
  ease: string;
  start: string;
  end: string;
}

export const SCROLL_REVEAL_VARIANTS: Record<
  ScrollRevealVariant,
  ScrollRevealConfig
> = {
  default: {
    opacity: 0.1,
    y: 30,
    duration: 0.6,
    stagger: 0.04,
    ease: "power2.out",
    start: "top 80%",
    end: "bottom 50%",
  },
  soft: {
    opacity: 0.15,
    y: 22,
    duration: 0.7,
    stagger: 0.032,
    ease: "power1.out",
    start: "top 82%",
    end: "bottom 55%",
  },
  emphasis: {
    opacity: 0.05,
    y: 36,
    duration: 0.65,
    stagger: 0.048,
    ease: "power3.out",
    start: "top 78%",
    end: "bottom 48%",
  },
  quick: {
    opacity: 0.18,
    y: 18,
    duration: 0.45,
    stagger: 0.028,
    ease: "power2.out",
    start: "top 85%",
    end: "bottom 52%",
  },
  gentle: {
    opacity: 0.12,
    y: 26,
    duration: 0.55,
    stagger: 0.038,
    ease: "sine.out",
    start: "top 83%",
    end: "bottom 50%",
  },
};
