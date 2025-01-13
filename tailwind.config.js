/** @type {import('tailwindcss').Config} */
import undefinedPlugins from './lib/plugins';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {}
  },
  plugins: [undefinedPlugins]
};
