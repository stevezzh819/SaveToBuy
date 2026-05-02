/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        accent: "#0BA510",
        ink: "#111827",
        muted: "#6B7280",
        line: "#E5E7EB"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};
