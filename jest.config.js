/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        babelConfig: true,
        tsconfig: {
          module: 'commonjs',
        },
      },
    ],
  },
  setupFiles: [],
  setupFilesAfterEnv: ['<rootDir>spec/setup/hooks.ts'],
  globalSetup: '<rootDir>spec/setup/beforeAll.ts',
  globalTeardown: '<rootDir>spec/setup/afterAll.ts',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
}
