/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        military: {
          50: '#f0f4f0',
          100: '#dce8dc',
          200: '#b9d1b8',
          300: '#8fb38d',
          400: '#5c8a59',
          500: '#3d6e3a',
          600: '#2e572c',
          700: '#234522',
          800: '#1a321a',
          900: '#0f1f0f',
        },
        olive: {
          50: '#f7f7ee',
          100: '#eeeed8',
          200: '#d9d9a8',
          300: '#c0c070',
          400: '#a5a540',
          500: '#868620',
          600: '#6b6b18',
          700: '#545413',
          800: '#3e3e0f',
          900: '#2a2a09',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
