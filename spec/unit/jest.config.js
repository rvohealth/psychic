/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  setupFiles: [],
  setupFilesAfterEnv: ['<rootDir>setup/hooks.ts'],
  globalSetup: '<rootDir>setup/beforeAll.ts',
  globalTeardown: '<rootDir>setup/afterAll.ts',
}
