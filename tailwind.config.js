export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Iowan Old Style",
          "Palatino Linotype",
          "Palatino",
          "Book Antiqua",
          "Georgia",
          "serif",
        ],
      },
      colors: {
        // Warm bronze accent — fits the historic-map aesthetic
        bronze: {
          50: "#fdf8f1",
          100: "#f8ecd9",
          200: "#efd6ae",
          300: "#e4ba7c",
          400: "#d99a4e",
          500: "#c97f2f",
          600: "#b06424",
          700: "#8f4d20",
          800: "#743e20",
          900: "#5f341d",
        },
      },
      boxShadow: {
        panel:
          "0 1px 2px rgba(28, 25, 23, 0.06), 0 10px 30px rgba(28, 25, 23, 0.14)",
        pill: "0 1px 2px rgba(28, 25, 23, 0.08), 0 4px 14px rgba(28, 25, 23, 0.12)",
      },
    },
  },
  plugins: [],
};
