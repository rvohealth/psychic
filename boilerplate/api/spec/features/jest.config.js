/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  bail: process.env.CI === '1',
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
  preset: 'jest-playwright-preset',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  transformIgnorePatterns: ['<rootDir>/node_modules/dream/src'],
  setupFilesAfterEnv: ['expect-playwright', '<rootDir>/setup/hooks.ts'],
}
