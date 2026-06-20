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
          sage: "#B8A9C9",
          "sage-dark": "#8B7BA8",
          "sage-deep": "#3A3348",
          "sage-light": "#D4E5D0",
          blush: "#E8D8F0",
          rose: "#C4A4B5",
          "rose-dark": "#A67F91",
          "rose-light": "#F0E0E8",
          cream: "#FAF7F2",
          charcoal: "#2D3436",
          slate: "#3D4550",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-plus-jakarta-sans)",
          "Plus Jakarta Sans",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          "var(--font-instrument-serif)",
          "Instrument Serif",
          "Georgia",
          "serif",
        ],
      },
      boxShadow: {
        auth: "0 8px 40px rgba(45, 52, 54, 0.1), 0 2px 8px rgba(45, 52, 54, 0.04)",
        heroImage:
          "0 24px 48px -12px rgba(139, 123, 168, 0.16), 0 12px 28px -10px rgba(45, 52, 54, 0.08)",
        floatingCard:
          "0 24px 56px -16px rgba(139, 123, 168, 0.22), 0 12px 32px -12px rgba(45, 52, 54, 0.08)",
      },
    },
  },
  plugins: [],
  safelist: ["bg-nurture-sage-deep", "text-nurture-sage-deep"],
};

export default config;
