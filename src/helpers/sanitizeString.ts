const CHARACTERS_TO_SANITIZE_REGEXP = /[\\&<>/'"]/g

export default function sanitizeString<T extends string | null | undefined>(str: T): T {
  if (str === null || str === undefined) return str

  return str.replace(CHARACTERS_TO_SANITIZE_REGEXP, function (char) {
    switch (char) {
      case '\\':
        return '\\u005c'
      case '/':
        return '\\u002f'
      case '<':
        return '\\u003c'
      case '>':
        return '\\u003e'
      case '&':
        return '\\u0026'
      case "'":
        return '\\u0027'
      case '"':
        return '\\u0022'
      default:
        return char
    }
  }) as T
}
