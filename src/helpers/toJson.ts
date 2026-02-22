export default function toJson<T>(data: T): string {
  /**
   * 'undefined' is invalid json, and `JSON.stringify(undefined)` returns `undefined`
   * so follow the pattern established by Express and return '{}' for `undefined`
   */
  if (data === undefined) return '{}'

  return JSON.stringify(data)
}
