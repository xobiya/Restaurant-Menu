/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212', // Deep Charcoal
        surface: 'rgba(255, 255, 255, 0.05)', // Glassmorphism surface
        primary: '#3b82f6', // Interactive elements
        textMain: '#ffffff',
        textMuted: '#9ca3af',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Variable Font Look
      },
      spacing: {
        'thumb': '30vh', // Thumb zone definition
        'bento': '0.75rem', // Bento grid gap
      },
      borderRadius: {
        'bento': '1.5rem', // 1.5rem for bento cards
      },
      scale: {
        'haptic': '0.95', // Haptic simulation scale down
      }
    },
  },
  plugins: [],
}
