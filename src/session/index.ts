import { CookieOptions, Request, Response } from 'express'
import Encrypt from '../encryption/encrypt'
import PsychicConfig, { CustomCookieOptions } from '../config'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts'

export default class Session {
  constructor(
    private req: Request,
    private res: Response,
    private config: PsychicConfig,
  ) {}

  public getCookie(name: string) {
    const cookies = this.req.cookies as Record<string, string>
    const value = cookies[name]
    if (value) return Encrypt.decode(value)
    return null
  }

  public setCookie(name: string, data: string, opts: CustomSessionCookieOptions = {}) {
    this.res.cookie(name, Encrypt.sign(data), {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      ...opts,
      maxAge: opts.maxAge ? cookieMaxAgeFromCookieOpts(opts.maxAge) : this.config.cookieOptions.maxAge,
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
