/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}', // Include pages directory
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors if needed
        dark: {
          background: '#0b1120',
          card: '#1e293b',
          text: '#ffffff',
          secondary: '#94a3b8',
          border: '#334155',
        },
        light: {
          background: '#f3f4f6',
          card: '#ffffff',
          text: '#1f2937',
          secondary: '#4b5563',
          border: '#e5e7eb',
        },
      },
    },
  },
  plugins: [],
};