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
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4', // Pure Electric Cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#082f49',
        },
        gold: {
          DEFAULT: '#06b6d4',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        terracotta: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        accent: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        surface: {
          950: '#050811', // Deepest Obsidian
          900: '#070b13', // Obsidian Base
          850: '#090e1a', // Dark Navy Void
          800: '#0c1424', // Card Background
          750: '#101b30', // Elevated Card
          700: '#142038', // Hairline borders
          600: '#16243d', // Borders
          500: '#1f355b', // Subtle Hover Border
        },
        ivory: {
          DEFAULT: '#f1f5f9',
          dim: '#94a3b8',
        },
      },
      boxShadow: {
        'glow-sm': '0 0 20px -5px rgba(6, 182, 212, 0.3)',
        'glow-brand': '0 0 35px -5px rgba(6, 182, 212, 0.45)',
        'glow-gold': '0 0 40px -8px rgba(6, 182, 212, 0.5)',
        'depth': '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px -10px rgba(6, 182, 212, 0.08)',
        'depth-lg': '0 35px 80px -15px rgba(0, 0, 0, 0.9), 0 0 50px -10px rgba(6, 182, 212, 0.12)',
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
