/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        museum: {
          teal: '#0F4C5C',
          'teal-light': '#1A6B7F',
          'teal-dark': '#0A3340',
          gold: '#D4A853',
          'gold-light': '#E5C67A',
          'gold-dark': '#B8893A',
          ivory: '#FAF8F0',
          'ivory-dark': '#F0EDE2',
          charcoal: '#2D2D2D',
          'charcoal-light': '#4A4A4A',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'Georgia', 'serif'],
        sans: ['Noto Sans SC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
