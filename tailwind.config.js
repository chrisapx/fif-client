/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {
        animation: {
        loaderSlide: 'loaderSlide 2s linear infinite',
      },
      keyframes: {
        loaderSlide: {
          '0%': {
            left: '0%',
            transform: 'translateX(-100%)',
          },
          '100%': {
            left: '100%',
            transform: 'translateX(0%)',
          },
        },
      },
        colors: {
          primary: "#115DA9", // 👈 your custom color
          // You can also add shades
          brand: {
            light: "#6BB9F0",
            DEFAULT: "#115DA9",
            dark: "#0B3C6E",
          },
        },
      },
    },
    plugins: [],
  }
  