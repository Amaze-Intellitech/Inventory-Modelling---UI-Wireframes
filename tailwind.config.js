/** @type {import('tailwindcss').Config} */
export default {
  // Theme is switched by <html data-theme="dark"> (see src/lib/theme.js); colours are CSS variables.
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ---- AITEK Style Guide v1.2 ----
        ink: 'var(--ink)',
        deep: 'var(--deep-fill)',
        'body-c': 'var(--body-c)',
        subtle: 'var(--subtle)',
        faint: 'var(--faint)',
        'border-strong': 'var(--border-strong)',
        'muted-fill': 'var(--muted-fill)',
        info: {
          DEFAULT: 'var(--info)',
          bg: 'var(--info-bg)',
          tx: 'var(--info-tx)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
          tx: 'var(--warning-tx)',
        },
        error: {
          DEFAULT: 'var(--error)',
          bg: 'var(--error-bg)',
          tx: 'var(--error-tx)',
        },
        ai: {
          DEFAULT: 'var(--ai)',
          bg: 'var(--ai-bg)',
          tx: 'var(--ai-tx)',
        },
        // data-visualisation series (fixed order, five maximum)
        s1: 'var(--s1)',
        s2: 'var(--s2)',
        s3: 'var(--s3)',
        s4: 'var(--s4)',
        s5: 'var(--s5)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
          tx: 'var(--success-tx)',
        },
        border: 'var(--border)',
        input: 'var(--border-strong)',
        ring: 'var(--primary)',
        background: 'var(--bg)',
        foreground: 'var(--ink)',
        // `primary` = brand blue for text, borders and rings (lighter in dark theme);
        // `primary-solid` = fill that carries white text (same blue in both themes).
        primary: {
          DEFAULT: 'var(--primary)',
          solid: 'var(--primary-solid)',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: 'var(--bg)',
          foreground: 'var(--ink)',
        },
        destructive: {
          DEFAULT: 'var(--error)',
          foreground: '#FFFFFF',
        },
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-lg)',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Noto Sans', 'sans-serif'],
        display: ['Urbanist', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-sm)',
        subtle: 'var(--shadow-sm)',
        hover: 'var(--shadow-md)',
        elevated: 'var(--shadow-lg)',
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
