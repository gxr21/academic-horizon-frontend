/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // الألوان اللي ذكرتها بتقريرك يا علي
        'academic-blue': '#1A5276', 
        'academic-blue-dark': '#154360',
        'academic-gold': '#E9C176',
        'academic-sky-dark': '#85E2E2',
        'academic-gray-light': '#F5F5F5',
        'academic-gray-dark': '#D5D5D5',
        'academic-sky': '#76D2D2',
      },
      fontFamily: {
        // دعم الخطوط العربية اللي فضلتها
        'tajawal': ['Tajawal', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}