export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontSize: {
        xs: ["0.75rem", "1rem"],
        sm: ["0.875rem", "1.25rem"],
        base: ["1rem", "1.5rem"],
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.08), 0 6px 16px rgba(0,0,0,0.08)",
      },
      zIndex: {
        popout: "1000", // matches your high z-index convention
      },
      colors: {
        ui: {
          bg: "#ffffff",
          fg: "#111111",
          sub: "#6b7280", // grey-500
          ring: "#111111",
          accent: "#0EA5E9", // sky-500 - used for interactive elements
          "accent-light": "#38BDF8", // sky-400 - lighter shade
        },
      },
    },
  },
  plugins: [],
};
