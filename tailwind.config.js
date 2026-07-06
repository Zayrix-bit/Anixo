export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          50: '#eef0ff',
          100: '#e0e4ff',
          200: '#c7cdff',
          300: '#a5b0ff',
          400: '#818eff',
          500: '#5865F2',
          600: '#4752C4',
          700: '#3c45a5',
          800: '#323986',
          900: '#2c336b',
          950: '#1b1f41',
        }
      },
      fontWeight: {
        semibold: '500',
        bold: '500',
        extrabold: '500',
        black: '500',
      }
    },
  },
  plugins: [],
}
