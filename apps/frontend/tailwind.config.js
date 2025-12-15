export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'card': '6px 6px 0px #1D2D45',
        'card-hover': '4px 4px 0px #1D2D45',
        'input': '4px 4px 0px #1D2D45',
        'input-focus': '2px 2px 0px #1D2D45',
      },
      fontFamily: {
        'heading': ['"GenSekiGothic TW"', '"Noto Sans TC"', 'sans-serif'],
        'body': ['"Noto Sans TC"', 'sans-serif'],
      }
    }
  },
  plugins: [],
}