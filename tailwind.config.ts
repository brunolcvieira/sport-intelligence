import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: "#050d14",
          900: "#0a1929",
          800: "#0f2840",
          700: "#163557",
        },
        accent: {
          green: "#00e676",
          teal: "#00bcd4",
          yellow: "#ffd600",
          red: "#ff1744",
          orange: "#ff9100",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
