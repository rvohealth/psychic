import { stat } from 'fs/promises'

export default async function fileExists(path) {
  return !!(await stat(path).catch(() => false))
}
