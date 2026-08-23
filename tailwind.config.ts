import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        field: {
          950: "#06170d",
          900: "#0a2313",
          800: "#0f2e19",
          700: "#163d22",
          600: "#1f4e2c",
          500: "#2c6a3b",
        },
        chalk: {
          DEFAULT: "#f2efe4",
          dim: "#c9d2c4",
          faint: "#8fa08e",
        },
        flag: {
          DEFAULT: "#d64545",
          dim: "#7a2b2b",
        },
        gold: {
          DEFAULT: "#e0b04a",
        },
      },
      fontFamily: {
        chalk: ["var(--font-chalk)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "field-lines": "repeating-linear-gradient(0deg, rgba(242,239,228,0.035) 0px, rgba(242,239,228,0.035) 1px, transparent 1px, transparent 48px)",
      },
    },
  },
  plugins: [],
};

export default config;
