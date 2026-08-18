/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c7ff',
          400: '#85a3ff',
          500: '#5275ff', // Primary blue/indigo
          600: '#3350eb',
          700: '#253bc9',
          800: '#2133a3',
          900: '#1f2e82',
          950: '#131a4f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
