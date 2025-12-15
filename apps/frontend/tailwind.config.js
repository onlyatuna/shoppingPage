export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'vintage-navy': '#1A2B42', // Mt. Fuji Navy
        'brand-dark': '#1A2B42',   // Mt. Fuji Navy
        'paper-white': '#F5F0E6',  // Cream
        'muted-teal': '#5A9EA3',   // New Primary
        'pale-cyan': '#8CC5C9',    // Secondary Accent
        'brand-orange': '#E85D3F', // Sunset Orange
      },
      boxShadow: {
        'card': '6px 6px 0px #1A2B42',
        'card-hover': '4px 4px 0px #1A2B42',
        'input': '4px 4px 0px #1A2B42',
        'input-focus': '2px 2px 0px #1A2B42',
      },
      fontFamily: {
        'heading': ['"GenSekiGothic TW"', '"Noto Sans TC"', 'sans-serif'],
        'body': ['"Noto Sans TC"', 'sans-serif'],
      }
    }
  },
  plugins: [],
}