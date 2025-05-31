import isObject from '../../helpers/isObject.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isPaginatedResult(result: any) {
  if (!isObject(result)) return false

  const paginatedFields = ['currentPage', 'pageCount', 'recordCount', 'results']
  const keys = Object.keys(result as object)
  if (keys.length !== paginatedFields.length) return false

  for (const paginatedField of paginatedFields) {
    if (!keys.includes(paginatedField)) return false
  }

  return true
}
