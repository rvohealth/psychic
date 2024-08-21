import { CookieOptions, Request, Response } from 'express'
import Encrypt from '../encryption/encrypt'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts'
import envValue from '../helpers/envValue'
import PsychicApplication, { CustomCookieOptions } from '../psychic-application'

export default class Session {
  constructor(
    private req: Request,
    private res: Response,
  ) {}

  public getCookie(name: string) {
    const cookies = this.req.cookies as Record<string, string>
    const value = cookies[name]
    if (value) return Encrypt.decode(value)
    return null
  }

  public setCookie(name: string, data: string, opts: CustomSessionCookieOptions = {}) {
    this.res.cookie(name, Encrypt.sign(data), {
      secure: envValue('NODE_ENV') === 'production',
      httpOnly: true,
      ...opts,
      maxAge: opts.maxAge
        ? cookieMaxAgeFromCookieOpts(opts.maxAge)
        : PsychicApplication.getOrFail().cookieOptions?.maxAge,
    })
  }

  public clearCookie(name: string) {
    this.res.clearCookie(name)
  }

  public daysToMilliseconds(numDays: number) {
    return numDays * 60 * 60 * 24 * 1000
  }
}

export type CustomSessionCookieOptions = Omit<CookieOptions, 'maxAge'> & CustomCookieOptions
