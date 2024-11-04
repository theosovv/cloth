import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginHooks from 'eslint-plugin-react-hooks';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import pluginUnused from 'eslint-plugin-unused-imports';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': pluginHooks,
      prettier: pluginPrettier,
      'unused-imports': pluginUnused,
    },
    rules: {
      'prettier/prettier': 'warn',
      // Best Practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-unused-vars': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',

      // Style
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'comma-dangle': ['error', 'always-multiline'],
      'max-len': ['warn', { code: 80, tabWidth: 2, ignoreUrls: true }],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 0 }],
      'no-mixed-spaces-and-tabs': 'error',
      'space-before-blocks': 'error',
      'keyword-spacing': ['error', { before: true, after: true }],
      'object-curly-spacing': ['error', 'always'],

      // React
      'react/prop-types': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/jsx-no-undef': 'error',
      'react/jsx-indent': ['error', 2],
      'react/jsx-max-props-per-line': ['warn', { maximum: 1 }],

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'no-unused-expressions': 'warn',
      'no-unused-labels': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  configPrettier,
];
