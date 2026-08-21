/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "#2e5b3e",
        "accent-light": "#3d7350",
        "accent-dark": "#1b3b27",
        sprout: "#34d399",
        "sprout-light": "#6ee7b7",
        amber: "#d97706",
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
