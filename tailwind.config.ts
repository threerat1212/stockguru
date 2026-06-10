import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#060A0E",
          "bg-secondary": "#0B1218",
          card: "#0F171F",
          primary: "#10B981",
          "primary-hover": "#34D399",
          success: "#10B981",
          danger: "#EF4444",
          warning: "#F59E0B",
          accent: "#22D3EE",
          "text-primary": "#F0F5FA",
          "text-secondary": "#8B9DB3",
          "text-muted": "#4A6074",
          "surface-hover": "#162029",
          border: "#1A2D3A",
          "border-light": "#243A4A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      zIndex: {
        "sidebar-backdrop": "20",
        sidebar: "30",
        header: "40",
        dropdown: "50",
        modal: "60",
        tooltip: "70",
      },
    },
  },
  plugins: [],
}
export default config
