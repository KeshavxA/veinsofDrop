/**@type {import('tailwindcss').Config}*/ 
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg': '#e6fffb',
        'accent': '#adc3c3',
        'muted': '#9ab3b3',
        'light': '#ffffff',
        'primary': '#db2b2b',
        'secondary': '#fce5e5',
        'dusk': '#470217',
        'ash': '#244141',
        'blush': '#ffe3e3',
        'charcoal': '#142323',
        'mist': '#f2fbfb',
        'glow': '#ffe5e5',
      }
    },
  },
  plugins: [],
}

