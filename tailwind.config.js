/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#ff6a00',
        'primary-50': '#fff5eb',
        'primary-100': '#ffe8d6',
        'primary-200': '#ffd1ad',
        'primary-300': '#ffb584',
        'primary-400': '#ff8f42',
        'primary-500': '#ff6a00',
        'primary-600': '#cc5500',
        'primary-700': '#994000',
        'primary-800': '#662b00',
        'primary-900': '#331500',
      },
      screens: {
        'card': '1250px',
        'desktop': '1620px',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        }
      },
      animation: {
        'slide-in': 'slide-in 0.2s ease-out'
      }
    }
  },
  plugins: [],
}