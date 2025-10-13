
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// Nuova palette Performance Prime con migliore contrasto
				'pp-black': '#1A1A1A',        // Sfondo principale
				'pp-gold': '#FFD700',          // Oro principale
				'pp-blue': '#3B82F6',          // Blu secondario
				'pp-green': '#16A34A',         // Verde accent
				'pp-red': '#EF4444',           // Rosso pericolo
				'pp-orange': '#F59E0B',        // Arancione avviso
				'pp-gray': '#2A2A2A',          // Grigio superficie
				'pp-gray-light': '#404040',    // Grigio chiaro
				'pp-gray-lighter': '#595959',  // Grigio più chiaro
				'pp-text': '#FFFFFF',          // Testo principale
				'pp-text-secondary': '#A0A0A0', // Testo secondario
				'pp-text-muted': '#737373',    // Testo attenuato
				
				// Background colors
				'background': 'hsl(var(--background))',
				'background-secondary': 'hsl(var(--background-secondary))',
				'background-tertiary': 'hsl(var(--background-tertiary))',
				
				// Text colors
				'text-primary': 'hsl(var(--text-primary))',
				'text-secondary': 'hsl(var(--text-secondary))',
				'text-muted': 'hsl(var(--text-muted))',
				
				// Brand colors
				'brand-primary': 'hsl(var(--brand-primary))',
				'brand-secondary': 'hsl(var(--brand-secondary))',
				'brand-accent': 'hsl(var(--brand-accent))',
				
				// Interactive colors
				'interactive-primary': 'hsl(var(--interactive-primary))',
				'interactive-secondary': 'hsl(var(--interactive-secondary))',
				'interactive-danger': 'hsl(var(--interactive-danger))',
				'interactive-success': 'hsl(var(--interactive-success))',
				'interactive-warning': 'hsl(var(--interactive-warning))',
				
				// Surface colors
				'surface-primary': 'hsl(var(--surface-primary))',
				'surface-secondary': 'hsl(var(--surface-secondary))',
				'surface-tertiary': 'hsl(var(--surface-tertiary))',
				
				// Border colors
				'border-primary': 'hsl(var(--border-primary))',
				'border-secondary': 'hsl(var(--border-secondary))',
				'border-accent': 'hsl(var(--border-accent))',
				
				// Legacy shadcn/ui support
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'gold-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.4)'
					},
					'50%': {
						boxShadow: '0 0 0 10px rgba(255, 215, 0, 0)'
					}
				},
				'blue-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)'
					},
					'50%': {
						boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'gold-pulse': 'gold-pulse 2s infinite',
				'blue-pulse': 'blue-pulse 2s infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
