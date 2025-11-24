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
        tracker: '#ffaa4aff',
        ruby: '#ff5b5bff',
        sand: '#a7b6c7ff',
        paper: '#fcf7eeff',
        stone: '#E5E2DC',
        accent: '#6e86ffff',
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
