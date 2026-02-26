import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'pp-gold': '#EEBA2B',
        'pp-black': '#000000',
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      borderColor: {
        border: 'hsl(var(--border))',
      },
    },
  },
  plugins: [],
} satisfies Config
