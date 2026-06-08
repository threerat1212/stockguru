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
          bg: "#0A0E1A",
          "bg-secondary": "#111827",
          card: "#1E293B",
          primary: "#3B82F6",
          success: "#10B981",
          danger: "#F43F5E",
          warning: "#F59E0B",
          accent: "#8B5CF6",
          "text-primary": "#F8FAFC",
          "text-secondary": "#94A3B8",
          "text-muted": "#64748B",
          "surface-hover": "#27354F",
          border: "#334155",
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
