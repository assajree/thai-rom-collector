/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false
  },
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-text)',
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
