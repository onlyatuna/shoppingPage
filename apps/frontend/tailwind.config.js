/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // 1. 保留原本的螢幕設定
      screens: {
        'landscape': { 'raw': '(orientation: landscape)' },
        'tablet-portrait': { 'raw': '(min-width: 640px) and (orientation: portrait)' },
      },

      // 2. 色彩系統合併
      colors: {
        // --- 原本的 Vintage Theme (不動) ---
        'vintage-navy': '#1A2B42',
        'brand-dark': '#1A2B42',
        'paper-white': '#F5F0E6',
        'muted-teal': '#5A9EA3',
        'pale-cyan': '#8CC5C9',
        'brand-orange': '#E85D3F',

        // --- 新增：Diagnosis Feature 專用色 (AI/Tech 風格) ---
        // 為了讓 LandingPage 的 bg-primary/10 等語法生效
        primary: {
          DEFAULT: '#4F46E5', // Indigo-600 (比純藍更有質感)
          dark: '#4338CA',    // Indigo-700
          light: '#818CF8',   // Indigo-400
        },
        background: {
          light: '#F8FAFC',   // Slate-50 (極簡白)
          dark: '#0F172A',    // Slate-900 (深空黑)
        }
      },

      // 3. 陰影系統合併
      boxShadow: {
        // --- 原本的 Hard Shadows (不動) ---
        'card': '6px 6px 0px #1A2B42',
        'card-hover': '4px 4px 0px #1A2B42',
        'input': '4px 4px 0px #1A2B42',
        'input-focus': '2px 2px 0px #1A2B42',

        // --- 新增：AI Glow Effects ---
        'glow': '0 0 20px rgba(79, 70, 229, 0.5)', // Primary color glow
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
      },

      // 4. 字體設定 (保留)
      fontFamily: {
        'heading': ['"GenSekiGothic TW"', '"Noto Sans TC"', 'sans-serif'],
        'body': ['"Noto Sans TC"', 'sans-serif'],
      },

      // 5. 新增：動畫設定 (LandingPage 必要)
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    }
  },
  plugins: [],
}