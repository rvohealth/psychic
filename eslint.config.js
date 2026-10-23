// @ts-check

import eslint from '@eslint/js'
import typescriptEslint from 'typescript-eslint'
import typescriptParser from '@typescript-eslint/parser'

const config = typescriptEslint.config(
  eslint.configs.recommended,
  typescriptEslint.configs.recommendedTypeChecked,

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
      'test-app/client/src/api/openapi.ts',
      'boilerplate/**/*',
      'spec-boilerplate/**/*',
      '.npmrc',
    ],
  },

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { project: './tsconfig.json' },
    },
  },

  // typescript and openapi-typescript are devDependencies (openapi-typescript
  // also an optional peer), so a production install does not have them, and an
  // app imports @rvoh/psychic/system in production (e.g. for I18nProvider).
  // Only the files that build type files may import them, and nothing may
  // statically import those files: PsychicBin loads each with a dynamic
  // import() from a method production never runs, so no package export reaches
  // typescript or openapi-typescript through its static import graph.
  {
    files: ['src/**/*.ts'],
    ignores: ['src/cli/helpers/AST*.ts', 'src/bin/helpers/syncOpenapiTypescriptFiles.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'typescript',
              message:
                'Only the type file builders (src/cli/helpers/AST*.ts, src/bin/helpers/syncOpenapiTypescriptFiles.ts) may import typescript.',
              allowTypeImports: true,
            },
            {
              name: 'openapi-typescript',
              message: 'Only src/bin/helpers/syncOpenapiTypescriptFiles.ts may import openapi-typescript.',
              allowTypeImports: true,
            },
          ],
          patterns: [
            {
              group: ['**/AST*', '**/syncOpenapiTypescriptFiles*'],
              caseSensitive: true,
              message:
                'The type file builders import typescript and openapi-typescript; load them with a dynamic import().',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
)
export default config
