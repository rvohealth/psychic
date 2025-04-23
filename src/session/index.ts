import { CookieOptions, Request, Response } from 'express'
import InternalEncrypt from '../encrypt/internal-encrypt.js'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts.js'
import EnvInternal from '../helpers/EnvInternal.js'
import PsychicApp, { CustomCookieOptions } from '../psychic-app/index.js'

export default class Session {
  constructor(
    private req: Request,
    private res: Response,
  ) {}

  public getCookie(name: string) {
    const cookies = this.req.cookies as Record<string, string>
    const value = cookies[name]
    if (value) return InternalEncrypt.decryptCookie(value)
    return null
  }

  public setCookie(name: string, data: string, opts: CustomSessionCookieOptions = {}) {
    this.res.cookie(name, InternalEncrypt.encryptCookie(data), {
      secure: EnvInternal.isProduction,
      httpOnly: true,
      ...opts,
      maxAge: opts.maxAge
        ? cookieMaxAgeFromCookieOpts(opts.maxAge)
        : PsychicApp.getOrFail().cookieOptions?.maxAge,
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
