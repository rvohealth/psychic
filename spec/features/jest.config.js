/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  bail: process.env.CI === '1',
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
  preset: 'jest-playwright-preset',
  testEnvironment: './setup/CustomPlaywrightEnvironment.js',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  setupFilesAfterEnv: ['expect-playwright', '<rootDir>/setup/hooks.ts'],

  // this prevents ts-jest's well known memory leak issues from causing heap allocation
  // errors, since the tests for this project are starting to bring our large CI
  // instances to their knees with heap allocation errors.
  workerIdleMemoryLimit: '1024MB',
}
