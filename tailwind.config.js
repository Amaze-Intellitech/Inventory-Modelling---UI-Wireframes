/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'navy-800': 'var(--navy-800)',
        'navy-700': 'var(--navy-700)',
        accent: {
          DEFAULT: 'var(--accent)',
          dim: 'var(--accent-dim)',
          foreground: '#FFFFFF',
        },
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        text: 'var(--text)',
        muted: {
          DEFAULT: 'var(--muted)',
          2: 'var(--muted-2)',
        },
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
        },
        watch: {
          DEFAULT: 'var(--watch)',
          bg: 'var(--watch-bg)',
        },
        risk: {
          DEFAULT: 'var(--risk)',
          bg: 'var(--risk-bg)',
        },
        border: 'var(--line)',
        input: 'var(--line-strong)',
        ring: 'var(--accent)',
        background: 'var(--bg)',
        foreground: 'var(--text)',
        primary: {
          DEFAULT: 'var(--ink)',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: 'var(--bg)',
          foreground: 'var(--text)',
        },
        destructive: {
          DEFAULT: 'var(--risk)',
          foreground: '#FFFFFF',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        subtle: '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
        hover: '0 4px 12px rgba(16, 24, 40, 0.08), 0 2px 4px rgba(16, 24, 40, 0.04)',
        elevated: '0 10px 24px rgba(16, 24, 40, 0.1), 0 4px 8px rgba(16, 24, 40, 0.06)',
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
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [import('tailwindcss-animate')],
};
