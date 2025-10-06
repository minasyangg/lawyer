/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        'primary': 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'accent-gold': '#FFD700',
        'accent-blue': '#007BFF',
        'bg-main': '#FFFFFF',
        'bg-secondary': '#F8F9FA',
        'bg-card': '#FFFFFF',
        'border': '#E9ECEF',
        'text-main': '#212529',
        'text-secondary': '#6C757D',
      },
      fontFamily: {
        main: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
        heading: ['Montserrat', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'button': '0 2px 16px 0 rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'xl': '1rem',
        'lg': '0.5rem',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(180deg, rgba(4, 38, 161, 0.4) 0%, rgba(11, 28, 72, 0.6) 100%)',
        'gradient-primary': 'linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        'gradient-horizontal': 'linear-gradient(90deg, rgba(4, 38, 161, 1) 0%, rgba(0, 39, 179, 1) 100%)',
      },
    },
  },
  // safelist: [
  //   'bg-gradient-hero',
  // ],
  plugins: [],
}
