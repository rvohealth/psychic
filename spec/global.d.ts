declare global {
  function context(description: string, callback: () => void): void
  const suite: (typeof import('vitest'))['suite']
  const test: (typeof import('vitest'))['test']
  const describe: (typeof import('vitest'))['describe']
  // const context: (typeof import('vitest'))['describe']
  const it: (typeof import('vitest'))['it']
  const expectTypeOf: (typeof import('vitest'))['expectTypeOf']
  const assertType: (typeof import('vitest'))['assertType']
  const expect: (typeof import('vitest'))['expect']
  const assert: (typeof import('vitest'))['assert']
  const vitest: (typeof import('vitest'))['vitest']
  const vi: (typeof import('vitest'))['vitest']
  const beforeAll: (typeof import('vitest'))['beforeAll']
  const afterAll: (typeof import('vitest'))['afterAll']
  const beforeEach: (typeof import('vitest'))['beforeEach']
  const afterEach: (typeof import('vitest'))['afterEach']
  const onTestFailed: (typeof import('vitest'))['onTestFailed']
  const onTestFinished: (typeof import('vitest'))['onTestFinished']
}

interface CustomMatcherResult {
  pass: boolean
  message: (actual?: unknown) => string
}

declare module 'vitest' {
  interface ExpectStatic {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toMatchDreamModel(expected: any): CustomMatcherResult
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toMatchDreamModels(expected: any): CustomMatcherResult
    toBeWithin(precision: number, expected: number): CustomMatcherResult
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toEqualCalendarDate(expected: any): CustomMatcherResult
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toMatchBidiText(expected: any): Promise<CustomMatcherResult>
  }

  interface Assertion {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toMatchDreamModel(expected: any): CustomMatcherResult
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toMatchDreamModels(expected: any): CustomMatcherResult
    toBeWithin(precision: number, expected: number): CustomMatcherResult
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toEqualCalendarDate(expected: any): CustomMatcherResult
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toMatchBidiText(expected: any): Promise<CustomMatcherResult>
  }
}

export {}
