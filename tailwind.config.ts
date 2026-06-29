import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nurture: {
          /** Primary — Lilac */
          lilac: "#B8A9C9",
          "lilac-dark": "#9A8AB0",
          /** Typography — Shadow Grey */
          text: "#2C2A3A",
          /** Main background — Parchment */
          parchment: "#F4F0EB",
          /** Secondary surfaces — Pale Oak */
          oak: "#D4BFA8",
          "oak-light": "#E8DDD0",
          /** Accent — Vintage Grape */
          grape: "#4A4559",
          /** Primary CTA — Royal Gold */
          gold: "#FFDF67",
          "gold-dark": "#E6C852",
          /** Legacy aliases (used across components) */
          sage: "#B8A9C9",
          "sage-dark": "#9A8AB0",
          "sage-deep": "#4A4559",
          "sage-light": "#E8DDD0",
          blush: "#E8D8F0",
          rose: "#C4A4B5",
          "rose-dark": "#A67F91",
          "rose-light": "#F5EDE8",
          cream: "#F4F0EB",
          charcoal: "#2C2A3A",
          slate: "#4A4559",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Lora", "Georgia", "serif"],
        wordmark: ["Quicksand", "system-ui", "sans-serif"],
      },
      boxShadow: {
        auth: "0 8px 40px rgba(44, 42, 58, 0.1), 0 2px 8px rgba(44, 42, 58, 0.04)",
        heroImage:
          "0 24px 48px -12px rgba(184, 169, 201, 0.2), 0 12px 28px -10px rgba(44, 42, 58, 0.08)",
        floatingCard:
          "0 24px 56px -16px rgba(184, 169, 201, 0.24), 0 12px 32px -12px rgba(44, 42, 58, 0.08)",
        nav: "0 4px 24px -4px rgba(44, 42, 58, 0.12)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    },
  },
  plugins: [],
  safelist: [
    "bg-nurture-sage-deep",
    "text-nurture-sage-deep",
    "bg-nurture-grape",
    "bg-nurture-oak",
    "bg-nurture-gold",
    "text-nurture-gold",
  ],
};

export default config;
