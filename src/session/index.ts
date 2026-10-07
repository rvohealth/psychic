import Koa from 'koa'
import InternalEncrypt from '../encrypt/internal-encrypt.js'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts.js'
import EnvInternal from '../helpers/EnvInternal.js'
import PsychicApp, { CustomCookieMaxAgeOptions, CustomCookieOptions } from '../psychic-app/index.js'

export default class Session {
  constructor(private ctx: Koa.Context) {}

  public getCookie(name: string) {
    const value = this.ctx.cookies.get(name)
    if (value) return InternalEncrypt.decryptCookie(value)
    return null
  }

  public setCookie(name: string, data: string, opts: CustomSessionCookieOptions = {}) {
    const expires = validDateOrUndefined(opts.expires)

    this.ctx.cookies.set(name, InternalEncrypt.encryptCookie(data), {
      ...opts,
      secure: opts.secure ?? EnvInternal.isProduction,
      httpOnly: opts.httpOnly ?? true,
      // Psychic is a pure JSON API backend — it never renders HTML, so there
      // is no link-click-navigates-to-Psychic UX that would need Lax. Strict
      // blocks ALL cross-site cookie sending, which is the correct default
      // for an API: the cookie should only ride requests that originated
      // from our own client code, never from third-party pages.
      sameSite: opts.sameSite ?? 'strict',
      expires,
      maxAge: this.cookieMaxAge(opts.maxAge, expires),
    })
  }

  // The cookies library never sends Max-Age: when it gets a maxAge, it sends
  // an expires computed from it, replacing any expires passed. So a maxAge
  // passed always wins, and an expires passed without one must get no
  // default maxAge, or the default would replace it.
  private cookieMaxAge(maxAge: CustomCookieMaxAgeOptions | undefined, expires: Date | undefined) {
    if (maxAge) return cookieMaxAgeFromCookieOpts(maxAge)
    if (expires) return undefined
    return PsychicApp.getOrFail().cookieOptions?.maxAge ?? cookieMaxAgeFromCookieOpts()
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
  /**
   * When the cookie expires. When `maxAge` is passed too, `maxAge` wins.
   * When neither is passed, the app's `cookie` `maxAge` applies. An invalid
   * Date (e.g. `new Date('garbage')`) counts as not passed.
   */
  expires?: Date
  signed?: boolean
  overwrite?: boolean
}

// an expires that is not a valid Date (e.g. new Date('garbage'), or a string
// from untyped code) is treated as no expires, so the header never carries
// `expires=Invalid Date`
function validDateOrUndefined(date: unknown): Date | undefined {
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : undefined
}
