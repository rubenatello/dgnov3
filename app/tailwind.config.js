/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Tailwind v4 design tokens live in src/index.css via @theme.
  // Keep this file only for compatibility with tooling that reads a config.
  plugins: [],
}
