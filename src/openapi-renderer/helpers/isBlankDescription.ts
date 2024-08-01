// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isBlankDescription(obj: any) {
  if (typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  if (Object.keys(obj).length > 1) return false

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return Object.keys(obj)[0] === 'description'
}
