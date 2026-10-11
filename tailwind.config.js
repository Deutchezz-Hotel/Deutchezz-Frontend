/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        /** Warm brown text/neutral scale. ink-900 is the primary body text (#2B1A10). */
        ink: {
          50: '#FAF7F3',
          100: '#F3EDE6',
          200: '#E7DED4',
          300: '#D6C9BB',
          400: '#B5A697',
          500: '#8C7B6B',
          600: '#6E5E4F',
          700: '#55463A',
          800: '#3A2C20',
          900: '#2B1A10',
          950: '#1C110A',
        },
        /** Brand browns. 700 = deep brown #4A2C1A, 500 = warm brown #7B5233. */
        forest: {
          50: '#F7F1E8',
          100: '#EFE3D6',
          200: '#E2CFBB',
          300: '#D0B399',
          400: '#A9815E',
          500: '#7B5233',
          600: '#63421F',
          700: '#4A2C1A',
          800: '#3A2214',
          900: '#2B1A10',
        },
        gold: {
          50: '#FBF6EF',
          100: '#F5EBD7',
          200: '#EAD6A9',
          300: '#DDBE76',
          400: '#D1A94F',
          500: '#C49A3C',
          600: '#A37E2E',
          700: '#7C5F23',
          800: '#5A451C',
          900: '#3D2F15',
          DEFAULT: '#C49A3C',
          light: '#E8C97A',
          dark: '#A37E2E',
        },
        /** Milk — warm section background #F7F1E8. */
        milk: {
          DEFAULT: '#F7F1E8',
          dark: '#EFE3D6',
        },
        /** Light neutral dashboard page background. */
        canvas: '#F6F4F1',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.9s ease-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
