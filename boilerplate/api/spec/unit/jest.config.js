/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  setupFilesAfterEnv: ['<rootDir>setup/hooks.ts', 'luxon-jest-matchers'],
  globalSetup: '<rootDir>setup/beforeAll.ts',
  globalTeardown: '<rootDir>setup/afterAll.ts',
  workerIdleMemoryLimit: '1024MB',
}
