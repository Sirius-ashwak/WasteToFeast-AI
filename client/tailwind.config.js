module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          ...colors.green
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}