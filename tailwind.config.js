/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Tavern aesthetic palette — warm ambers, dark browns, parchment
      colors: {
        parchment: {
          50:  '#fdf8ed',
          100: '#f8edd0',
          200: '#f0d9a0',
          300: '#e5bf6a',
          400: '#d9a43e',
          500: '#c98a28',
          600: '#a86d1f',
          700: '#85521c',
          800: '#6b421d',
          900: '#59361c',
        },
        tavern: {
          dark:   '#1a1208',
          brown:  '#3d2b1a',
          wood:   '#6b4423',
          amber:  '#c98a28',
          gold:   '#d4af37',
          cream:  '#f5e6c8',
        },
      },
      fontFamily: {
        serif:  ['"Palatino Linotype"', 'Palatino', 'Georgia', 'serif'],
        sans:   ['system-ui', 'sans-serif'],
        // Notice board fonts
        cinzel:  ['"Cinzel Decorative"', 'serif'],
        fell:    ['"IM Fell English"', 'Georgia', 'serif'],
        pixel:    ['"Pixelify Sans"', 'sans-serif'],
        brush:    ['"Alex Brush"', 'cursive'],
        jacquard: ['"Jacquard12"', 'serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        flicker: {
          '0%, 100%': { opacity: '0.85' },
          '30%':      { opacity: '1'    },
          '60%':      { opacity: '0.78' },
          '80%':      { opacity: '0.95' },
        },
        // Star twinkle — varies opacity and scale subtly
        twinkle: {
          '0%, 100%': { opacity: '0.2',  transform: 'scale(0.9)' },
          '50%':      { opacity: '1',    transform: 'scale(1.2)' },
        },
        // Quote drift — floats gently upward while fading in and out
        drift: {
          '0%':   { opacity: '0',   transform: 'translateX(-50%) translateY(8px)'  },
          '15%':  { opacity: '0.9', transform: 'translateX(-50%) translateY(0px)'  },
          '80%':  { opacity: '0.7', transform: 'translateX(-50%) translateY(-6px)' },
          '100%': { opacity: '0',   transform: 'translateX(-50%) translateY(-12px)' },
        },
      },
      animation: {
        float:   'float 5s ease-in-out infinite',
        flicker: 'flicker 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
