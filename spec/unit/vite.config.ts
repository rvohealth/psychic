import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    dir: './spec/unit',
    globals: true,
    setupFiles: ['luxon-jest-matchers', './spec/unit/setup/hooks.ts'],
    maxConcurrency: 1,
    maxWorkers: 1,
    minWorkers: 1,
    mockReset: true,
    watch: false,

    globalSetup: './spec/unit/setup/globalSetup.ts',
  },
})
