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
    },
  },
  plugins: [],
}
export default config