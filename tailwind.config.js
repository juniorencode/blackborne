/** @type {import('tailwindcss').Config} */
import BlackBornePlugins from './lib/plugins';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {}
  },
  plugins: [BlackBornePlugins]
};
