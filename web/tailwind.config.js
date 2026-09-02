/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#090b16',
        panel: '#11162a',
        line: '#293153',
        signal: '#fa4f8b',
        arcade: '#fa4f8b'
      },
      fontFamily: {
        rd: ['RD Chulajaruek', 'serif']
      }
    }
  },
  plugins: []
};
