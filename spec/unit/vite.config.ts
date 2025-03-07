import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    dir: './spec/unit',
    globals: true,
    setupFiles: ['luxon-jest-matchers', './spec/unit/setup/beforeAll.ts', './spec/unit/setup/hooks.ts'],
    maxConcurrency: 1,
    maxWorkers: 1,
    minWorkers: 1,
    mockReset: true,
    watch: false,
  },

  server: {
    watch: {
      ignored: [
        '../../test-app/src/types/psychic.ts',
        '../../test-app/src/types/dream.ts',
        '../../test-app/src/types/db.ts',
        'test-app/src/types/psychic.ts',
        'test-app/src/types/dream.ts',
        'test-app/src/types/db.ts',
      ],
    },
  },
})
