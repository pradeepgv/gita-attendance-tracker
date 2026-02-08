/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff8f0',
          100: '#fff0db',
          200: '#ffddb3',
          300: '#ffc480',
          400: '#ffa94d',
          500: '#ff8c1a',
          600: '#e67300',
          700: '#cc6600',
          800: '#a35200',
          900: '#804000',
        },
      },
    },
  },
  plugins: [],
};
