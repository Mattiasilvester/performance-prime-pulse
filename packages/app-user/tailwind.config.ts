import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'pp-gold': '#EEBA2B',
        'pp-black': '#0A0A0C',
        'pp-teal': '#10B981',
        'pp-red': '#EF4444',
        'pp-blue': '#3B82F6',
        'pp-purple': '#A855F7',
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
