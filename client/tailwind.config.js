/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tadka: {
          dark: '#FFFFFF',
          card: '#FFFFFF',
          'card-hover': '#FFF7ED',
          border: '#E2E8F0',
          orange: '#FF6B00',
          'orange-light': '#FF8A00',
          flame: '#FF4D00',
          yellow: '#FFC700',
          gold: '#FFD700',
          red: '#EF4444',
          green: '#10B981',
          accent: '#0F766E'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif']
      },
      boxShadow: {
        'glow-orange': '0 0 25px -5px rgba(255, 107, 0, 0.4)',
        'glow-yellow': '0 0 25px -5px rgba(255, 199, 0, 0.4)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.5)',
        'glow-card': '0 12px 32px 0 rgba(15, 23, 42, 0.08)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-short': 'bounce 1s infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(255, 107, 0, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(255, 107, 0, 0.7)' }
        }
      }
    },
  },
  plugins: [],
}
