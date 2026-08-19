/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "#7c3aed",
        "accent-light": "#8b5cf6",
        sprout: "#22c55e",
        "sprout-light": "#4ade80",
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
