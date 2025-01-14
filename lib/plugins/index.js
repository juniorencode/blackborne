import plugin from 'tailwindcss/plugin';

export default plugin(
  function ({ addBase, addUtilities }) {
    addBase({
      ':root': {
        '--primary-50': '239 246 255',
        '--primary-100': '219 234 254',
        '--primary-200': '191 219 254',
        '--primary-300': '147 197 253',
        '--primary-400': '96 165 250',
        '--primary-500': '59 130 246',
        '--primary-600': '37 99 235',
        '--primary-700': '29 78 216',
        '--primary-800': '30 64 175',
        '--primary-900': '30 58 138',
        '--primary-950': '23 36 86',

        '--secondary-50': '250 250 250',
        '--secondary-100': '245 245 245',
        '--secondary-200': '229 229 229',
        '--secondary-300': '212 212 212',
        '--secondary-400': '163 163 163',
        '--secondary-500': '115 115 115',
        '--secondary-600': '82 82 82',
        '--secondary-700': '64 64 64',
        '--secondary-800': '38 38 38',
        '--secondary-900': '23 23 23',
        '--secondary-950': '10 10 10'
      }
    });

    addBase({
      '::-webkit-scrollbar': {
        width: '4px',
        height: '4px',
        backgroundColor: 'transparent'
      },
      '::-webkit-scrollbar-track': {
        backgroundColor: 'transparent'
      },
      '::-webkit-scrollbar-thumb': {
        background: '#999',
        borderRadius: '2px'
      },
      '::-webkit-scrollbar-thumb:hover': {
        background: '#666'
      },
      'input[type="number"]': {
        appearance: 'textfield',
        '-moz-appearance': 'textfield'
      },
      'input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button':
        {
          '-webkit-appearance': 'none',
          appearance: 'none',
          margin: '0'
        },
      'input[type="checkbox"]': {
        appearance: 'none'
      },
      'input[type="checkbox"]:checked': {
        backgroundImage:
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 12'%3E%3Cpath stroke='%23fff' strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M1 5.917 5.724 10.5 15 1.5'/%3E%3C/svg%3E\")",
        backgroundPosition: '50%',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1em 1em'
      }
    });

    addUtilities({
      '.scroll-hide::-webkit-scrollbar': {
        display: 'none'
      },
      '.shadow-top': {
        boxShadow: '0 -16px 60px 2px var(--tw-shadow-color, rgba(0, 0, 0, 0.4))'
      },
      '.shadow-left': {
        boxShadow: '-16px 0 60px 2px var(--tw-shadow-color, rgba(0, 0, 0, 0.4))'
      },
      '.shadow-right': {
        boxShadow: '16px 0 60px 2px var(--tw-shadow-color, rgba(0, 0, 0, 0.4))'
      },
      '.shadow-bottom': {
        boxShadow: '0 16px 60px 2px var(--tw-shadow-color, rgba(0, 0, 0, 0.4))'
      },
      '.border-special': {
        border: 'solid',
        borderImageSlice: '1',
        borderWidth: '16px',
        borderImageSource:
          'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, var(--tw-border-opacity)) 2%)',
        borderTopWidth: '0',
        borderRightWidth: '0',
        borderBottomWidth: '0'
      }
    });
  },
  {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: 'rgb(var(--primary-500) / <alpha-value>)',
            50: 'rgb(var(--primary-50) / <alpha-value>)',
            100: 'rgb(var(--primary-100) / <alpha-value>)',
            200: 'rgb(var(--primary-200) / <alpha-value>)',
            300: 'rgb(var(--primary-300) / <alpha-value>)',
            400: 'rgb(var(--primary-400) / <alpha-value>)',
            500: 'rgb(var(--primary-500) / <alpha-value>)',
            600: 'rgb(var(--primary-600) / <alpha-value>)',
            700: 'rgb(var(--primary-700) / <alpha-value>)',
            800: 'rgb(var(--primary-800) / <alpha-value>)',
            900: 'rgb(var(--primary-900) / <alpha-value>)',
            950: 'rgb(var(--primary-950) / <alpha-value>)'
          },
          secondary: {
            DEFAULT: 'rgb(var(--secondary-500) / <alpha-value>)',
            50: 'rgb(var(--secondary-50) / <alpha-value>)',
            100: 'rgb(var(--secondary-100) / <alpha-value>)',
            200: 'rgb(var(--secondary-200) / <alpha-value>)',
            300: 'rgb(var(--secondary-300) / <alpha-value>)',
            400: 'rgb(var(--secondary-400) / <alpha-value>)',
            500: 'rgb(var(--secondary-500) / <alpha-value>)',
            600: 'rgb(var(--secondary-600) / <alpha-value>)',
            700: 'rgb(var(--secondary-700) / <alpha-value>)',
            800: 'rgb(var(--secondary-800) / <alpha-value>)',
            900: 'rgb(var(--secondary-900) / <alpha-value>)',
            950: 'rgb(var(--secondary-950) / <alpha-value>)'
          }
        }
      }
    }
  }
);
