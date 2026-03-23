/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        foreground: '#e4e4e7',
        accent: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
        },
        surface: '#111113',
        border: '#27272a',
        muted: '#71717a',
      },
    },
  },
  plugins: [],
}
