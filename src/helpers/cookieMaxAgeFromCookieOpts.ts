import { CustomCookieMaxAgeOptions } from '../psychic-application/index.js.js'

const DEFAULT_COOKIE_MAX_AGE_DAYS = 31

export default function cookieMaxAgeFromCookieOpts(
  cookieOpts: CustomCookieMaxAgeOptions | undefined,
): number {
  const defaultMaxAge = DEFAULT_COOKIE_MAX_AGE_DAYS * 60 * 60 * 24 * 1000

  if (!cookieOpts) return defaultMaxAge
  if (
    !cookieOpts.milliseconds &&
    !cookieOpts.seconds &&
    !cookieOpts.minutes &&
    !cookieOpts.hours &&
    !cookieOpts.days
  )
    return defaultMaxAge

  return (
    (cookieOpts.milliseconds || 0) +
    (cookieOpts.seconds ? cookieOpts.seconds * 1000 : 0) +
    (cookieOpts.minutes ? cookieOpts.minutes * 60 * 1000 : 0) +
    (cookieOpts.hours ? cookieOpts.hours * 60 * 60 * 1000 : 0) +
    (cookieOpts.days ? cookieOpts.days * 60 * 60 * 24 * 1000 : 0)
  )
}
