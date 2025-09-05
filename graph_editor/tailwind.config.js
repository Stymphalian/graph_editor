/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Graph editor specific colors
        'graph-node': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Primary node color
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'graph-edge': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280', // Primary edge color
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        'graph-selected': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Selected element color
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        'graph-hover': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Hover state color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      fontFamily: {
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        graph:
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'graph-lg':
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        graph: '0.5rem',
      },
    },
  },
  plugins: [
    // Custom plugin for graph editor utilities
    function ({ addUtilities }) {
      const newUtilities = {
        '.graph-container': {
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        },
        '.graph-svg': {
          width: '100%',
          height: '100%',
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
        },
        '.graph-node': {
          cursor: 'pointer',
          'user-select': 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            'stroke-width': '3px',
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
          },
        },
        '.graph-node-selected': {
          stroke: '#ef4444',
          'stroke-width': '3px',
          filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))',
        },
        '.graph-edge': {
          stroke: '#6b7280',
          'stroke-width': '2px',
          fill: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            stroke: '#0ea5e9',
            'stroke-width': '3px',
          },
        },
        '.graph-edge-selected': {
          stroke: '#ef4444',
          'stroke-width': '3px',
        },
        '.graph-label': {
          'font-family': 'Arial, sans-serif',
          'text-anchor': 'middle',
          'pointer-events': 'none',
          'user-select': 'none',
        },
        '.graph-controls': {
          background: 'rgba(255, 255, 255, 0.95)',
          'backdrop-filter': 'blur(8px)',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          'border-radius': '0.5rem',
          'box-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
