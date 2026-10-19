import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        bull: {
          DEFAULT: "#22c55e",
          muted: "#14532d",
        },
        bear: {
          DEFAULT: "#ef4444",
          muted: "#7f1d1d",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular"],
      },
      boxShadow: {
        terminal: "0 0 0 1px rgba(39, 39, 42, 1), 0 18px 50px -24px rgba(0, 0, 0, 0.7)",
      },
    },
  },
  plugins: [],
};

export default config;
