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
          "sage-light": "#D4E5D0",
          blush: "#E8D8F0",
          rose: "#C4A4B5",
          "rose-dark": "#A67F91",
          "rose-light": "#F0E0E8",
          cream: "#FAF7F2",
          charcoal: "#2D3436",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Lora", "Georgia", "serif"],
      },
      boxShadow: {
        auth: "0 8px 40px rgba(45, 52, 54, 0.1), 0 2px 8px rgba(45, 52, 54, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
