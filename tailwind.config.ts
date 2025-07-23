import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'warm-coral': {
          DEFAULT: '#FF6B7A',
          light: '#FFB3BA',
        },
        'deep-charcoal': {
          DEFAULT: '#2C2C2E',
          light: '#3A3A3C',
        },
        'sage-green': '#87A96B',
        'soft-gold': '#F4D03F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '375px',
        // Default breakpoints are already mobile-first:
        // sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'touch': '44px', // iOS minimum touch target
      },
      minWidth: {
        'touch': '44px', // iOS minimum touch target
      },
    },
  },
  plugins: [],
}
export default config