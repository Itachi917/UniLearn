/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        blue: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        gray: {
          50: 'var(--color-surface-50)',   
          800: 'var(--color-surface-800)', 
          900: 'var(--color-surface-900)', 
        },
        card: 'var(--color-card)',       
        primary: 'var(--color-primary-600)',
        secondary: '#10b981',
        accent: '#8b5cf6',
        surface: 'var(--color-surface-50)',
        'surface-dark': 'var(--color-surface-900)',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.900'),
            a: {
              color: theme('colors.blue.600'),
              '&:hover': {
                color: theme('colors.blue.700'),
              },
            },
            h1: { fontWeight: '700' },
            h2: { fontWeight: '700' },
            h3: { fontWeight: '600' },
            ul: { listStyleType: 'disc' },
            ol: { listStyleType: 'decimal' },
          },
        },
        invert: {
          css: {
            color: theme('colors.gray.100'),
            a: {
              color: theme('colors.blue.400'),
              '&:hover': {
                color: theme('colors.blue.300'),
              },
            },
            h1: { color: theme('colors.gray.100') },
            h2: { color: theme('colors.gray.100') },
            h3: { color: theme('colors.gray.100') },
            strong: { color: theme('colors.gray.100') },
            code: { color: theme('colors.gray.100') },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
