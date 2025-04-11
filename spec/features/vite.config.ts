import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    dir: './spec/features',
    globals: true,
    setupFiles: ['luxon-jest-matchers', './spec/features/setup/hooks.js'],
    fileParallelism: false,
    maxConcurrency: 1,
    maxWorkers: 1,
    minWorkers: 1,
    mockReset: true,
    watch: false,
    printConsoleTrace: true,

    globalSetup: './spec/features/setup/globalSetup.js',
  },
})
