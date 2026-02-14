import Koa from 'koa'
import InternalEncrypt from '../encrypt/internal-encrypt.js'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts.js'
import EnvInternal from '../helpers/EnvInternal.js'
import PsychicApp, { CustomCookieOptions } from '../psychic-app/index.js'

export default class Session {
  constructor(private ctx: Koa.Context) {}

  public getCookie(name: string) {
    const value = this.ctx.cookies.get(name)
    if (value) return InternalEncrypt.decryptCookie(value)
    return null
  }

  public setCookie(name: string, data: string, opts: CustomSessionCookieOptions = {}) {
    this.ctx.cookies.set(name, InternalEncrypt.encryptCookie(data), {
      ...opts,
      secure: opts.secure ?? EnvInternal.isProduction,
      httpOnly: opts.httpOnly ?? true,
      maxAge: opts.maxAge
        ? cookieMaxAgeFromCookieOpts(opts.maxAge)
        : (PsychicApp.getOrFail().cookieOptions?.maxAge ?? cookieMaxAgeFromCookieOpts()),
    })
  }

  public clearCookie(name: string) {
    this.ctx.cookies.set(name, '', { maxAge: 0 })
  }

  public daysToMilliseconds(numDays: number) {
    return numDays * 60 * 60 * 24 * 1000
  }
}

export interface CustomSessionCookieOptions extends CustomCookieOptions {
  secure?: boolean
  httpOnly?: boolean
  domain?: string
  path?: string
  sameSite?: 'strict' | 'lax' | 'none' | boolean
  expires?: Date
  signed?: boolean
  overwrite?: boolean
}
