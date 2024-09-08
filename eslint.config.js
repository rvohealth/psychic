// @ts-check

const eslint = require('@eslint/js')
const typescriptEslint = require('typescript-eslint')
const typescriptParser = require('@typescript-eslint/parser')

const config = typescriptEslint.config(
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommendedTypeChecked,

  {
    ignores: [
      'spec/support/routes',
      'spec/tmp/**/*',
      'test-app/src/db/schema.ts',
      'test-app/src/db/sync.ts',
      'test-app/client/apiRoutes.ts',
      'test-app/client/schema.ts',
      'boilerplate/**/*',
      'spec-boilerplate/**/*',
      '.yarn/**/*',
      '.yarnrc.yml',
      '.global-cli-dist/*',
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
module.exports = config
