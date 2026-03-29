/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f1113',
        surface: '#181c20',
        surfaceSoft: '#21262c',
        primary: '#c58a3d',
        primaryDark: '#a6712f',
        textMain: '#f6f1e8',
        textMuted: '#b8ad9f',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Noto Sans Ethiopic', 'sans-serif'],
      },
      spacing: {
        thumb: '30vh',
        bento: '0.875rem',
      },
      borderRadius: {
        bento: '1.25rem',
      },
      scale: {
        haptic: '0.98',
      },
    },
  },
  plugins: [],
};
