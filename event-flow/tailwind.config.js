/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#FF6B2C',
          light: '#FF8F5E',
          dark: '#E5501A',
          bg: '#FFF2EC',
        },
        secondary: {
          DEFAULT: '#00C2A8',
          light: '#33CFBB',
          bg: '#E6FAF8',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          300: '#D1D5DB',
          500: '#6B7280',
          700: '#374151',
          900: '#111827',
        },
        success: { DEFAULT: '#16A34A', bg: '#F0FDF4' },
        warning: { DEFAULT: '#D97706', bg: '#FFFBEB' },
        danger: { DEFAULT: '#DC2626', bg: '#FEF2F2' },
        info: { DEFAULT: '#2563EB', bg: '#EFF6FF' },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '6px',
        md: '10px',
        lg: '10px',
        xl: '14px',
        '2xl': '14px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
        btn: '0 2px 8px rgba(255,107,44,0.35)',
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.6' }],
        md: ['16px', { lineHeight: '1.6' }],
        lg: ['18px', { lineHeight: '1.4' }],
        xl: ['20px', { lineHeight: '1.3' }],
        '2xl': ['24px', { lineHeight: '1.2' }],
        '3xl': ['30px', { lineHeight: '1.2' }],
      },
    },
  },
  plugins: [],
}
