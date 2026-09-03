import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/storybook-static/**'
    ]
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---------------------------------------------------------------------
  // Library source. Everything the package ships is linted here.
  // ---------------------------------------------------------------------
  {
    files: ['packages/*/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // The public surface is the API. An implicit `any` in it is a hole.
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // -----------------------------------------------------------------
      // The project's own rules live here.
      //
      // Doc 10 turns the foundations into lint: a rule that is only written
      // down gets respected for a few weeks and then yields to the first
      // deadline. These are enforcement, not style:
      //
      //   - no literal colors, no primitive tokens inside a component
      //   - no physical directions (left/right) — always start/end
      //   - no literal user-facing strings, accessibility labels included
      //   - no viewport breakpoints outside portal components
      //   - no imports into another component's internal path
      //   - no access to document, localStorage or globals
      //   - no generic element with a click handler acting as a button
      //
      // They are written in phase F6, alongside the first component, so each
      // rule is built against real code instead of a hypothetical.
      // -----------------------------------------------------------------
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message:
            'The library keeps no global state (principle P3). State enters through props or the config provider.'
        },
        {
          name: 'sessionStorage',
          message:
            'The library keeps no global state (principle P3). State enters through props or the config provider.'
        }
      ]
    }
  },

  // ---------------------------------------------------------------------
  // Config files at the root run in Node, not in the browser.
  // ---------------------------------------------------------------------
  {
    files: ['*.{js,mjs,ts}', '.storybook/**/*.{js,ts}'],
    languageOptions: {
      globals: globals.node
    }
  }
);
