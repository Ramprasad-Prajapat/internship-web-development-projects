/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(51, 65, 85, 0.05), 0 2px 6px -1px rgba(51, 65, 85, 0.03)",
        "card-hover": "0 10px 25px -3px rgba(51, 65, 85, 0.08), 0 4px 12px -2px rgba(51, 65, 85, 0.05)",
      },
    },
  },
  plugins: [],
};
