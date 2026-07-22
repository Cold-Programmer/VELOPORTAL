/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Taste-skill design tokens ──────────────────────────────────────
        // Inspired by Vercel, Linear, Arc — dark forest primary, warm amber
        // accent, crisp white surfaces, near-black ink. Every colour has a
        // purposeful step so designers can reach for the right token rather
        // than guessing an arbitrary hex.
        forest: {
          50:  '#f0f7f3',
          100: '#d9ede2',
          200: '#afd6bf',
          DEFAULT: '#16382A',
          dark:    '#0E271C',
          light:   '#1F4D36',
          900:     '#07150D',
        },
        amber: {
          50:   '#FFF9EC',
          100:  '#FDECC7',
          200:  '#FBDA93',
          DEFAULT: '#E8A33D',
          dark:    '#C97F1C',
          900:     '#5A3209',
        },
        sand: {
          DEFAULT: '#FAFAF8',
          100: '#F4F3EE',
          200: '#E9E8E1',
        },
        ink: {
          DEFAULT: '#1C1C1A',
          50: '#F8F8F7',
          100: '#EBEBEA',
          200: '#C8C8C5',
          300: '#999994',
          400: '#6B6B67',
          500: '#4A4A47',
        },
        // Status colours — consistent across all alerts/badges
        success: '#17A85A',
        warning: '#F5A623',
        danger:  '#E84040',
        info:    '#3B82F6',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        body:    ['"Inter"',         'ui-sans-serif', 'system-ui'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Scale ratios that feel intentional at every size
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem',  { lineHeight: '1.125rem' }],
        sm:    ['0.875rem', { lineHeight: '1.375rem' }],
        base:  ['1rem',     { lineHeight: '1.625rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',  { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.75rem' }],
        '5xl': ['3rem',     { lineHeight: '3.5rem' }],
        '6xl': ['3.75rem',  { lineHeight: '4.25rem' }],
        '7xl': ['4.5rem',   { lineHeight: '5rem' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        snap:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
        out:    'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        rise:    { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'rise-sm': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pop:     { from: { opacity: 0, transform: 'scale(0.92)' }, to: { opacity: 1, transform: 'scale(1)' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        shimmer: { '0%': { backgroundPosition: '-400% 0' }, '100%': { backgroundPosition: '400% 0' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        spin:    { to: { transform: 'rotate(360deg)' } },
        wobble:  { '0%,100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-3deg)' }, '75%': { transform: 'rotate(3deg)' } },
        gradient:{ '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(40px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        rise:      'rise 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
        'rise-sm': 'rise-sm 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        pop:       'pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'fade-in': 'fade-in 0.4s ease both',
        float:     'float 3.5s ease-in-out infinite',
        shimmer:   'shimmer 2.5s linear infinite',
        wobble:    'wobble 0.45s ease-in-out',
        gradient:  'gradient 6s ease infinite',
        'slide-up':'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      backgroundSize: {
        '300': '300%',
        '400': '400%',
      },
      boxShadow: {
        'soft':    '0 2px 8px -2px rgba(22,56,42,0.08), 0 4px 24px -4px rgba(22,56,42,0.06)',
        'glow':    '0 0 0 3px rgba(232,163,61,0.25)',
        'forest':  '0 8px 32px -8px rgba(14,39,28,0.45)',
        'amber':   '0 8px 24px -8px rgba(201,127,28,0.55)',
        'card':    '0 1px 4px rgba(28,28,26,0.06), 0 4px 16px rgba(28,28,26,0.04)',
        'card-hover': '0 8px 32px rgba(28,28,26,0.12), 0 2px 8px rgba(28,28,26,0.06)',
        'modal':   '0 24px 80px rgba(14,39,28,0.35)',
        'inner':   'inset 0 2px 6px rgba(28,28,26,0.06)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
