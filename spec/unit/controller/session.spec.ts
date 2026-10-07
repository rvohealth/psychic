import Koa from 'koa'
import { MockInstance } from 'vitest'
import InternalEncrypt from '../../../src/encrypt/internal-encrypt.js'
import Session, { CustomSessionCookieOptions } from '../../../src/session/index.js'
import User from '../../../test-app/src/app/models/User.js'
import { createMockKoaContext } from './helpers/mockRequest.js'

describe('Session', () => {
  let user: User
  let ctx: Koa.Context

  beforeEach(async () => {
    user = await User.create({ email: 'how@yadoin', password: 'password' })
    ctx = createMockKoaContext({
      body: { search: 'abc' },
      query: { cool: 'boyjohnson' },
    })
  })

  describe('#getCookie', () => {
    const subject = () => new Session(ctx).getCookie('auth_token')

    it('returns the value of an existing cookie, automatically decrypted', () => {
      const encrypted = InternalEncrypt.encryptCookie(user.id.toString())
      ctx = createMockKoaContext({
        cookies: { auth_token: encrypted },
      })
      expect(new Session(ctx).getCookie('auth_token')).toEqual(user.id.toString())
    })

    context('the cookie is not present in the request', () => {
      it('returns null', () => {
        expect(subject()).toBeNull()
      })
    })
  })

  describe('#setCookie', () => {
    let cookieSetSpy: MockInstance
    let encryptSpy: MockInstance

    beforeEach(() => {
      cookieSetSpy = vi.spyOn(ctx.cookies, 'set')
      encryptSpy = vi.spyOn(InternalEncrypt, 'encryptCookie').mockReturnValue('abc123')
    })

    const subject = (value: string, opts: CustomSessionCookieOptions = {}) =>
      new Session(ctx).setCookie('auth_token', value, opts)

    it('encrypts and stores the value as an httpOnly cookie, leveraging ttl from conf/app.ts cookie options', () => {
      subject(user.id.toString())
      expect(encryptSpy).toHaveBeenCalledWith(user.id.toString())
      expect(cookieSetSpy).toHaveBeenCalledWith('auth_token', 'abc123', {
        secure: false,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 4 * 60 * 60 * 24 * 1000,
      })
    })

    context('in production', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production'
      })

      afterEach(() => {
        process.env.NODE_ENV = 'test'
      })

      it('automatically sets secure to true', () => {
        subject(user.id.toString())
        expect(cookieSetSpy).toHaveBeenCalledWith(
          'auth_token',
          'abc123',
          expect.objectContaining({
            secure: true,
          }),
        )
      })
    })

    context('with options passed', () => {
      it('allows options to override default values', () => {
        subject(user.id.toString(), {
          secure: true,
          httpOnly: false,
          maxAge: {
            days: 1,
            hours: 1,
            minutes: 1,
            seconds: 1,
            milliseconds: 1,
          },
        })

        const daysMillis = 60 * 60 * 24 * 1000
        const hoursMillis = 1000 * 60 * 60
        const minutesMillis = 60 * 1000
        const millisecondsMillis = 1
        const secondsMillis = 1000
        const expectedMaxAge = daysMillis + hoursMillis + minutesMillis + secondsMillis + millisecondsMillis

        expect(cookieSetSpy).toHaveBeenCalledWith('auth_token', 'abc123', {
          secure: true,
          httpOnly: false,
          sameSite: 'strict',
          maxAge: expectedMaxAge,
        })
      })
    })

    context('with expires passed', () => {
      const expires = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)

      it('passes expires with no maxAge, so the default maxAge does not replace it', () => {
        subject(user.id.toString(), { expires })
        expect(cookieSetSpy).toHaveBeenCalledWith('auth_token', 'abc123', {
          secure: false,
          httpOnly: true,
          sameSite: 'strict',
          expires,
        })
      })

      context('when it is not a valid Date', () => {
        it('drops it and passes the default maxAge, as when no expires is passed', () => {
          subject(user.id.toString(), { expires: new Date('not a date') })
          expect(cookieSetSpy).toHaveBeenCalledWith('auth_token', 'abc123', {
            secure: false,
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 4 * 60 * 60 * 24 * 1000,
          })
        })

        it('drops one that is not a Date at all, rather than throwing', () => {
          subject(user.id.toString(), { expires: '2099-01-01' as unknown as Date })
          expect(cookieSetSpy).toHaveBeenCalledWith('auth_token', 'abc123', {
            secure: false,
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 4 * 60 * 60 * 24 * 1000,
          })
        })
      })

      context('with maxAge passed too', () => {
        it('passes the maxAge, which the cookies library sends in place of expires', () => {
          subject(user.id.toString(), { expires, maxAge: { days: 1 } })
          expect(cookieSetSpy).toHaveBeenCalledWith('auth_token', 'abc123', {
            secure: false,
            httpOnly: true,
            sameSite: 'strict',
            expires,
            maxAge: 24 * 60 * 60 * 1000,
          })
        })
      })
    })
  })
})
