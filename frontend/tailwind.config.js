/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors - cinematic and premium
        background: {
          DEFAULT: '#0a0a0f',
          secondary: '#12121a',
          tertiary: '#1a1a24',
          elevated: '#22222e',
        },
        surface: {
          DEFAULT: '#16161f',
          hover: '#1e1e28',
          active: '#262632',
          border: '#2a2a3a',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          muted: '#4f46e5',
          subtle: 'rgba(99, 102, 241, 0.1)',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
          tertiary: '#64748b',
          muted: '#475569',
        },
        success: {
          DEFAULT: '#10b981',
          muted: 'rgba(16, 185, 129, 0.1)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          muted: 'rgba(245, 158, 11, 0.1)',
        },
        error: {
          DEFAULT: '#ef4444',
          muted: 'rgba(239, 68, 68, 0.1)',
        },
        // Writing mode colors
        mode: {
          aiLead: '#8b5cf6',
          userLead: '#06b6d4',
          coAuthor: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'editor': ['1.125rem', { lineHeight: '1.8' }],
      },
      spacing: {
        'sidebar': '280px',
        'panel': '320px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.2)',
        'elevated': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'card': '0 2px 10px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'typing': 'typing 1s steps(3) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        typing: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#f8fafc',
            a: {
              color: '#6366f1',
              '&:hover': {
                color: '#818cf8',
              },
            },
            h1: { color: '#f8fafc' },
            h2: { color: '#f8fafc' },
            h3: { color: '#f8fafc' },
            h4: { color: '#f8fafc' },
            strong: { color: '#f8fafc' },
            code: { color: '#e2e8f0' },
            blockquote: {
              color: '#94a3b8',
              borderLeftColor: '#6366f1',
            },
          },
        },
      },
    },
  },
  plugins: [],
};
