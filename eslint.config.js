import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import {
  restrictedGlobals,
  restrictedImports,
  restrictedSyntax
} from './eslint.rules.js';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/storybook-static/**',
      // Written by the Docker container's pnpm install; a cache, not source.
      '.pnpm-store/**',
      // Generated from @radix-ui/colors; regenerate rather than edit.
      'packages/*/src/styles/primitives.css'
    ]
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---------------------------------------------------------------------
  // Shipped library source. Everything in the package obeys the
  // foundations, and this block is what makes that true rather than hoped.
  // ---------------------------------------------------------------------
  {
    files: ['packages/*/src/**/*.{ts,tsx}'],
    ignores: ['**/*.stories.tsx', '**/*.test.{ts,tsx}'],
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

      // The project's own rules. See eslint.rules.js for why each exists.
      'no-restricted-syntax': ['error', ...restrictedSyntax],
      'no-restricted-globals': ['error', ...restrictedGlobals],
      'no-restricted-imports': ['error', restrictedImports]
    }
  },

  // ---------------------------------------------------------------------
  // THE ONE FILE ALLOWED TO ASK THE WINDOW A QUESTION.
  //
  // Doc 04 §5 grants the viewport exception to components rendered in a
  // portal, whose real container IS the window, and `DateRangePicker` is the
  // one that needs it in JavaScript rather than in CSS: how many months its
  // calendar builds is a prop of the base's state, and a container query
  // collapses inside a content-sized layer (§4.3).
  //
  // Scoped to one file on purpose. The alternative was every portalled
  // component reaching for `matchMedia` on its own authority, which is how a
  // documented exception becomes an undocumented habit.
  // ---------------------------------------------------------------------
  {
    files: ['packages/*/src/internal/useWindowFits.ts'],
    rules: {
      /*
       * NOT `'off'`. This file is allowed TWO questions, not all of them.
       *
       * It was a blanket off-switch, which meant the exception grew every time
       * the list did — and the list grew on 2026-09-11 by five network globals
       * and five window aliases, so `fetch` would have been legal here alone.
       * An exception that widens with the rule it excepts is not an exception.
       */
      'no-restricted-globals': [
        'error',
        ...restrictedGlobals.filter(
          rule => rule.name !== 'window' && rule.name !== 'matchMedia'
        )
      ]
    }
  },

  // ---------------------------------------------------------------------
  // Stories and tests. Not published, so the content rules do not apply:
  // their literal strings and sample colours are the point. The
  // accessibility and hook rules still do.
  // ---------------------------------------------------------------------
  {
    files: [
      'packages/*/src/**/*.{stories,test}.{ts,tsx}',
      'apps/**/*.{ts,tsx}'
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules
    }
  },

  // ---------------------------------------------------------------------
  // Config files and scripts run in Node, not in the browser.
  // ---------------------------------------------------------------------
  {
    files: [
      '*.{js,mjs,ts}',
      '**/*.config.{js,mjs,ts}',
      '**/scripts/**/*.mjs',
      '.storybook/**/*.{js,ts}'
    ],
    languageOptions: { globals: globals.node }
  }
);
