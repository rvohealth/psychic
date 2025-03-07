// @ts-check

import eslint from '@eslint/js'
import typescriptEslint from 'typescript-eslint'
import typescriptParser from '@typescript-eslint/parser'

const config = typescriptEslint.config(
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommendedTypeChecked,
  {
    ignores: [
      'docs/**/*',
      'test-app/types/psychic.ts',
      'test-app/types/dream.ts',
      'test-app/types/db.ts',

      'spec/support/generators/**/*',
      'spec/tmp/**/*',
      'test-app/client/apiRoutes.ts',
      'test-app/client/schema.ts',
      'boilerplate/**/*',
      'spec-boilerplate/**/*',
      '.yarn/**/*',
      '.yarnrc.yml',
    ],
  },

  // {
  //   rules: {
  //     'no-unexpected-multiline': 'off',
  //     // '@typescript-eslint/no-explicit-any': 'off',
  //     // '@typescript-eslint/no-unsafe-assignment': 'off',
  //     // '@typescript-eslint/no-unsafe-member-access': 'off',
  //     // '@typescript-eslint/no-unsafe-return': 'off',
  //     // '@typescript-eslint/no-unsafe-argument': 'off',
  //     '@typescript-eslint/no-unsafe-call': 'off',
  //     // '@typescript-eslint/no-this-alias': 'off',
  //   },
  // },
  //
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { project: './tsconfig.json' },
    },
  },
)
export default config
