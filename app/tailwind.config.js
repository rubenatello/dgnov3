/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FCFCFC',
        bgDark: '#232425ff', // Renamed from bg-dark (hyphens not allowed)
        ink: '#1D212B',
        inkMuted: '#303030',
        sand: '#929faeff',
        paper: '#FFFAF0',
        stone: '#E5E2DC',
        accent: '#6e86ffff',
      },
      fontFamily: {
        heading: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
