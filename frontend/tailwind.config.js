/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: { colors: { blue: { 50: '#f0f6ef', 100: '#e1eee2', 200: '#bfd9c7', 400: '#59a187', 500: '#308269', 600: '#17675d', 700: '#18554b', 800: '#16463f', 900: '#163d36' } } },
  },
  plugins: [],
};
