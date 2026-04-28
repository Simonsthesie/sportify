/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        energy: {
          50:  '#fff7ed',
          100: '#ffedd5',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        dark: {
          900: '#0a0f1e',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'sport-gradient':  'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)',
        'energy-gradient': 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
        'hero-gradient':   'linear-gradient(135deg, #0a0f1e 0%, #1e3a8a 60%, #1d4ed8 100%)',
        'card-gradient':   'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(249,115,22,0.04) 100%)',
      },
      boxShadow: {
        'sport':   '0 4px 24px -4px rgba(37, 99, 235, 0.25)',
        'energy':  '0 4px 24px -4px rgba(249, 115, 22, 0.35)',
        'card-hover': '0 8px 40px -8px rgba(37, 99, 235, 0.20)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
