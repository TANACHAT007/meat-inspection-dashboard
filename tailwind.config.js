/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: { extend: {
    colors: {
      primary: { 50: '#fff1f2', 100: '#ffe0e3', 200: '#ffc2c8', 300: '#ff97a1', 400: '#f2606f', 500: '#c2303f', 600: '#a32230', 700: '#821b27', 800: '#6a1822', 900: '#55161e' },
      leaf: { 400: '#4ade80', 500: '#1a9a6b', 600: '#147a54', 700: '#0f5f42' },
      amber2: { 500: '#d98a0b' },
      surface: '#fbf7f6', ink: { 700: '#2a1b1e', 800: '#201417', 900: '#171012' },
    },
    fontFamily: { sans: ['Prompt', 'system-ui', 'sans-serif'] },
    boxShadow: { soft: '0 6px 24px -8px rgba(60,20,28,.2)' },
  } },
  plugins: [],
}
