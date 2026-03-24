/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.15s ease-out forwards',
        slideUp: 'slideUp 0.3s ease-out forwards',
        slideDown: 'slideDown 0.2s ease-out forwards',
      },
      colors: {
        background: '#0a0a0b',
        foreground: '#e4e4e7',
        accent: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
        },
        surface: {
          DEFAULT: '#0c0c0e',
          raised: '#111113',
        },
        border: {
          DEFAULT: '#1c1c20',
          hover: '#27272a',
        },
        muted: '#71717a',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
