/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        moss: {
          50: '#f3f7f0',
          100: '#e2ecdb',
          200: '#c5d9b8',
          300: '#9fbf8b',
          400: '#79a263',
          500: '#5b8546',
          600: '#466935',
          700: '#37522b',
          800: '#2e4225',
          900: '#283820',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
