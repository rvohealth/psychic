import { DecryptionError, DecryptionRotationError } from '@rvoh/dream/errors'
import Koa from 'koa'
import InternalEncrypt from '../encrypt/internal-encrypt.js'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts.js'
import EnvInternal from '../helpers/EnvInternal.js'
import PsychicApp, { CustomCookieMaxAgeOptions, CustomCookieOptions } from '../psychic-app/index.js'

export default class Session {
  constructor(private ctx: Koa.Context) {}

  // A client can send any cookie value, so one that cannot be decrypted
  // (tampered with, garbage, or encrypted with a key no longer configured) is
  // read as absent, the way a missing cookie is, and the request goes on as if
  // the cookie was never sent. The cookie is left in place: clearing it could
  // miss a cookie set with a custom path or domain, and could wipe a fresh
  // session cookie set by a concurrent login. Errors that point at an app or
  // configuration bug, not at the value sent, still propagate, except that a
  // malformed value is read as absent even under a wrong-length key (see
  // undecryptableCookieErrorClassName).
  public getCookie(name: string) {
    const value = this.ctx.cookies.get(name)
    if (!value) return null

    try {
      return InternalEncrypt.decryptCookie(value)
    } catch (err) {
      const errorClassName = undecryptableCookieErrorClassName(err)
      if (!errorClassName) throw err

      // warn, not error: any client can trigger this, so logging it as an error
      // would let anyone flood error alerting. Never log the cookie value.
      PsychicApp.logWithLevel(
        'warn',
        `[psychic] could not decrypt cookie "${name}" (${errorClassName}); treating it as absent`,
      )
      return null
    }
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

// The name of the error class when err means the cookie value sent cannot be
// decrypted, else undefined. DecryptionParseError (the value decrypted but is
// not JSON) means the app encrypted the wrong format, and a key of the wrong
// length (which Dream wraps as the cause of a DecryptionError) means the app's
// encryption config is broken, so neither is the client's doing. Dream reports
// the wrong key length only once it reaches the key: a value too malformed to
// parse fails first, with a cause that is not ERR_CRYPTO_INVALID_KEYLEN, and so
// is read as absent. PsychicApp.init rejects a wrong-length key at boot in
// production and only warns elsewhere, so that case arises outside production.
function undecryptableCookieErrorClassName(err: unknown) {
  if (err instanceof DecryptionError) return isInvalidKeyLength(err) ? undefined : 'DecryptionError'

  if (err instanceof DecryptionRotationError)
    return isInvalidKeyLength(err.currentKeyError) || isInvalidKeyLength(err.legacyKeyError)
      ? undefined
      : 'DecryptionRotationError'

  return undefined
}

function isInvalidKeyLength(err: DecryptionError) {
  return (err.cause as { code?: unknown } | undefined)?.code === 'ERR_CRYPTO_INVALID_KEYLEN'
}

// an expires that is not a valid Date (e.g. new Date('garbage'), or a string
// from untyped code) is treated as no expires, so the header never carries
// `expires=Invalid Date`
function validDateOrUndefined(date: unknown): Date | undefined {
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : undefined
}
