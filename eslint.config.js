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

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { project: './tsconfig.json' },
    },
  },
)
export default config
