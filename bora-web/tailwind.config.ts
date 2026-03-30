import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "bora-blue": "#1a6bdb",
        "bora-blue-light": "#e8f0fd",
        "science-teal": "#0ea47a",
        "teal-light": "#e6f8f1",
        "deep-violet": "#7c3aed",
        "violet-light": "#f0ebfe",
        "ink-black": "#0f1117",
        slate: "#5a6172",
        "border-gray": "#e2e6ef",
        "lab-white": "#f4f6fb",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
