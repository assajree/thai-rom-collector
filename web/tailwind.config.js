/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-black)',
        panel: 'var(--color-surface)',
        line: 'var(--color-border)',
        signal: 'var(--color-brand)',
        arcade: 'var(--color-brand)'
      },
      fontFamily: {
        rd: ['RD Chulajaruek', 'serif']
      }
    }
  },
  plugins: []
};
