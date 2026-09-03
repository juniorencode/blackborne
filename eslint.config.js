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
