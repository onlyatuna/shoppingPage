export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'vintage-navy': '#1D2D45', // Ink Navy
        'paper-white': '#F5F0E6',  // Cream
        'muted-teal': '#5A9EA3',   // New Primary
        'pale-cyan': '#8CC5C9',    // Keeping as secondary accent? Or replace? User didn't specify deletion, but Muted Teal is primary.
        'brand-orange': '#E85D3F', // Sunset Orange
      },
      fontFamily: {
        'heading': ['"GenSekiGothic TW"', '"Noto Sans TC"', 'sans-serif'],
        'body': ['"Noto Sans TC"', 'sans-serif'],
      }
    }
  },
  plugins: [],
}