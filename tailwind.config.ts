import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1B3A4B",
        teal: "#4A8B8C",
        sand: "#F5F0EB",
        gold: "#C49A6C",
        dark: "#2D2D2D",
        ok: "#3C6E47",
        warn: "#C49A6C",
        danger: "#C44536",
      },
      fontFamily: {
        serif: ["'Crimson Pro'", "Georgia", "serif"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
