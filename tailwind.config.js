/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
        display: ['Cairo', 'sans-serif'],
      },
      colors: {
        felt: {
          950: '#06140e',
          900: '#0a2118',
          800: '#0e2e22',
          700: '#123a2b',
          600: '#1a4a37',
        },
        gold: {
          50: '#fbf6e3',
          100: '#f7ecc3',
          200: '#f0d98a',
          300: '#e8c75e',
          400: '#dcb23e',
          500: '#d4af37',
          600: '#b08d24',
          700: '#836719',
        },
        ember: {
          400: '#f5653a',
          500: '#e0491f',
          600: '#b8361a',
        },
        ink: {
          950: '#070b08',
          900: '#0c130e',
          850: '#101a13',
          800: '#152218',
          700: '#1d2f24',
        },
      },
      boxShadow: {
        'gold-glow': '0 0 0 1px rgba(212,175,55,0.35), 0 8px 30px -8px rgba(212,175,55,0.25)',
        'inner-felt': 'inset 0 2px 20px rgba(0,0,0,0.55), inset 0 0 60px rgba(0,0,0,0.35)',
        card: '0 10px 30px -12px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'felt-radial':
          'radial-gradient(120% 90% at 50% 0%, rgba(26,74,55,0.55) 0%, rgba(10,33,24,0.85) 45%, #06140e 100%)',
        'gold-sheen':
          'linear-gradient(120deg, rgba(212,175,55,0) 0%, rgba(240,215,94,0.55) 45%, rgba(212,175,55,0) 90%)',
      },
      keyframes: {
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        pulseSoft: 'pulseSoft 2.2s ease-in-out infinite',
        riseIn: 'riseIn 0.45s cubic-bezier(0.2,0.7,0.2,1) both',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
};
