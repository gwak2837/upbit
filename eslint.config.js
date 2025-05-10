// @ts-check

import js from '@eslint/js'
import json from '@eslint/json'
import eslintConfigPrettier from 'eslint-config-prettier'
import perfectionist from 'eslint-plugin-perfectionist'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  { files: ['**/*.{js,mjs,ts}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.{js,mjs,ts}'], languageOptions: { globals: globals.node } },
  // @ts-expect-error 그냥 오류
  tseslint.configs.recommended,
  { files: ['**/*.jsonc'], language: 'json/jsonc', plugins: { json }, extends: ['json/recommended'] },
  { files: ['**/*.json5'], language: 'json/json5', plugins: { json }, extends: ['json/recommended'] },
  perfectionist.configs['recommended-natural'],
  { ignores: ['out'] },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      'perfectionist/sort-enums': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-union-types': ['error', { groups: ['keyword', 'literal', 'named'] }],
    },
  },
  eslintConfigPrettier,
])
