/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "#4f46e5",
        "accent-light": "#6366f1",
        "accent-dark": "#3730a3",
        sprout: "#10b981",
        "sprout-light": "#34d399",
        amber: "#f59e0b",
        ink: "var(--bg-ink)",
        "ink-light": "var(--bg-ink-light)",
        cream: "var(--text-cream)",
        muted: "var(--text-muted)",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
