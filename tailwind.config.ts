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
          sage: "#8BA888",
          "sage-dark": "#6B8F69",
          blush: "#E8C4B8",
          cream: "#FAF7F2",
          charcoal: "#2D3436",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
      },
      boxShadow: {
        auth: "0 4px 24px rgba(45, 52, 54, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
