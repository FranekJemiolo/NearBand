/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        radio: {
          dark: '#0a0a0c',
          card: '#121318',
          amber: '#ffb000',
          amberGlow: '#ffb00033',
          green: '#00ff66',
          cyan: '#00e5ff',
          squelch: '#ff3344',
        },
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
};
