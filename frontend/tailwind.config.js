/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626'
        },
        warning: {
          DEFAULT: '#f59e0b',
          dark: '#d97706'
        },
        success: {
          DEFAULT: '#10b981',
          dark: '#059669'
        },
        accent: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb'
        }
      }
    },
  },
  plugins: [],
}
