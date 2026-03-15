/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0d12',
          900: '#121620',
          800: '#1a2130',
          700: '#2a3448',
          600: '#39445e',
          500: '#4b5877',
          400: '#6b7794',
          300: '#9aa3b8',
          200: '#c7cedb',
          100: '#e4e8f0',
          50: '#f4f6fb'
        },
        mint: {
          700: '#0f766e',
          600: '#0d9488',
          500: '#14b8a6',
          400: '#2dd4bf',
          300: '#5eead4',
          200: '#99f6e4',
          100: '#ccfbf1',
          50: '#f0fdfa'
        },
        coral: {
          700: '#be4a39',
          600: '#dc5a48',
          500: '#ef6b59',
          400: '#f58a7b',
          300: '#fbb0a6',
          200: '#fcd1cb',
          100: '#fee8e5',
          50: '#fff5f3'
        }
      },
      boxShadow: {
        soft: '0 20px 60px -40px rgba(15, 23, 42, 0.35)',
        card: '0 14px 40px -25px rgba(15, 23, 42, 0.45)'
      },
      fontFamily: {
        display: ['"Sora"', 'ui-sans-serif', 'system-ui'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};
