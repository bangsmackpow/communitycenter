/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        prairie: {
          50: '#f8faf6',
          100: '#eef3eb',
          200: '#dce6d7',
          300: '#bfd2b7',
          400: '#9bb890',
          500: '#7a9e6e',
          600: '#5e8053',
          700: '#4a6542',
          800: '#3d5237',
          900: '#344430',
        },
        slate: {
          850: '#172033',
        }
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    },
  },
  plugins: [],
}
