// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isArrayParamName(paramName: any) {
  if (typeof paramName !== 'string') return false
  return /\[\]$/.test(paramName)
}
