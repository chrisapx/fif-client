/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
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
          primary: "#1a8ca5", // Teal primary color
          // You can also add shades
          brand: {
            light: "#5ab3ca",
            DEFAULT: "#1a8ca5",
            dark: "#044f5f",
          },
        },
      },
    },
    plugins: [],
  }
  