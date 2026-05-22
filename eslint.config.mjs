import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import-x';
import promise from 'eslint-plugin-promise';
import globals from 'globals';

export default tseslint.config(
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      'node_modules/**',
      'release/**',
      'out/**',
      '.erb/**',
      '**/*.css.d.ts',
      '**/*.scss.d.ts',
    ],
  },

  // Base JS recommended
  js.configs.recommended,

  // TypeScript recommended (no type checking — fast)
  ...tseslint.configs.recommended,

  // Main config block
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      import: importPlugin,
      promise,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import-x/resolver': {
        node: true,
      },
    },
    rules: {
      // React hooks — only classic rules (v7 added React Compiler rules we don't use)
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript overrides
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',

      // Whitespace — cosmetic, not a bug
      'no-irregular-whitespace': 'warn',

      // Import
      'import/no-extraneous-dependencies': 'off',
      'import/prefer-default-export': 'off',

      // Promise (relaxed — nesting and callbacks are common in Electron main process)
      ...promise.configs.recommended.rules,
      'promise/always-return': 'off',
      'promise/catch-or-return': 'off',
      'promise/no-nesting': 'off',
      'promise/no-promise-in-callback': 'off',

      // General
      // warn (not error) on widespread existing patterns — fix gradually
      'no-param-reassign': ['warn', { props: false }],
      'no-case-declarations': 'warn',
      'no-redeclare': 'warn',
      'no-console': 'off',
      'no-underscore-dangle': 'off',
      'class-methods-use-this': 'off',
      'no-restricted-syntax': 'off',
      'no-await-in-loop': 'off',
    },
  },
);
