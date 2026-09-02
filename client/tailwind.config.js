/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          50: '#fcf3f3',
          100: '#f8e2e2',
          200: '#f0c5c5',
          300: '#e39e9e',
          400: '#a43232',
          500: '#8B2626', // Requested Crimson
          600: '#751e1e',
          700: '#5e1717',
          800: '#4c1515',
          900: '#3d1414',
          950: '#230909',
        },
        sunset: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#EF6905', // Requested Sunset Orange
          600: '#d95300',
          700: '#b03d00',
          800: '#8c3207',
          900: '#722b0c',
          950: '#3f1303',
        },
        cream: {
          50: '#fdfcf7',
          100: '#fbf8eb',
          200: '#f7f1d4',
          300: '#F1E5A1', // Requested Warm Cream
          400: '#e5d378',
          500: '#cbb346',
          600: '#ad9235',
          700: '#866c2b',
          800: '#705829',
          900: '#5e4a26',
          950: '#352812',
        },
        forest: {
          50: '#f3f7f0',
          100: '#e3edd9',
          200: '#c8dbb5',
          300: '#a4c288',
          400: '#5d8c3c',
          500: '#486C2F', // Requested Forest Olive Green
          600: '#375424',
          700: '#2c431d',
          800: '#25361b',
          900: '#202e19',
          950: '#0e190a',
        },
        surface: {
          base: '#0c0d10',
          card: '#14161c',
          panel: '#101217',
          hover: '#1a1d25',
          active: '#222631',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-crimson': '0 0 20px -3px rgba(139, 38, 38, 0.45)',
        'glow-sunset': '0 0 20px -3px rgba(239, 105, 5, 0.45)',
        'glow-forest': '0 0 20px -3px rgba(72, 108, 47, 0.45)',
        'glow-cream': '0 0 20px -3px rgba(241, 229, 161, 0.35)',
        'glass': 'inset 0 1px 0 rgba(241, 229, 161, 0.12), 0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
