/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          navy: "#0A2140",
          gold: "#F2A602",
        },
      },
    },
  },
  plugins: [],
};
