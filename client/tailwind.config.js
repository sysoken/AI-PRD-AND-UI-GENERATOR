/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          300: '#ff8ac8',
          400: '#ff5caf',
          500: '#ff3d9a',
          600: '#db2777',
        },
        cyanfire: {
          300: '#7de7ff',
          400: '#38d5ff',
          500: '#06b6d4',
        },
        canvas: {
          950: '#07070a',
          900: '#101014',
          800: '#17171d',
          700: '#20202a',
        },
      },
      fontFamily: {
        display: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Nunito Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        editorial: '0 24px 70px rgba(0, 0, 0, 0.34)',
        glow: '0 0 34px rgba(255, 61, 154, 0.14)',
      },
    },
  },
  plugins: [],
};
