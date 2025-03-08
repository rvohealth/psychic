import { Page } from 'puppeteer'
import isBidiPage from './helpers/isBidiPage'
import getAllTextContentFromPage from './helpers/getAllTextContentFromPage'

expect.extend({
  async toMatchBidiText(received: any, expected: string) {
    if (isBidiPage(received)) {
      received = await getAllTextContentFromPage(received as Page)
    }

    const pass = received === expected || received.includes(expected)

    if (pass) {
      return {
        message: () => `Expected ${received} not to match bidirectional text ${expected}`,
        pass: true,
      }
    } else {
      return {
        message: () => `Expected ${received} to match bidirectional text ${expected}`,
        pass: false,
      }
    }
  },
})

export default {}
