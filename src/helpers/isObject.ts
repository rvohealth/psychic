// also in Dream
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isObject(x: any): boolean {
  if (x === null) return false
  if (Array.isArray(x)) return false
  return typeof x === 'object'
}
