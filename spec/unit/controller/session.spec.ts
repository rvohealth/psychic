import { getMockReq, getMockRes } from '@jest-mock/express'
import { describe as context } from '@jest/globals'
import { Request, Response } from 'express'
import { Encrypt } from '../../../src'
import Session, { CustomSessionCookieOptions } from '../../../src/session'
import User from '../../../test-app/app/models/User'

describe('Session', () => {
  let user: User
  let req: Request
  let res: Response

  beforeEach(async () => {
    user = await User.create({ email: 'how@yadoin', password: 'password' })
    req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
    res = getMockRes().res
  })

  describe('#getCookie', () => {
    const subject = () => new Session(req, res).getCookie('auth_token')

    it('returns the value of an existing cookie, automatically decrypted', () => {
      req.cookies = { auth_token: Encrypt.sign(user.id.toString()) }
      expect(subject()).toEqual(user.id.toString())
    })

    context('the cookie is not present in the request', () => {
      it('returns null', () => {
        expect(subject()).toBeNull()
      })
    })
  })

  describe('#setCookie', () => {
    const subject = (value: string, opts: CustomSessionCookieOptions = {}) =>
      new Session(req, res).setCookie('auth_token', value, opts)
    let cookieSpy: jest.SpyInstance
    let encryptSpy: jest.SpyInstance

    beforeEach(() => {
      cookieSpy = jest.spyOn(res, 'cookie')
      encryptSpy = jest.spyOn(Encrypt, 'sign').mockReturnValue('abc123')
    })

    it('encrypts and stores the value as an httpOnly cookie, leveraging ttl from conf/app.ts cookie options', () => {
      subject(user.id.toString())
      expect(encryptSpy).toHaveBeenCalledWith(user.id.toString())
      expect(cookieSpy).toHaveBeenCalledWith('auth_token', 'abc123', {
        secure: false,
        httpOnly: true,
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
        expect(cookieSpy).toHaveBeenCalledWith(
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

        expect(cookieSpy).toHaveBeenCalledWith('auth_token', 'abc123', {
          secure: true,
          httpOnly: false,
          maxAge: expectedMaxAge,
        })
      })
    })
  })
})
