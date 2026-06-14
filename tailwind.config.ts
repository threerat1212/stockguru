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
          bg: "#060A12",
          "bg-secondary": "#0B111D",
          card: "#111A29",
          primary: "#34D399",
          "primary-hover": "#10B981",
          success: "#10B981",
          danger: "#F43F5E",
          warning: "#F59E0B",
          accent: "#22D3EE",
          "text-primary": "#F8FAFC",
          "text-secondary": "#A8B5C7",
          "text-muted": "#718196",
          "surface-hover": "#172437",
          border: "#2A3A4F",
          "border-light": "#35475F",
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
