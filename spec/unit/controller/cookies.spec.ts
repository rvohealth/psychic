import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicController from '../../../src/controller/index.js'
import InternalEncrypt from '../../../src/encrypt/internal-encrypt.js'
import { PsychicServer } from '../../../src/package-exports/index.js'
import User from '../../../test-app/src/app/models/User.js'
import { createMockKoaContext } from './helpers/mockRequest.js'

const ONE_DAY = 24 * 60 * 60 * 1000

describe('PsychicController', () => {
  describe('#getCookie', () => {
    it('returns the value of an existing cookie, automatically decrypted', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'password' })

      const ctx = createMockKoaContext({
        cookies: { auth_token: InternalEncrypt.encryptCookie(user.id.toString()) },
      })
      const controller = new PsychicController(ctx, { action: 'hello' })
      expect(controller.getCookie('auth_token')).toEqual(user.id.toString())
    })
  })

  describe('#setCookie', () => {
    it('calls to underlying session instance, passing options along', () => {
      const ctx = createMockKoaContext()
      const controller = new PsychicController(ctx, { action: 'hello' })

      const spy = vi.spyOn(controller.session, 'setCookie')
      controller.setCookie('auth_token', 'abc', { secure: true, maxAge: { days: 4 } })
      expect(spy).toHaveBeenCalledWith('auth_token', 'abc', { secure: true, maxAge: { days: 4 } })
    })

    // These send a real request, so the cookies library that writes the
    // Set-Cookie header runs too. It never sends Max-Age: it turns a maxAge
    // into the expires attribute, replacing any expires passed with it.
    context('the expiry in the Set-Cookie header', () => {
      beforeEach(async () => {
        await request.init(PsychicServer)
      })

      it('is the expires passed', async () => {
        const expires = toWholeSecond(Date.now() + 10 * ONE_DAY)
        const { expiry } = await testCookieExpiry({ expires: expires.toISOString() })
        expect(expiry).toEqual(expires)
      })

      it('is the expires passed when it is in the past, which deletes the cookie', async () => {
        const expires = toWholeSecond(Date.now() - ONE_DAY)
        const { expiry } = await testCookieExpiry({ expires: expires.toISOString() })
        expect(expiry).toEqual(expires)
      })

      it('is the maxAge from conf/app.ts cookie options when the expires passed is an invalid Date', async () => {
        const result = await testCookieExpiry({ expires: 'not a date' })
        expectExpiryAfterMaxAge(result, 4 * ONE_DAY)
      })

      it('is the maxAge passed when expires is passed too', async () => {
        const expires = toWholeSecond(Date.now() + 10 * ONE_DAY)
        const result = await testCookieExpiry({ expires: expires.toISOString(), maxAgeDays: 2 })
        expectExpiryAfterMaxAge(result, 2 * ONE_DAY)
      })

      it('is the maxAge from conf/app.ts cookie options when neither is passed', async () => {
        const result = await testCookieExpiry()
        expectExpiryAfterMaxAge(result, 4 * ONE_DAY)
      })

      it('is the maxAge from conf/app.ts cookie options for the cookie startSession sets', async () => {
        await User.create({ email: 'how@yadoin', password: 'password' })

        const requestStartedAt = Date.now()
        const res = await request.post('/login', 200, { data: { email: 'how@yadoin', password: 'password' } })
        const responseReceivedAt = Date.now()

        expectExpiryAfterMaxAge(
          { expiry: cookieExpiry(res.headers, 'session'), requestStartedAt, responseReceivedAt },
          4 * ONE_DAY,
        )
      })
    })
  })
})

async function testCookieExpiry(query: { expires?: string; maxAgeDays?: number } = {}) {
  const requestStartedAt = Date.now()
  const res = await request.get('/cookies-test', 204, { query })
  const responseReceivedAt = Date.now()
  return { expiry: cookieExpiry(res.headers, 'test_cookie'), requestStartedAt, responseReceivedAt }
}

function cookieExpiry(headers: Record<string, string | string[] | undefined>, cookieName: string) {
  const cookie = ([] as string[])
    .concat(headers['set-cookie'] ?? [])
    .find(setCookie => setCookie.startsWith(`${cookieName}=`))
  if (!cookie) throw new Error(`no ${cookieName} cookie was set`)

  const expires = /; expires=([^;]+)/.exec(cookie)?.[1]
  if (!expires) throw new Error(`the ${cookieName} cookie has no expires attribute: ${cookie}`)

  const expiry = new Date(expires)
  if (Number.isNaN(expiry.getTime()))
    throw new Error(`the ${cookieName} cookie has an invalid expires: ${cookie}`)
  return expiry
}

// the cookies library computes the expiry from the clock when it writes the
// header, which falls between these two readings
function expectExpiryAfterMaxAge(
  {
    expiry,
    requestStartedAt,
    responseReceivedAt,
  }: { expiry: Date; requestStartedAt: number; responseReceivedAt: number },
  maxAge: number,
) {
  expect(expiry.getTime()).toBeGreaterThanOrEqual(toWholeSecond(requestStartedAt + maxAge).getTime())
  expect(expiry.getTime()).toBeLessThanOrEqual(responseReceivedAt + maxAge)
}

// the header's expires attribute has whole-second precision
function toWholeSecond(milliseconds: number) {
  return new Date(Math.floor(milliseconds / 1000) * 1000)
}
