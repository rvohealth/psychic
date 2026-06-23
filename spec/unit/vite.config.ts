import '../../test-app/src/conf/global.js'

import path from 'node:path'
import { defineConfig } from 'vitest/config'

const maxWorkers = parseInt(process.env.PSYCHIC_UNIT_MAX_WORKERS || process.env.DREAM_PARALLEL_TESTS || '1')

export default defineConfig({
  resolve: {
    alias: {
      '@rvoh/psychic/system': path.resolve('./src/package-exports/system.ts'),
      '@rvoh/psychic/errors': path.resolve('./src/package-exports/errors.ts'),
      '@rvoh/psychic/openapi': path.resolve('./src/package-exports/openapi.ts'),
      '@rvoh/psychic/types': path.resolve('./src/package-exports/types.ts'),
      '@rvoh/psychic/utils': path.resolve('./src/package-exports/utils.ts'),
      '@rvoh/psychic': path.resolve('./src/package-exports/index.ts'),
    },
  },
  test: {
    dir: './spec/unit',
    globals: true,
    setupFiles: ['luxon-jest-matchers', './spec/unit/setup/hooks.js'],
    fileParallelism: true,
    maxConcurrency: maxWorkers,
    maxWorkers,
    mockReset: true,
    watch: false,

    globalSetup: './spec/unit/setup/globalSetup.js',
  },
})
