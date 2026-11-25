import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          950: "#1E1B4B",
        },
        status: {
          scheduled: {
            bg: "#EFF6FF",
            text: "#1D4ED8",
            border: "#DBEAFE",
            dot: "#3B82F6",
          },
          processing: {
            bg: "#F5F3FF",
            text: "#6D28D9",
            border: "#DDD6FE",
            dot: "#8B5CF6",
          },
          delayed: {
            bg: "#FFFBEB",
            text: "#B45309",
            border: "#FDE68A",
            dot: "#F59E0B",
          },
          sent: {
            bg: "#ECFDF5",
            text: "#047857",
            border: "#A7F3D0",
            dot: "#10B981",
          },
          failed: {
            bg: "#FEF2F2",
            text: "#B91C1C",
            border: "#FECACA",
            dot: "#EF4444",
          },
        },
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        dropdown: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
      },
      keyframes: {
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
