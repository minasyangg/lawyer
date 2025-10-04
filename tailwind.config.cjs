/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        'bg-start': 'var(--color-bg-gradient-start)',
        'bg-end': 'var(--color-bg-gradient-end)'
      },
      fontFamily: {
        sans: ['var(--font-sans)']
      },
      fontSize: {
        '4xl': 'var(--text-32)',
        '5xl': 'var(--text-48)',
        '6xl': 'var(--text-64)'
      }
    }
  },
  plugins: [],
}
