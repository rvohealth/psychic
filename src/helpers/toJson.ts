import { sanitizeString } from '@rvoh/dream/utils'

export default function toJson<T>(data: T, sanitize: boolean): string {
  /**
   * 'undefined' is invalid json, and `JSON.stringify(undefined)` returns `undefined`
   * so follow the pattern established by Express and return '{}' for `undefined`
   */
  if (data === undefined) return '{}'

  if (sanitize) {
    return JSON.stringify(data, (_: string, x: T) => (typeof x !== 'string' ? x : sanitizeString(x))).replace(
      /\\\\/g,
      '\\',
    )
  } else {
    return JSON.stringify(data)
  }
}
