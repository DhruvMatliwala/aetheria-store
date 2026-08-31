import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
        serif: ['Playfair Display', 'Cormorant Garamond', 'Instrument Serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#ffbc09', // Saffron Gold
          600: '#f59e0b',
          700: '#d97706',
          800: '#b45309',
          900: '#78350f',
          950: '#451a03',
        },
        gold: {
          DEFAULT: '#ffbc09',
          300: '#fde68a',
          400: '#ffd053',
          500: '#ffbc09',
          600: '#e5a500',
        },
        terracotta: {
          300: '#c25844',
          400: '#962817',
          500: '#712011',
          600: '#47140b',
          700: '#2f0e09',
        },
        accent: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        surface: {
          950: '#080403', // Deepest Obsidian
          900: '#0e0605', // Obsidian Base
          850: '#140806', // Dark Bronze-Charcoal
          800: '#1b0b08', // Rich Terracotta-Dark
          750: '#240e0b', // Elevated Terracotta
          700: '#33140e', // Structural Hairlines
          600: '#4a1c14', // Borders
          500: '#6b281d', // Subtle Hover Border
        },
        ivory: {
          DEFAULT: '#ece7e0',
          dim: '#bfb8ae',
        },
      },
      boxShadow: {
        'glow-sm': '0 0 20px -5px rgba(255, 188, 9, 0.3)',
        'glow-brand': '0 0 35px -5px rgba(255, 188, 9, 0.45)',
        'glow-gold': '0 0 40px -8px rgba(255, 188, 9, 0.5)',
        'depth': '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px -10px rgba(255, 188, 9, 0.08)',
        'depth-lg': '0 35px 80px -15px rgba(0, 0, 0, 0.9), 0 0 50px -10px rgba(255, 188, 9, 0.12)',
      },
      animation: {
        'float-idle': 'float-idle 6s ease-in-out infinite',
        'drift': 'drift-across 25s linear infinite',
        'radar-spin': 'radar-spin 5s linear infinite',
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow-breathe': 'glow-breathe 4s ease-in-out infinite',
        'waypoint-pulse': 'waypoint-pulse 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'float-idle': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-6px) rotate(0.5deg)' },
          '75%': { transform: 'translateY(4px) rotate(-0.5deg)' },
        },
        'drift-across': {
          '0%': { transform: 'translateX(-100px) translateY(0)', opacity: '0' },
          '10%': { opacity: '0.15' },
          '90%': { opacity: '0.15' },
          '100%': { transform: 'translateX(calc(100vw + 100px)) translateY(-30px)', opacity: '0' },
        },
        'radar-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glow-breathe': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.7' },
        },
        'waypoint-pulse': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '70%': { transform: 'scale(2.2)', opacity: '0' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
