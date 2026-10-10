import ApplicationController from './ApplicationController.js'

/**
 * Used by spec/unit/controller/cookies.spec.ts to read the Set-Cookie header
 * that setCookie produces for a given `expires` and `maxAge`.
 */
export default class CookiesTestController extends ApplicationController {
  public setTestCookie() {
    const expires = this.castParam('expires', 'string', { allowNull: true })
    const maxAgeDays = this.castParam('maxAgeDays', 'integer', { allowNull: true })

    this.setCookie('test_cookie', 'chocolate chip', {
      ...(expires ? { expires: new Date(expires) } : {}),
      ...(maxAgeDays ? { maxAge: { days: maxAgeDays } } : {}),
    })
    this.noContent()
  }
}
