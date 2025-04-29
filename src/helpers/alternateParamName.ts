import isArrayParamName from './isArrayParamName.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function alternateParamName(paramName: any) {
  if (typeof paramName !== 'string') throw new Error(`paramName is not a string. received: ${paramName}`)
  return isArrayParamName(paramName) ? paramName.replace(/\[\]$/, '') : `${paramName}[]`
}
