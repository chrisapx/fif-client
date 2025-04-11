/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {
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
  