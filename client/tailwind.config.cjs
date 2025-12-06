/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#020817",
        foreground: "#e5e7eb",
        muted: "#020617",
        "muted-foreground": "#64748b",
        border: "#1f2937"
      }
    }
  },
  plugins: []
};
