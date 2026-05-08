export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fef9f3',
          100: '#fdf3e6',
          400: '#d4af37',
          500: '#c9a961',
          600: '#b8944e',
          700: '#a67c52',
        },
        warm: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          600: '#c44536',
          700: '#a83a2f',
          800: '#8b2e24',
          900: '#5a1f1a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      }
    },
  },
  plugins: [],
}